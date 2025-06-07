import Station from "../models/stationModel.js";

async function recommendStations(filters) {
  let query = { Country: filters.country };

  if (filters.state) query.State = filters.state;
  if (filters.address) query.AddressLine = filters.address;
  if (filters.connectionType) query.ConnectionType = filters.connectionType;

  if (filters.powerRange) {
    if (filters.powerRange === "Below 20 Kw") query.PowerKW = { $lt: 20 };
    else if (filters.powerRange === "20 - 100 Kw") query.PowerKW = { $gte: 20, $lte: 100 };
    else if (filters.powerRange === "100 - 300 Kw") query.PowerKW = { $gte: 100, $lte: 300 };
    else if (filters.powerRange === "Above 300 Kw") query.PowerKW = { $gt: 300 };
  }

  if (filters.priceRange) query.Price = { $gte: filters.priceRange[0], $lte: filters.priceRange[1] };
  if (filters.ratingRange) query.Rating = { $gte: filters.ratingRange[0], $lte: filters.ratingRange[1] };

  const stations = await Station.find(query);
  if (stations.length === 0) return [];

  const connectionTypes = await Station.distinct("ConnectionType");

  function vectorize(station) {
    return [
      station.NormalizedPowerKW,
      station.NormalizedPrice,
      station.NormalizedRating,
      connectionTypes.indexOf(station.ConnectionType),
    ];
  }

  function cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  const userVector = [
    filters.powerRangeValue,
    filters.priceRangeValue,
    filters.ratingRangeValue,
    connectionTypes.indexOf(filters.connectionType),
  ];

  const similarities = stations.map((station) => ({
    station,
    similarity: cosineSimilarity(userVector, vectorize(station)),
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, 3).map((s) => s.station);
}

export default recommendStations;
