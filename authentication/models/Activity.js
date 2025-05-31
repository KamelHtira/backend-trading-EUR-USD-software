const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  pair: { type: String, required: true },
  side: { type: String, enum: ["BUY", "SELL"], required: true },
  type: {
    type: String,
    enum: ["MARKET", "LIMIT", "STOP", "STOP_LIMIT"],
    required: true,
  },
  price: { type: Number },
  amount: { type: Number },
  total: { type: Number },
  pnl: { type: Number },
  leverage: { type: Number },
  stopPrice: { type: Number },
  timeInForce: { type: String, enum: ["GTC", "IOC", "FOK"], default: "GTC" },
  positionSide: {
    type: String,
    enum: ["LONG", "SHORT", "BOTH"],
    default: "BOTH",
  },
  orderId: { type: String },
  status: {
    type: String,
    enum: ["NEW", "FILLED", "PARTIALLY_FILLED", "CANCELED", "EXPIRED"],
    default: "NEW",
  },
  isOpen: { type: Boolean, default: true },
});

module.exports = mongoose.model("Activity", activitySchema);
