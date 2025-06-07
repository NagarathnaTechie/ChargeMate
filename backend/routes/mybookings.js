import express from "express";
import Booking from "../models/bookingModel.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/mybookings", authenticate, async (req, res) => {
  const userId = req.user.id; // From JWT token
  console.log("Backend: Received request for bookings of user ID:", userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const bookings = await Booking.find({ customerEmail: user.email }).populate("station");
    console.log(`Backend: Found ${bookings.length} bookings for email:`, user.email);
    res.json(bookings);
  } catch (err) {
    console.error("Backend: Error fetching bookings:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;