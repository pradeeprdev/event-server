const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
    },
    category: {
      type: String,
      default: "General",
    },
    image: {
      type: String,
      default: "",
    },
    // Seat layout configuration used to generate Seat documents
    seatLayout: {
      rows: { type: Number, required: true, default: 5 }, // e.g. A-E
      seatsPerRow: { type: Number, required: true, default: 10 },
      price: { type: Number, required: true, default: 200 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
