const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    profit: { type: Number },
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
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    duration: { type: Number }, // Duration in seconds
    createdAt: { type: Date, default: Date.now }, // Explicitly define createdAt
    updatedAt: { type: Date, default: Date.now }, // Explicitly define updatedAt
  },
  { timestamps: true } // This will still automatically update updatedAt
);

// Pre-save middleware to calculate duration when position is closed
activitySchema.pre("save", function (next) {
  if (!this.isOpen && !this.closedAt) {
    this.closedAt = new Date();
    this.duration = Math.floor((this.closedAt - this.openedAt) / 1000); // Duration in seconds
  }
  // Update the updatedAt field
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Activity", activitySchema);
