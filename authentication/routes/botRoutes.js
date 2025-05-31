const express = require("express");
const router = express.Router();
const botController = require("../controllers/botController");
const authenticateToken = require("../middleware/authenticateToken");

/**
 * @swagger
 * /bot/start:
 *   post:
 *     summary: Start the trading bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bot started successfully
 *       400:
 *         description: Bot is already running
 *       401:
 *         description: Access denied
 *       500:
 *         description: Error starting bot
 */
router.post("/start", authenticateToken, botController.startBot);

/**
 * @swagger
 * /bot/stop:
 *   post:
 *     summary: Stop the trading bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bot stopped successfully
 *       400:
 *         description: Bot is not running
 *       401:
 *         description: Access denied
 *       500:
 *         description: Error stopping bot
 */
router.post("/stop", authenticateToken, botController.stopBot);

/**
 * @swagger
 * /bot/status:
 *   get:
 *     summary: Get bot status
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bot status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isRunning:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Access denied
 *       500:
 *         description: Error getting bot status
 */
router.get("/status", authenticateToken, botController.getBotStatus);

module.exports = router;
