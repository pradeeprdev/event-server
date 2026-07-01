const Seat = require("../models/Seat");
const mongoose = require("mongoose");

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Helper: release any expired locks for an event before reading availability
const releaseExpiredLocks = async (eventId) => {
  await Seat.updateMany(
    {
      event: eventId,
      status: "locked",
      lockExpiresAt: { $lte: new Date() },
    },
    {
      $set: { status: "available", lockedBy: null, lockExpiresAt: null },
    }
  );
};

// @desc    Get all seats for an event (real-time availability)
// @route   GET /api/seats/event/:eventId
// @access  Public
const getSeatsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    await releaseExpiredLocks(eventId);

    const seats = await Seat.find({ event: eventId }).sort({ row: 1, seatNumber: 1 });
    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Temporarily lock selected seats while user checks out
// @route   POST /api/seats/lock
// @access  Private
const lockSeats = async (req, res) => {
  try {
    const { eventId, seatIds } = req.body;
    const userId = req.user._id;

    if (!eventId || !seatIds || !seatIds.length) {
      return res.status(400).json({ message: "eventId and seatIds are required" });
    }

    await releaseExpiredLocks(eventId);

    const seats = await Seat.find({ _id: { $in: seatIds }, event: eventId });

    if (seats.length !== seatIds.length) {
      return res.status(404).json({ message: "One or more seats not found" });
    }

    const unavailable = seats.filter(
      (s) => s.status === "booked" || (s.status === "locked" && String(s.lockedBy) !== String(userId))
    );

    if (unavailable.length > 0) {
      return res.status(409).json({
        message: "Some seats are no longer available",
        seats: unavailable.map((s) => s.seatNumber),
      });
    }

    const lockExpiresAt = new Date(Date.now() + LOCK_DURATION_MS);

    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: { status: "locked", lockedBy: userId, lockExpiresAt } }
    );

    res.json({ message: "Seats locked", lockExpiresAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Release locked seats (e.g. user cancels checkout)
// @route   POST /api/seats/release
// @access  Private
const releaseSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;
    const userId = req.user._id;

    await Seat.updateMany(
      { _id: { $in: seatIds }, lockedBy: userId },
      { $set: { status: "available", lockedBy: null, lockExpiresAt: null } }
    );

    res.json({ message: "Seats released" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSeatsForEvent, lockSeats, releaseSeats };
