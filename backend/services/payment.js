import express from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const process = require('process');
dotenv.config();

const router = express.Router();

router.post("/order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = req.body;
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Error");
    }

    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

export default router;
