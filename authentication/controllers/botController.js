const User = require("../models/User");
const Activity = require("../models/Activity");
const responseHandler = require("../middleware/responseHandler");
const axios = require("axios");
const https = require("https");

// Store active bots
const activeBots = new Map();

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 8000; // 8 seconds between requests (to stay under 8 requests per minute)

// Trade limiting state
const tradeCounts = new Map(); // Track trades per minute per user
const MAX_TRADES_PER_MINUTE = 3;
const MAX_OPEN_POSITIONS = 10;

// Helper function to reset trade count
function resetTradeCount(userId) {
  tradeCounts.set(userId, 0);
}

// Helper function to check and increment trade count
function canMakeTrade(userId) {
  const currentCount = tradeCounts.get(userId) || 0;
  if (currentCount >= MAX_TRADES_PER_MINUTE) {
    return false;
  }
  tradeCounts.set(userId, currentCount + 1);
  return true;
}

// Helper function to get market data
async function getMarketData() {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();

  const options = {
    method: "GET",
    hostname: "api.twelvedata.com",
    path: "/time_series?apikey=4ee0f7ad203a47b9a6874f04725a69a4&interval=1min&symbol=EUR/USD&outputsize=100",
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks);
        const data = JSON.parse(body.toString());

        // Debug logging
        console.log("API Response:", JSON.stringify(data, null, 2));

        // Handle rate limit error
        if (data.code === 429) {
          console.log("Rate limit hit, waiting before retry...");
          setTimeout(() => {
            getMarketData().then(resolve).catch(reject);
          }, 60000); // Wait 1 minute before retry
          return;
        }

        // Check if we have valid data
        if (!data || !data.values || !Array.isArray(data.values)) {
          console.error("Invalid data structure:", {
            hasData: !!data,
            hasValues: !!(data && data.values),
            isArray: !!(data && data.values && Array.isArray(data.values)),
          });
          reject(new Error("Invalid data format received from API"));
          return;
        }

        // Extract closing prices
        const prices = data.values.map((item) => {
          if (!item || typeof item.close === "undefined") {
            console.error("Invalid price item:", item);
            throw new Error("Invalid price data in API response");
          }
          return parseFloat(item.close);
        });

        resolve(prices);
      });
      response.on("error", (error) => {
        console.error("API Response Error:", error);
        reject(new Error(`API request failed: ${error.message}`));
      });
    });

    req.on("error", (error) => {
      console.error("Request Error:", error);
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Helper function to get price prediction
async function getPricePrediction(prices) {
  const response = await axios.post(
    "https://tradingmodel-production.up.railway.app/predict",
    { prices }
  );
  return response.data;
}

// Helper function to calculate average prediction
function calculateAveragePrediction(predictions) {
  return (
    predictions.predicted_prices.reduce((a, b) => a + b, 0) / predictions.length
  );
}

// Helper function to get random time between 5-30 seconds
function getRandomCloseTime() {
  return Math.floor(Math.random() * (30 - 5 + 1)) + 5;
}

// Helper function to get latest market price
async function getLatestPrice() {
  const options = {
    method: "GET",
    hostname: "api.twelvedata.com",
    path: "/time_series?apikey=4ee0f7ad203a47b9a6874f04725a69a4&interval=1min&symbol=EUR/USD&outputsize=1",
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks);
        const data = JSON.parse(body.toString());

        if (data.code === 429) {
          reject(new Error("Rate limit hit"));
          return;
        }

        if (
          !data ||
          !data.values ||
          !Array.isArray(data.values) ||
          data.values.length === 0
        ) {
          reject(new Error("Invalid data format received from API"));
          return;
        }

        const latestPrice = parseFloat(data.values[0].close);
        resolve(latestPrice);
      });
      response.on("error", reject);
    });

    req.on("error", reject);
    req.end();
  });
}

