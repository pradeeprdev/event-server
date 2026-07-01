const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seatNumber: {
      type: String, // e.g. "A1", "B5"
      required: true,
    },
    row: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },
    // Optional short-lived lock to prevent double-booking during checkout
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A seat number must be unique per event
seatSchema.index({ event: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
