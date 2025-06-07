import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  user: String,
  station: { type: mongoose.Schema.Types.ObjectId, ref: "Station" },
  timeSlot: Number,
  bookingDate: String,
  bookingTime: String,
  paymentMethod: String,
  paymentVerified: Boolean,
  vehicle: {
    name: { type: String, required: true },
    number: { type: String, required: true },
    connectorType: { type: String, required: true },
    batteryCapacity: String,
    range: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;