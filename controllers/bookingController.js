const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Event = require("../models/Event");

// @desc    Book tickets (confirms locked seats + simulates payment)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { eventId, seatIds } = req.body;
    const userId = req.user._id;

    if (!eventId || !seatIds || !seatIds.length) {
      return res.status(400).json({ message: "eventId and seatIds are required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot book seats for a past event" });
    }

    const seats = await Seat.find({ _id: { $in: seatIds }, event: eventId });

    if (seats.length !== seatIds.length) {
      return res.status(404).json({ message: "One or more seats not found" });
    }

    // Ensure seats are either locked by this user or still available
    const invalidSeats = seats.filter(
      (s) =>
        s.status === "booked" ||
        (s.status === "locked" && String(s.lockedBy) !== String(userId))
    );

    if (invalidSeats.length > 0) {
      return res.status(409).json({
        message: "Some seats are no longer available",
        seats: invalidSeats.map((s) => s.seatNumber),
      });
    }

    const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);

    // --- Simulated payment gateway ---
    const paymentSuccess = true; // replace with real gateway integration
    const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    if (!paymentSuccess) {
      return res.status(402).json({ message: "Payment failed. Please try again." });
    }

    // Mark seats as booked
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: { status: "booked", lockedBy: null, lockExpiresAt: null } }
    );

    const booking = await Booking.create({
      user: userId,
      event: eventId,
      seats: seatIds,
      seatNumbers: seats.map((s) => s.seatNumber),
      totalAmount,
      paymentStatus: "paid",
      paymentId,
      status: "confirmed",
    });

    const populated = await booking.populate([
      { path: "event", select: "name date venue" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user's booking history
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "name date venue image")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "event",
      "name date venue image"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a booking (only before event starts)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("event");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    if (new Date(booking.event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot cancel a booking after the event has started" });
    }

    // Free up the seats
    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      { $set: { status: "available", lockedBy: null, lockExpiresAt: null } }
    );

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };
