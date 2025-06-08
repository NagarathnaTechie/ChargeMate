"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import axios from "axios"
import "leaflet/dist/leaflet.css"
import PropTypes from "prop-types"
import { useNavigate } from "react-router-dom"

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, 5)
    }
  }, [center, map])
  return null
}

MapUpdater.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
}

export default function Map({ selectedCountry, searchQuery }) {
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  const [filteredStation, setFilteredStation] = useState(null)
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629])
  const [openPopup, setOpenPopup] = useState(false)
  const [reviews, setReviews] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    axios
      .get("https://chargemate-sp0r.onrender.com/stations")
      .then((response) => setStations(response.data))
      .catch((error) => console.error("Error fetching stations:", error))
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      axios
        .get(`https://nominatim.openstreetmap.org/search?country=${selectedCountry}&format=json`)
        .then((response) => {
          if (response.data.length > 0) {
            const { lat, lon } = response.data[0]
            setMapCenter([Number.parseFloat(lat), Number.parseFloat(lon)])
          }
        })
        .catch((error) => console.error("Error fetching country coordinates:", error))
    }
  }, [selectedCountry])

  const defaultIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

  const highlightIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [30, 50],
    iconAnchor: [15, 50],
    popupAnchor: [0, -50],
  })

  const getStationId = (station) => {
    return station._id && station._id.$oid ? station._id.$oid : station._id
  }

  useEffect(() => {
    if (searchQuery && searchQuery.trim() !== "") {
      const matchingStation = stations.find((station) =>
        station.StationTitle.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredStation(matchingStation || null)
    } else {
      setFilteredStation(null)
    }
  }, [searchQuery, stations])

  const handleMarkerClick = async (station) => {
    setSelectedStation(station)
    setOpenPopup(true)
    try {
      const response = await axios.get(`https://chargemate-sp0r.onrender.com/api/ratings/${station._id}`)
      console.log("Fetched reviews for station:", {
        stationId: station._id,
        count: response.data.length,
        reviews: response.data.map((r) => ({
          _id: r._id,
          user: r.user,
          stars: r.stars,
          review: r.review,
          createdAt: r.createdAt,
        })),
      })
      setReviews(response.data)
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setReviews([])
    }
  }

  const handleClosePopup = () => {
    setOpenPopup(false)
    setReviews([])
  }

  const handleBookNow = () => {
    setOpenPopup(false)
    navigate("/bookings", { state: { station: selectedStation } })
  }

  const renderStarRating = (rating) => {
    const maxStars = 5
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1
          return (
            <div key={index} style={{ position: "relative", display: "inline-block", fontSize: "18px" }}>
              <span style={{ color: "#D3D3D3" }}>☆</span>
              <span
                style={{
                  color: "#FFD700",
                  position: "absolute",
                  left: 0,
                  top: 0,
                  overflow: "hidden",
                  width: rating >= starValue ? "100%" : rating > index && rating < starValue ? "50%" : "0%",
                }}
              >
                ★
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <MapContainer center={mapCenter} zoom={5} style={{ height: "90vh", width: "100%" }}>
        <MapUpdater center={mapCenter} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {stations.map((station) => (
          <Marker
            key={getStationId(station)}
            position={[station.Latitude, station.Longitude]}
            icon={
              filteredStation && getStationId(filteredStation) === getStationId(station) ? highlightIcon : defaultIcon
            }
            eventHandlers={{ click: () => handleMarkerClick(station) }}
          />
        ))}
      </MapContainer>
      {openPopup && selectedStation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={handleClosePopup}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "400px",
              padding: "0",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                padding: "20px",
                color: "white",
                position: "relative",
              }}
            >
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700", paddingRight: "40px" }}>
                {selectedStation.StationTitle}
              </h2>
              <p style={{ margin: "0", fontSize: "14px", opacity: 0.9 }}>
                {selectedStation.AddressLine}, {selectedStation.State}, {selectedStation.Country}
              </p>
              <button
                onClick={handleClosePopup}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  color: "white",
                  fontSize: "16px",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Connection Type</div>
                  <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>
                    {selectedStation.ConnectionType}
                  </div>
                </div>
                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Power</div>
                  <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>
                    {selectedStation.PowerKW} kW
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Price</div>
                  <div style={{ fontWeight: "700", color: "#10b981", fontSize: "18px" }}>₹{selectedStation.Price}</div>
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Rating</div>
                  <div>{renderStarRating(selectedStation.Rating || 0)}</div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  backgroundColor: selectedStation.Quantity > 0 ? "#f0fdf4" : "#fef2f2",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: `1px solid ${selectedStation.Quantity > 0 ? "#dcfce7" : "#fee2e2"}`,
                }}
              >
                <span style={{ fontSize: "20px" }}>{selectedStation.Quantity > 0 ? "✅" : "❌"}</span>
                <span
                  style={{
                    fontWeight: "500",
                    color: selectedStation.Quantity > 0 ? "#16a34a" : "#dc2626",
                    fontSize: "14px",
                  }}
                >
                  {selectedStation.Quantity > 0 ? `${selectedStation.Quantity} slots available` : "No slots available"}
                </span>
              </div>
              <div style={{ marginBottom: "20px", maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}>Reviews</h3>
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <div
                      key={review._id || index}
                      style={{
                        marginBottom: "10px",
                        padding: "10px",
                        backgroundColor: index === 0 ? "#e0f2fe" : "#f9fafb",
                        borderRadius: "6px",
                        border: index === 0 ? "1px solid #3b82f6" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: "500", color: "#1e3a8a", fontSize: "14px" }}>{review.user}</span>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ color: i < review.stars ? "#FFD700" : "#e4e5e9", fontSize: "14px" }}>
                            ★
                          </span>
                        ))}
                      </div>
                      <p style={{ marginTop: "4px", color: "#4b5563", fontSize: "14px", lineHeight: "1.4" }}>
                        {review.review || "No review provided"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>No reviews available for this station.</p>
                )}
              </div>
              <button
                onClick={handleBookNow}
                disabled={selectedStation.Quantity <= 0}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: selectedStation.Quantity > 0 ? "#3b82f6" : "#94a3b8",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: selectedStation.Quantity > 0 ? "pointer" : "not-allowed",
                }}
              >
                <span>⚡</span> Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

Map.propTypes = {
  selectedCountry: PropTypes.string,
  searchQuery: PropTypes.string,
}
