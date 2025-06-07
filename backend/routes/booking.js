import express from "express";
import Booking from "../models/bookingModel.js";
import Station from "../models/stationModel.js";
import crypto from "crypto";
import { createNotification } from "./notifications.js";
import { sendConfirmationEmail, scheduleReminderEmail, sendCancellationEmail } from "../utils/emailNotifications.js";

const router = express.Router();

router.post("/bookings", async (req, res) => {
  const { customerName, customerEmail, stationId, timeSlot, bookingDate, bookingTime, vehicle, paymentMethod, paymentVerified } = req.body;

  // Validate past booking
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
  if (bookingDateTime < new Date()) {
    return res.status(400).json({ error: "Cannot book a slot in the past" });
  }

  if (!customerEmail) {
    return res.status(400).json({ error: "Customer email is required" });
  }
  if (!customerName) {
    return res.status(400).json({ error: "Customer name is required" });
  }
  if (!vehicle || !vehicle.name || !vehicle.number || !vehicle.connectorType) {
    return res.status(400).json({ error: "Vehicle details (name, number, connectorType) are required" });
  }

  try {
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }

    // Check connector type compatibility
    if (vehicle.connectorType.toLowerCase() !== station.ConnectionType.toLowerCase()) {
      return res.status(400).json({
        error: "Vehicle connector type does not match station connector type",
      });
    }
    
    // Calculate time slots affected by this booking (e.g., 60 minutes = 6:00 and 6:30)
    const startTime = bookingTime; // e.g., "06:00"
    const durationMinutes = timeSlot; // e.g., 60
    const timeSlots = [];
    let currentTime = new Date(`2025-01-01T${startTime}:00`);
    for (let i = 0; i < durationMinutes; i += 30) {
      const slotTime = `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}`;
      timeSlots.push(slotTime);
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // Check availability for all affected time slots
    for (const slotTime of timeSlots) {
      const bookingsAtSlot = await Booking.countDocuments({
        station: stationId,
        bookingDate,
        bookingTime: slotTime,
      });
      if (bookingsAtSlot >= station.Quantity) {
        return res.status(400).json({ error: `No available slots at ${slotTime}` });
      }
    }

    // Create booking
    const booking = await Booking.create({
      customerName,
      customerEmail,
      station: stationId,
      timeSlot,
      bookingDate,
      bookingTime,
      paymentMethod,
      paymentVerified,
      user: customerEmail,
      vehicle,
    });
    
    // Removed: await Station.findByIdAndUpdate(stationId, { $inc: { Quantity: -1 } });
    // Reason: Station.Quantity should remain static; availability is determined by bookings.

    // Create booking confirmation notification
    await createNotification(
      customerEmail,
      "booking",
      "Booking Confirmed",
      `Your booking for ${station.StationTitle} on ${bookingDate} at ${bookingTime} is confirmed.`,
      "/mybookings",
      "View Booking"
    );

    // Create reminder notification
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const reminderTime = new Date(bookingDateTime.getTime() - 10 * 60 * 1000);
    await createNotification(
      customerEmail,
      "reminder",
      "Booking Reminder",
      `Your charging session at ${station.StationTitle} is in 10 minutes on ${bookingDate} at ${bookingTime}.`,
      "/mybookings",
      "View Booking",
      reminderTime
    );

    // Send email notifications
    let emailWarning = null;
    try {
      console.log("Booking object for email:", JSON.stringify(booking, null, 2));
      await sendConfirmationEmail(customerEmail, "Your Station Booking is Confirmed!", {
        ...booking.toObject(),
        station,
      });
      scheduleReminderEmail(
        customerEmail,
        "Booking Reminder",
        `This is a reminder for your booking at ${station.StationTitle} on ${bookingDate} at ${bookingTime}.`,
        bookingDate,
        bookingTime
      );
    } catch (emailErr) {
      console.error("Failed to send email notifications:", emailErr);
      emailWarning = "Booking successful, but failed to send confirmation email.";
    }

    res.json({ message: "Booking successful", booking, warning: emailWarning });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE booking
router.delete('/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;

  try {
    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Create cancellation notification
    const station = await Station.findById(booking.station);
    let emailWarning = null;
    if (station) {
      await createNotification(
        booking.customerEmail,
        "cancellation",
        "Booking Cancelled",
        `Your booking at ${station.StationTitle} on ${booking.bookingDate} at ${booking.bookingTime} has been cancelled.`,
        "/mybookings",
        "View Bookings"
      );

      // Send cancellation email
      try {
        console.log("Booking object for cancellation email:", JSON.stringify(booking, null, 2));
        await sendCancellationEmail(booking.customerEmail, "Your Station Booking is Cancelled!", {
          ...booking.toObject(),
          station,
        });
      } catch (emailErr) {
        console.error("Failed to send cancellation email:", emailErr);
        emailWarning = "Booking deleted, but failed to send cancellation email.";
      }
    }

    res.json({ message: "Booking deleted successfully", warning: emailWarning });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

// PUT (Edit) booking
router.put('/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  const { bookingDate, bookingTime, timeSlot, vehicle } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const station = await Station.findById(booking.station);
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }

    // Validate vehicle if provided
    if (vehicle && (!vehicle.name || !vehicle.number || !vehicle.connectorType)) {
      return res.status(400).json({ error: "Vehicle details (name, number, connectorType) are required" });
    }

    // Check connector type compatibility if vehicle is updated
    if (vehicle && vehicle.connectorType.toLowerCase() !== station.ConnectionType.toLowerCase()) {
      return res.status(400).json({
        error: "Vehicle connector type does not match station connector type",
      });
    }

    // Check if date/time is changed
    let emailWarning = null;
    if (
      booking.bookingDate !== bookingDate ||
      booking.bookingTime !== bookingTime
    ) {
      const stationId = booking.station._id ? booking.station._id : booking.station;

      // Calculate affected time slots for the new booking
      const durationMinutes = timeSlot;
      const timeSlots = [];
      let currentTime = new Date(`2025-01-01T${bookingTime}:00`);
      for (let i = 0; i < durationMinutes; i += 30) {
        const slotTime = `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}`;
        timeSlots.push(slotTime);
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
      }

      // Check availability for all affected time slots
      for (const slotTime of timeSlots) {
        const bookingsAtSlot = await Booking.countDocuments({
          station: stationId,
          bookingDate,
          bookingTime: slotTime,
          _id: { $ne: bookingId },
        });
        if (bookingsAtSlot >= station.Quantity) {
          return res.status(400).json({ error: `No available slots at ${slotTime}` });
        }
      }

      // Create or update reminder notification for new time
      const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
      const reminderTime = new Date(bookingDateTime.getTime() - 10 * 60 * 1000);
      await createNotification(
        booking.customerEmail,
        "reminder",
        "Booking Reminder",
        `Your updated booking at ${station.StationTitle} is in 10 minutes on ${bookingDate} at ${bookingTime}.`,
        "/mybookings",
        "View Booking",
        reminderTime
      );

      // Schedule reminder email for new time
      try {
        scheduleReminderEmail(
          booking.customerEmail,
          "Booking Reminder",
          `This is a reminder for your updated booking at ${station.StationTitle} on ${bookingDate} at ${bookingTime}.`,
          bookingDate,
          bookingTime
        );
      } catch (emailErr) {
        console.error("Failed to schedule reminder email:", emailErr);
        emailWarning = "Booking updated, but failed to schedule reminder email.";
      }
    }

    // Save updated booking
    booking.bookingDate = bookingDate;
    booking.bookingTime = bookingTime;
    booking.timeSlot = timeSlot;
    if (vehicle) booking.vehicle = vehicle;
    await booking.save();

    res.json({ message: "Booking updated successfully", booking, warning: emailWarning });
  } catch (error) {
    console.error("Edit booking error:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// Endpoint to check availability for a specific date/time
router.get('/availability', async (req, res) => {
  const { stationId, bookingDate, bookingTime, duration = 30 } = req.query;

  try {
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }

    // Parse bookingTime and duration
    const startTime = new Date(`2025-01-01T${bookingTime}:00`);
    const durationMinutes = parseInt(duration);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // Generate all 30-minute slots affected
    const timeSlots = [];
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const slotTime = `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}`;
      timeSlots.push(slotTime);
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // Count bookings for each affected slot
    let maxBookings = 0;
    for (const slotTime of timeSlots) {
      const bookingsAtSlot = await Booking.countDocuments({
        station: stationId,
        bookingDate,
        bookingTime: slotTime,
      });
      maxBookings = Math.max(maxBookings, bookingsAtSlot);
    }

    const availableSlots = Math.max(0, station.Quantity - maxBookings);

    res.json({
      stationId,
      bookingDate,
      bookingTime,
      totalSlots: station.Quantity,
      availableSlots,
      isFull: availableSlots === 0,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({ error: "Failed to check availability" });
  }
});

router.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature === razorpay_signature) {
    res.status(200).json({ message: "Payment verified" });
  } else {
    res.status(400).json({ error: "Invalid payment signature" });
  }
});

export default router;