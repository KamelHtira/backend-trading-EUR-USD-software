const User = require("../models/User");
const Activity = require("../models/Activity");
const responseHandler = require("../middleware/responseHandler");
const axios = require("axios");
const https = require("https");

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    responseHandler(res, 200, "Balance retrieved successfully", {
      balance: user.balance,
      currency: user.accountCurrency,
    });
  } catch (error) {
    responseHandler(res, 400, error.message);
  }
};

exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user.id }).sort({
      date: -1,
    });
    responseHandler(res, 200, "Activities retrieved successfully", activities);
  } catch (error) {
    responseHandler(res, 400, error.message);
  }
};

exports.getOpenPositions = async (req, res) => {
  try {
    const openPositions = await Activity.find({
      userId: req.user.id,
      isOpen: true,
      status: { $in: ["NEW", "FILLED", "PARTIALLY_FILLED"] },
    }).sort({ date: -1 });

    responseHandler(
      res,
      200,
      "Open positions retrieved successfully",
      openPositions
    );
  } catch (error) {
    responseHandler(res, 400, error.message);
  }
};

exports.openPosition = async (req, res) => {
  try {
    const {
      pair,
      side,
      type,
      amount,
      price,
      leverage,
      stopPrice,
      timeInForce,
      positionSide,
    } = req.body;

    // Validate required fields
    if (!pair || !side || !type || !amount) {
      return responseHandler(res, 400, "Missing required fields");
    }

    // Validate side
    if (!["BUY", "SELL"].includes(side)) {
      return responseHandler(res, 400, "Invalid side. Must be BUY or SELL");
    }

    // Validate type
    if (!["MARKET", "LIMIT", "STOP", "STOP_LIMIT"].includes(type)) {
      return responseHandler(res, 400, "Invalid type");
    }

    // Validate timeInForce if provided
    if (timeInForce && !["GTC", "IOC", "FOK"].includes(timeInForce)) {
      return responseHandler(res, 400, "Invalid timeInForce");
    }

    // Validate positionSide if provided
    if (positionSide && !["LONG", "SHORT", "BOTH"].includes(positionSide)) {
      return responseHandler(res, 400, "Invalid positionSide");
    }

    // Calculate total if price is provided
    const total = price ? price * amount : null;

    // Create new position
    const position = new Activity({
      userId: req.user.id,
      pair,
      side,
      type,
      amount,
      price,
      total,
      leverage,
      stopPrice,
      timeInForce,
      positionSide,
      status: "NEW",
      isOpen: true,
    });

    await position.save();

    responseHandler(res, 200, "Position opened successfully", position);
  } catch (error) {
    responseHandler(res, 400, error.message);
  }
};

exports.closePosition = async (req, res) => {
  try {
    const { positionId } = req.body;

    if (!positionId) {
      return responseHandler(res, 400, "Position ID is required");
    }

    // Find the open position
    const position = await Activity.findOne({
      _id: positionId,
      userId: req.user.id,
      isOpen: true,
      status: { $in: ["NEW", "FILLED", "PARTIALLY_FILLED"] },
    });

    if (!position) {
      return responseHandler(res, 404, "Position not found or already closed");
    }

    // Update position status
    position.isOpen = false;
    position.status = "CANCELED";
    await position.save();

    responseHandler(res, 200, "Position closed successfully", position);
  } catch (error) {
    responseHandler(res, 400, error.message);
  }
};

exports.predictPrice = async (req, res) => {
  try {
    const { prices } = req.body;

    // Validate input
    if (!prices || !Array.isArray(prices) || prices.length < 100) {
      return responseHandler(
        res,
        400,
        "At least 100 price points are required for prediction"
      );
    }

    // Make request to prediction API
    const response = await axios.post(
      "https://tradingmodel-production.up.railway.app/predict",
      { prices }
    );

    responseHandler(
      res,
      200,
      "Price prediction generated successfully",
      response.data
    );
  } catch (error) {
    responseHandler(
      res,
      500,
      "Error generating price prediction: " + error.message
    );
  }
};

exports.getEURUSDData = async (req, res) => {
  try {
    const options = {
      method: "GET",
      hostname: "api.twelvedata.com",
      path: "/time_series?apikey=4ee0f7ad203a47b9a6874f04725a69a4&interval=1min&symbol=EUR/USD&outputsize=100",
    };

    const request = new Promise((resolve, reject) => {
      const req = https.request(options, (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const body = Buffer.concat(chunks);
          resolve(JSON.parse(body.toString()));
        });

        response.on("error", (error) => {
          reject(error);
        });
      });

      req.end();
    });

    const data = await request;

    // Format data for chart display
    const formattedData = {
      symbol: data.meta.symbol,
      interval: data.meta.interval,
      currencyBase: data.meta.currency_base,
      currencyQuote: data.meta.currency_quote,
      type: data.meta.type,
      values: data.values.map((item) => ({
        datetime: item.datetime,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
      })),
    };

    responseHandler(
      res,
      200,
      "EUR/USD data retrieved successfully",
      formattedData
    );
  } catch (error) {
    responseHandler(res, 500, "Error fetching EUR/USD data: " + error.message);
  }
};
