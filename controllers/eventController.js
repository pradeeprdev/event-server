const Event = require("../models/Event");
const Seat = require("../models/Seat");

// @desc    Get all events (with optional search/category filter)
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (category) {
      filter.category = category;
    }

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new event (and auto-generate its seats)
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { name, description, date, venue, category, image, seatLayout } = req.body;

    if (!name || !date || !venue || !seatLayout) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    const event = await Event.create({
      name,
      description,
      date,
      venue,
      category,
      image,
      seatLayout,
    });

    // Auto-generate seats based on rows / seatsPerRow
    const { rows, seatsPerRow, price } = seatLayout;
    const seatsToCreate = [];

    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(65 + r); // A, B, C...
      for (let s = 1; s <= seatsPerRow; s++) {
        seatsToCreate.push({
          event: event._id,
          seatNumber: `${rowLabel}${s}`,
          row: rowLabel,
          price,
          status: "available",
        });
      }
    }

    await Seat.insertMany(seatsToCreate);

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    Object.assign(event, req.body);
    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event (and its seats)
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await Seat.deleteMany({ event: event._id });
    await event.deleteOne();

    res.json({ message: "Event removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
