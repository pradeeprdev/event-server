const express = require("express");
const router = express.Router();
const { getSeatsForEvent, lockSeats, releaseSeats } = require("../controllers/seatController");
const { protect } = require("../middleware/auth");

router.get("/event/:eventId", getSeatsForEvent);
router.post("/lock", protect, lockSeats);
router.post("/release", protect, releaseSeats);

module.exports = router;