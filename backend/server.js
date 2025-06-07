// /backend/server.js
import process from "process";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import preprocess from "./utils/preprocess.js";
import authRoutes from "./routes/auth.js";
import filterRoutes from "./routes/filters.js";
import recommendationsRouter from "./routes/recommendations.js";
import bookingRoutes from "./routes/booking.js";
import ratingRoutes from "./routes/rating.js";
import myBookingsRouter from "./routes/mybookings.js";
import notificationsRouter from "./routes/notifications.js";
import paymentRoutes from "./services/payment.js";
import usersRouter from "./routes/users.js";

import { stat } from "fs";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", authRoutes);
app.use("/api", filterRoutes);
app.use("/api", recommendationsRouter);
app.use("/api", bookingRoutes);
app.use("/api", ratingRoutes);
app.use("/api", myBookingsRouter);
app.use("/api", notificationsRouter);
app.use("/api/users", usersRouter);
app.use("/api", paymentRoutes);



mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/preprocess", async (req, res) => {
  try {
    await preprocess();
    res.send("Preprocessing Complete & Data Stored.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/stations", async (req, res) => {
  try {
    const stations = await mongoose.model("Station").find({

    });
    console.log(stations);
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stations',async (req, res) => {
  try {
    const stations = await mongoose.model("Station").find({
      Country: req.query.country,
      State: req.query.state
    });
    console.log(stations);
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    const stations = await mongoose.model("Station").find({
      StationTitle: { $regex: query, $options: "i" },
    });
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: 'not found error manually' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
