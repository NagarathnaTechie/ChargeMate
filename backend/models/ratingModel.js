// /backend/models/ratingModel.js
import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema({
  station: { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
  user: { type: String, required: true },
  stars: { type: Number, required: true },
  review: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Rating = mongoose.model("Rating", RatingSchema);
export default Rating;
