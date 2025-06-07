import express from "express";
import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";

const router = express.Router();

// Create a notification
export const createNotification = async (user, type, title, message, actionUrl, actionText, timestamp = new Date()) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      actionUrl,
      actionText,
      timestamp, // Allow custom timestamp for reminders
    });
    console.log("Created notification:", { user, type, title });
    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    throw err;
  }
};

// GET /api/notifications - Fetch notifications for the user
router.get("/notifications", async (req, res) => {
  const { user, unread } = req.query; // Support unread filter
  if (!user) {
    return res.status(400).json({ error: "User email is required" });
  }

  try {
    const query = { user };
    if (unread === "true") query.read = false;
    const notifications = await Notification.find(query).sort({ timestamp: -1 });
    console.log("Fetched notifications for user:", { user, count: notifications.length });
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications - Create a notification (for internal use)
router.post("/notifications", async (req, res) => {
  const { user, type, title, message, actionUrl, actionText, timestamp } = req.body;
  try {
    const notification = await createNotification(user, type, title, message, actionUrl, actionText, timestamp ? new Date(timestamp) : undefined);
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id - Mark a notification as read
router.patch("/notifications/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete("/notifications/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: err.message });
  }
});


// PATCH /api/notifications/mark-all-read - Mark all notifications as read for a user
router.patch("/notifications/mark-all-read", async (req, res) => {
  const { user } = req.body;
  console.log("Received mark-all-read request:", { body: req.body, user }); // Debug log
  if (!user) {
    console.log("Validation failed: User email is missing");
    return res.status(400).json({ error: "User email is required" });
  }
  try {
    console.log("Marking all notifications as read for user:", user);

    const result = await Notification.updateMany({ user, read: false }, { read: true });

    console.log("Mark all read result:", { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

    res.json({ 
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;