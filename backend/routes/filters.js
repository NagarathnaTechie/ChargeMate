// /backend/routes/filters.js
import express from "express";
import Station from "../models/stationModel.js";

const router = express.Router();

router.get("/filters", async (req, res) => {
  try {
    const countries = await Station.distinct("Country");
    res.json({ countries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/states/:country", async (req, res) => {
  try {
    const states = await Station.distinct("State", { Country: req.params.country });
    res.json({ states });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/addresses/:country/:state", async (req, res) => {
  try {
    let addresses = await Station.distinct("AddressLine", {
      Country: req.params.country,
      State: req.params.state,
    });
    if (req.params.country === "India" && req.params.state === "Karnataka") {
      addresses = addresses.map(addr => addr === "Four Bunglows" ? "Bangalore" : addr);
      addresses = [...new Set(addresses)];
    }
    res.json({ addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New endpoint to get connector types filtered by country
router.get("/connectors/:country", async (req, res) => {
  try {
    const connectors = await Station.distinct("ConnectionType", { Country: req.params.country });
    res.json({ connectors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/connectors/:country/:state", async (req, res) => {
  try {
    const connectors = await Station.distinct("ConnectionType", { Country: req.params.country, State: req.params.state });
    res.json({ connectors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keep the general connectors endpoint for backward compatibility
router.get("/connectors", async (req, res) => {
  try {
    const connectors = await Station.distinct("ConnectionType");
    res.json({ connectors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;