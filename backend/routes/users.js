import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET /api/users/:email/vehicles - Fetch vehicles for a user
router.get("/:email/vehicles", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.vehicles);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:email/vehicles - Add a vehicle
router.post("/:email/vehicles", async (req, res) => {
  const { email } = req.params;
  const { name, number, connectorType, batteryCapacity, range } = req.body;
  if (!name || !number || !connectorType) {
    return res.status(400).json({ error: "Name, number, and connectorType are required" });
  }
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name: "Unknown", vehicles: [] });
    }
    const vehicle = { name, number, connectorType, batteryCapacity, range };
    user.vehicles.push(vehicle);
    await user.save();
    res.json(user.vehicles);
  } catch (err) {
    console.error("Error adding vehicle:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:email/vehicles/:id - Update a vehicle
router.put("/:email/vehicles/:id", async (req, res) => {
  const { email, id } = req.params;
  const { name, number, connectorType, batteryCapacity, range } = req.body;
  if (!name || !number || !connectorType) {
    return res.status(400).json({ error: "Name, number, and connectorType are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const vehicle = user.vehicles.id(id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    vehicle.name = name;
    vehicle.number = number;
    vehicle.connectorType = connectorType;
    vehicle.batteryCapacity = batteryCapacity;
    vehicle.range = range;
    await user.save();
    res.json(user.vehicles);
  } catch (err) {
    console.error("Error updating vehicle:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:email/vehicles/:id - Delete a vehicle
router.delete("/:email/vehicles/:id", async (req, res) => {
  const { email, id } = req.params;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const vehicle = user.vehicles.id(id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    vehicle.remove();
    await user.save();
    res.json(user.vehicles);
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