// Bot trading logic
async function runBot(userId) {
  if (activeBots.has(userId)) {
    const bot = activeBots.get(userId);

    try {
      // Get market data
      const prices = await getMarketData();

      // Get prediction
      const predictions = await getPricePrediction(prices);
      const avgPrediction = calculateAveragePrediction(predictions);
      const currentPrice = prices[prices.length - 1];

      // Get user's open positions
      const openPositions = await Activity.find({
        userId,
        isOpen: true,
        status: { $in: ["NEW", "FILLED", "PARTIALLY_FILLED"] },
      });

      // Check if we can open new positions (max 10)
      if (openPositions.length < MAX_OPEN_POSITIONS && canMakeTrade(userId)) {
        // Get user balance
        const user = await User.findById(userId);
        const tradeAmount = user.balance * 0.01; // Use 1% of balance per trade

        // Check if user has enough balance
        if (tradeAmount <= 0) {
          console.log(`User ${userId} has insufficient balance`);
          bot.timeout = setTimeout(() => runBot(userId), MIN_REQUEST_INTERVAL);
          return;
        }

        // Determine trade direction
        const side = currentPrice > avgPrediction ? "SELL" : "BUY";

        // Deduct balance from user
        user.balance -= tradeAmount;
        await user.save();

        // Open new position
        const position = new Activity({
          userId,
          pair: "EUR/USD",
          side,
          type: "MARKET",
          amount: tradeAmount,
          price: currentPrice,
          total: tradeAmount,
          status: "NEW",
          isOpen: true,
          openedAt: new Date(),
        });

        await position.save();

        // Schedule position close
        const closeTime = getRandomCloseTime() * 1000;
        setTimeout(async () => {
          try {
            // Get latest price
            const latestPrice = await getLatestPrice();

            // Calculate profit/loss
            let profit;
            if (side === "BUY") {
              profit = (latestPrice - position.price) * position.amount;
            } else {
              profit = (position.price - latestPrice) * position.amount;
            }

            // Update position
            position.isOpen = false;
            position.status = "CANCELED";
            position.closedAt = new Date();
            position.duration = Math.floor(
              (position.closedAt - position.openedAt) / 1000
            );
            position.profit = profit;
            await position.save();

            // Update user balance with profit/loss
            const user = await User.findById(userId);
            user.balance += profit;
            await user.save();

            console.log(
              `Position closed for user ${userId}. Profit: ${profit}`
            );
          } catch (error) {
            console.error(`Error closing position for user ${userId}:`, error);
          }
        }, closeTime);
      }

      // Schedule next iteration with increased delay
      bot.timeout = setTimeout(() => runBot(userId), MIN_REQUEST_INTERVAL);
    } catch (error) {
      console.error(`Bot error for user ${userId}:`, error);
      // Schedule retry with increased delay
      bot.timeout = setTimeout(() => runBot(userId), MIN_REQUEST_INTERVAL);
    }
  }
}

exports.startBot = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if bot is already running
    if (activeBots.has(userId)) {
      return responseHandler(res, 400, "Bot is already running");
    }

    // Initialize bot and trade count
    activeBots.set(userId, { running: true });
    resetTradeCount(userId);

    // Set up trade count reset every minute
    const resetInterval = setInterval(() => {
      if (activeBots.has(userId)) {
        resetTradeCount(userId);
      } else {
        clearInterval(resetInterval);
      }
    }, 60000);

    // Start bot
    runBot(userId);

    responseHandler(res, 200, "Bot started successfully");
  } catch (error) {
    responseHandler(res, 500, "Error starting bot: " + error.message);
  }
};

exports.stopBot = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if bot is running
    if (!activeBots.has(userId)) {
      return responseHandler(res, 400, "Bot is not running");
    }

    // Get bot instance
    const bot = activeBots.get(userId);

    // Clear timeout
    if (bot.timeout) {
      clearTimeout(bot.timeout);
    }

    // Remove bot and trade count
    activeBots.delete(userId);
    tradeCounts.delete(userId);

    responseHandler(res, 200, "Bot stopped successfully");
  } catch (error) {
    responseHandler(res, 500, "Error stopping bot: " + error.message);
  }
};

exports.getBotStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const isRunning = activeBots.has(userId);

    responseHandler(res, 200, "Bot status retrieved successfully", {
      isRunning,
    });
  } catch (error) {
    responseHandler(res, 500, "Error getting bot status: " + error.message);
  }
};
