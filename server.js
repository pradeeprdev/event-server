const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Support one or more comma-separated origins in .env, e.g.:
// CLIENT_URL=http://localhost:5173,http://localhost:3000,https://your-app.vercel.app
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Explicitly handle preflight requests for all routes
app.options("*", cors(corsOptions));

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/seats", require("./routes/seatRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

app.get("/", (req, res) => {
  res.send("Event Booking System API is running...");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});