import fs from "fs";
import csvParser from "csv-parser";
import Station from "../models/stationModel.js";


const connectionTypes = [];
function encodeConnectionType(type) {
  if (!connectionTypes.includes(type)) connectionTypes.push(type);
  return connectionTypes.indexOf(type);
}

async function preprocess() {
  await Station.deleteMany({});
  const stations = [];

  fs.createReadStream("Stations.csv")
    .pipe(csvParser())
    .on("data", (row) => {
      if (!row.StationID || !row.PowerKW || !row.Price || !row.Rating) return;

      stations.push({
        StationID: row.StationID,
        StationTitle: row.StationTitle,
        AddressLine: row.AddressLine,
        State: row.State,
        Country: row.Country,
        Latitude: parseFloat(row.Latitude),
        Longitude: parseFloat(row.Longitude),
        ConnectionType: row.ConnectionType,
        PowerKW: parseFloat(row.PowerKW),
        Quantity: parseInt(row.Quantity),
        Price: parseFloat(row.Price),
        Rating: parseFloat(row.Rating),
        EncodedConnectionType: encodeConnectionType(row.ConnectionType),
      });
    })
    .on("end", async () => {
      const powerKWs = stations.map((s) => s.PowerKW);
      const prices = stations.map((s) => s.Price);
      const ratings = stations.map((s) => s.Rating);

      function normalize(value, min, max) {
        return (value - min) / (max - min);
      }

      const minPower = Math.min(...powerKWs),
        maxPower = Math.max(...powerKWs);
      const minPrice = Math.min(...prices),
        maxPrice = Math.max(...prices);
      const minRating = Math.min(...ratings),
        maxRating = Math.max(...ratings);

      stations.forEach((s) => {
        s.NormalizedPowerKW = normalize(s.PowerKW, minPower, maxPower);
        s.NormalizedPrice = normalize(s.Price, minPrice, maxPrice);
        s.NormalizedRating = normalize(s.Rating, minRating, maxRating);
      });

      await Station.insertMany(stations);
      console.log("Data Preprocessing Complete");
    });
}

export default preprocess;