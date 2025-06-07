import express from "express";
import mongoose from "mongoose";
import Rating from "../models/ratingModel.js";
import Station from "../models/stationModel.js";
import Booking from "../models/bookingModel.js";

const router = express.Router();

router.post("/rating", async (req, res) => {
  const { stationId, user, stars, review } = req.body;
  console.log("Received rating request:", { stationId, user, stars, review });

  try {
    // Validate input
    if (!stationId || !user || !stars) {
      return res.status(400).json({ error: "Missing required fields: stationId, user, or stars" });
    }

    // Validate stationId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(stationId)) {
      return res.status(400).json({ error: "Invalid stationId format" });
    }

    // Check if a booking exists for this user and station
    const booking = await Booking.findOne({ station: stationId, user });
    console.log("Booking query result:", booking);
    if (!booking) {
      return res.status(400).json({ error: "You can review only booked stations." });
    }

    // Check if user already rated this station
    let rating = await Rating.findOne({ station: stationId, user });
    if (rating) {
      // Update existing rating
      rating.stars = stars;
      rating.review = review;
      rating.createdAt = new Date(); // Update timestamp for updated reviews
      await rating.save();
      console.log("Updated existing rating:", rating);
    } else {
      // Create new rating
      rating = await Rating.create({ station: stationId, user, stars, review });
      console.log("Created new rating:", rating);
    }

    // Recalculate overall rating
    const ratings = await Rating.find({ station: stationId });
    console.log("Fetched ratings for averaging:", { stationId, ratings: ratings.map(r => ({ stars: r.stars, user: r.user, createdAt: r.createdAt })) });
    const total = ratings.reduce((sum, r) => sum + r.stars, 0);
    const avgRating = ratings.length > 0 ? (total / ratings.length).toFixed(2) : 0;
    const updatedStation = await Station.findByIdAndUpdate(
      stationId,
      { Rating: Number(avgRating) },
      { new: true }
    );
    console.log("Updated station rating:", { stationId, avgRating, updatedStation: updatedStation ? updatedStation.Rating : null });

    res.json({ message: "Review submitted successfully", rating });
  } catch (err) {
    console.error("Error in /rating endpoint:", err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

router.get("/ratings/:stationId", async (req, res) => {
  const { stationId } = req.params;
  try {
    // Validate stationId
    if (!mongoose.Types.ObjectId.isValid(stationId)) {
      return res.status(400).json({ error: "Invalid stationId format" });
    }

    const ratings = await Rating.find({ station: stationId }).sort({ createdAt: -1 });
    console.log("Fetched ratings for station:", { stationId, count: ratings.length, ratings: ratings.map(r => ({ _id: r._id, stars: r.stars, user: r.user, createdAt: r.createdAt, review: r.review })) });
    res.json(ratings);
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;