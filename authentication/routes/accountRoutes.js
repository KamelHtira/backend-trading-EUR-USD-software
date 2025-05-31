const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const authenticateToken = require("../middleware/authenticateToken");

/**
 * @swagger
 * /account/balance:
 *   get:
 *     summary: Get user account balance
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
 *       401:
 *         description: Access denied
 */
router.get("/balance", authenticateToken, accountController.getBalance);

/**
 * @swagger
 * /account/activities:
 *   get:
 *     summary: Get user trading activities
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 *       401:
 *         description: Access denied
 */
router.get("/activities", authenticateToken, accountController.getActivities);

/**
 * @swagger
 * /account/open-positions:
 *   get:
 *     summary: Get user open positions
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Open positions retrieved successfully
 *       401:
 *         description: Access denied
 */
router.get(
  "/open-positions",
  authenticateToken,
  accountController.getOpenPositions
);

/**
 * @swagger
 * /account/open-position:
 *   post:
 *     summary: Open a new trading position
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pair
 *               - side
 *               - type
 *               - amount
 *             properties:
 *               pair:
 *                 type: string
 *                 example: "BTCUSDT"
 *               side:
 *                 type: string
 *                 enum: [BUY, SELL]
 *                 example: "BUY"
 *               type:
 *                 type: string
 *                 enum: [MARKET, LIMIT, STOP, STOP_LIMIT]
 *                 example: "MARKET"
 *               amount:
 *                 type: number
 *                 example: 0.01
 *               price:
 *                 type: number
 *                 example: 50000
 *               leverage:
 *                 type: number
 *                 example: 10
 *               stopPrice:
 *                 type: number
 *                 example: 49000
 *               timeInForce:
 *                 type: string
 *                 enum: [GTC, IOC, FOK]
 *                 default: GTC
 *                 example: "GTC"
 *               positionSide:
 *                 type: string
 *                 enum: [LONG, SHORT, BOTH]
 *                 default: BOTH
 *                 example: "LONG"
 *     responses:
 *       200:
 *         description: Position opened successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Access denied
 */
router.post(
  "/open-position",
  authenticateToken,
  accountController.openPosition
);

/**
 * @swagger
 * /account/close-position:
 *   post:
 *     summary: Close an existing trading position
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positionId
 *             properties:
 *               positionId:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Position closed successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Access denied
 *       404:
 *         description: Position not found
 */
router.post(
  "/close-position",
  authenticateToken,
  accountController.closePosition
);

/**
 * @swagger
 * /account/predict-price:
 *   post:
 *     summary: Get price prediction based on historical data
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prices
 *             properties:
 *               prices:
 *                 type: array
 *                 items:
 *                   type: number
 *                 minItems: 100
 *                 example: [1.23, 1.45, 1.67, ...]
 *     responses:
 *       200:
 *         description: Price prediction generated successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Access denied
 *       500:
 *         description: Error generating prediction
 */
router.post(
  "/predict-price",
  authenticateToken,
  accountController.predictPrice
);

/**
 * @swagger
 * /account/eurusd-data:
 *   get:
 *     summary: Get EUR/USD price data for chart display
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: EUR/USD data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                   example: "EUR/USD"
 *                 interval:
 *                   type: string
 *                   example: "1min"
 *                 currencyBase:
 *                   type: string
 *                   example: "Euro"
 *                 currencyQuote:
 *                   type: string
 *                   example: "US Dollar"
 *                 type:
 *                   type: string
 *                   example: "Physical Currency"
 *                 values:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       datetime:
 *                         type: string
 *                         example: "2025-05-30 06:00:00"
 *                       open:
 *                         type: number
 *                         example: 1.13671
 *                       high:
 *                         type: number
 *                         example: 1.13677
 *                       low:
 *                         type: number
 *                         example: 1.13653
 *                       close:
 *                         type: number
 *                         example: 1.13661
 *       401:
 *         description: Access denied
 *       500:
 *         description: Error fetching data
 */
router.get("/eurusd-data", authenticateToken, accountController.getEURUSDData);

module.exports = router;
