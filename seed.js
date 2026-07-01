// Run with: npm run seed
// Populates the database with sample events + auto-generated seats.

const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Event = require("./models/Event");
const Seat = require("./models/Seat");
const User = require("./models/User");

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    await Event.deleteMany();
    await Seat.deleteMany();

    const events = await Event.insertMany([
      {
        name: "Coldplay Live in Concert",
        description: "An unforgettable night of music under the stars.",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        venue: "DY Patil Stadium, Mumbai",
        category: "Music",
        image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
        seatLayout: { rows: 6, seatsPerRow: 10, price: 2500 },
      },
      {
        name: "Stand-Up Comedy Night",
        description: "A hilarious evening with top comedians.",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        venue: "Phoenix Marketcity, Bangalore",
        category: "Comedy",
        image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca",
        seatLayout: { rows: 5, seatsPerRow: 8, price: 800 },
      },
      {
        name: "Tech Conference 2026",
        description: "Explore the future of AI and software engineering.",
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        venue: "Convention Center, Hyderabad",
        category: "Conference",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        seatLayout: { rows: 8, seatsPerRow: 12, price: 1500 },
      },
    ]);

    for (const event of events) {
      const { rows, seatsPerRow, price } = event.seatLayout;
      const seatsToCreate = [];

      for (let r = 0; r < rows; r++) {
        const rowLabel = String.fromCharCode(65 + r);
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
    }

    // Create a default admin user (only if it doesn't exist)
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (!adminExists) {
      await User.create({
        name: "Admin",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
      });
    }

    console.log("Seed data inserted successfully!");
    console.log("Admin login -> email: admin@example.com | password: admin123");
    process.exit();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();