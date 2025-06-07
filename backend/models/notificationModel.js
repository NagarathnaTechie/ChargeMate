import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user: { type: String, required: true }, // User email
  type: { type: String, required: true, enum: ["booking", "cancellation", "reminder"] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  actionUrl: { type: String },
  actionText: { type: String },
});

// Add index on user for faster queries
NotificationSchema.index({ user: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;