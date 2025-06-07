import mongoose from "mongoose";

const StationSchema = new mongoose.Schema({
  StationID: String,
  StationTitle: String,
  AddressLine: String,
  State: String,
  Country: String,
  Latitude: Number,
  Longitude: Number,
  ConnectionType: String,
  PowerKW: Number,
  Quantity: Number,
  Price: Number,
  Rating: Number,
  EncodedConnectionType: Number,
  NormalizedPowerKW: Number,
  NormalizedPrice: Number,
  NormalizedRating: Number,
});

const Station = mongoose.model("Station", StationSchema);
export default Station;
