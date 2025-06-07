// /backend/routes/recommendations.js
import express from "express";
import axios from "axios";
import Station from "../models/stationModel.js";

const router = express.Router();

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

router.post("/recommendations", async (req, res) => {
  console.log("Received filters:", req.body);
  let { country, state, address, connectionType, priceRange, ratingRange, radius, useRadiusOnly } = req.body;
  if (country === "India" && state === "Karnataka" && address === "Four Bunglows") {
    address = "Bangalore";
  }
  try {
    const locationQuery = `${address ? address + ", " : ""}${state ? state + ", " : ""}${country}`;
    console.log("Location query:", locationQuery);
    const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: locationQuery, format: "json", limit: 1 },
    });
    console.log("Geo response data:", geoResponse.data);
    if (!geoResponse.data || geoResponse.data.length === 0) {
      console.log("Location not found.");
      return res.status(404).json({ error: "Location not found" });
    }
    const { lat, lon } = geoResponse.data[0];
    const baseCoords = [parseFloat(lat), parseFloat(lon)];
    console.log("Base coordinates:", baseCoords);

    let recommendations = [];
    // If useRadiusOnly is true (or radius != default 50), do radius-based search exclusively.
    if (useRadiusOnly || (radius && radius !== 50)) {
      console.log("Using radius-based search only");
      let filterCriteria = {
        Country: country,
        Price: { $gte: priceRange[0], $lte: priceRange[1] },
        Rating: { $gte: ratingRange[0], $lte: ratingRange[1] },
      };
      if (state) filterCriteria.State = state;
      if (connectionType && connectionType.toLowerCase() !== "all") {
        filterCriteria.ConnectionType = connectionType;
      }
      console.log("Filter criteria (radius only):", filterCriteria);
      const stations = await Station.find(filterCriteria);
      console.log("Stations found from DB:", stations.length);
      const stationsWithDistance = stations
        .map((station) => {
          const stationCoords = [station.Latitude, station.Longitude];
          const distance = haversineDistance(baseCoords, stationCoords);
          return { station, distance };
        })
        .filter(item => item.distance <= radius);
      stationsWithDistance.sort((a, b) => a.distance - b.distance);
      recommendations = stationsWithDistance.slice(0, 3).map((item) => ({
        ...item.station.toObject(),
        distance: item.distance.toFixed(2) + " km",
        source: "Radius-based"
      }));
    } else {
      console.log("Using city-based search with supplementation");
      let filterCriteria = {
        Country: country,
        State: state,
        Price: { $gte: priceRange[0], $lte: priceRange[1] },
        Rating: { $gte: ratingRange[0], $lte: ratingRange[1] },
      };
      if (connectionType && connectionType.toLowerCase() !== "all") {
        filterCriteria.ConnectionType = connectionType;
      }
      console.log("Filter criteria (city-based):", filterCriteria);
      const stations = await Station.find(filterCriteria);
      console.log("City-based stations from DB:", stations.length);
      const cityBased = stations.map((station) => {
        const stationCoords = [station.Latitude, station.Longitude];
        const distance = haversineDistance(baseCoords, stationCoords);
        return { station, distance };
      });
      cityBased.sort((a, b) => a.distance - b.distance);
      recommendations = cityBased.slice(0, 3).map((item) => ({
        ...item.station.toObject(),
        distance: item.distance.toFixed(2) + " km",
        source: "City-based"
      }));
      // Supplement with radius-based if fewer than 3
      if (recommendations.length < 3 && radius) {
        console.log("Supplementing with radius-based search");
        let filterCriteriaRadius = {
          Country: country,
          Price: { $gte: priceRange[0], $lte: priceRange[1] },
          Rating: { $gte: ratingRange[0], $lte: ratingRange[1] },
        };
        if (state) filterCriteriaRadius.State = state;
        if (connectionType && connectionType.toLowerCase() !== "all") {
          filterCriteriaRadius.ConnectionType = connectionType;
        }
        const stationsAll = await Station.find(filterCriteriaRadius);
        const stationsWithDistance = stationsAll
          .map((station) => {
            const stationCoords = [station.Latitude, station.Longitude];
            const distance = haversineDistance(baseCoords, stationCoords);
            return { station, distance };
          })
          .filter(item => item.distance <= radius);
        stationsWithDistance.sort((a, b) => a.distance - b.distance);
        const radiusBased = stationsWithDistance.slice(0, 3 - recommendations.length).map((item) => ({
          ...item.station.toObject(),
          distance: item.distance.toFixed(2) + " km",
          source: "Radius-based"
        }));
        recommendations = recommendations.concat(radiusBased);
      }
    }
    console.log("Final Recommendations:", recommendations);
    res.json(recommendations);
  } catch (err) {
    console.error("Error in recommendations route:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
