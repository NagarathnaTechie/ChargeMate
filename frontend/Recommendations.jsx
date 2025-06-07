"use client"

import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "./Navbar"


// Custom star rating function using Unicode characters
const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const halfStar = rating - fullStars >= 0.5

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} style={{ color: "#FFD700" }}>
        ★
      </span>,
    )
  }

  if (halfStar) {
    stars.push(
      <span key="half" style={{ color: "#FFD700" }}>
        ⯨
      </span>,
    )
  }

  const emptyStars = 5 - stars.length
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} style={{ color: "#FFD700" }}>
        ☆
      </span>,
    )
  }

  return stars
}

export default function Recommendations() {
  const location = useLocation()
  const navigate = useNavigate()
  const recommendations = location.state?.recommendations || []
  console.log("Displaying recommendations:", recommendations)

  const handleBookNow = (station) => {
    navigate("/bookings", { state: { station } })
  }

  return (
    <>
    < Navbar />
    <div
      style={{
        padding: "20px",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            margin: 0,
            color: "#333",
          }}
        >
          ⚡ Recommended Stations
        </h1>
        <span
          style={{
            marginLeft: "12px",
            backgroundColor: "#e9f7fe",
            color: "#0066ff",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          {recommendations.length} found
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            border: "1px dashed #dee2e6",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ margin: "0 0 8px 0", color: "#495057" }}>No recommendations found</h2>
          <p style={{ color: "#6c757d", margin: 0 }}>Try adjusting your filter criteria</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {recommendations.map((rec) => (
            <div
              key={rec._id}
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                backgroundColor: "#fff",
                border: "1px solid #eaeaea",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* Header with gradient background */}
              <div
                style={{
                  background: "linear-gradient(135deg, #0066ff 0%, #5e9eff 100%)",
                  padding: "20px",
                  color: "white",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    backgroundColor: "rgba(255,255,255,0.9)",
                    color: "#0066ff",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                >
                  {rec.Quantity > 0 ? `✓ ${rec.Quantity} slots available` : "✕ No slots available"}
                </div>
                <h2
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    fontWeight: "700",
                    lineHeight: 1.3,
                  }}
                >
                  {rec.StationTitle}
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    opacity: 0.9,
                  }}
                >
                  <span style={{ marginRight: "4px" }}>📍</span>
                  {rec.AddressLine}, {rec.State}, {rec.Country}
                </div>
              </div>

              {/* Station details */}
              <div
                style={{
                  padding: "20px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "10px",
                      borderRadius: "8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "4px" }}>Price</div>
                    <div style={{ fontWeight: "700", color: "#212529", fontSize: "16px" }}>₹{rec.Price}</div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "10px",
                      borderRadius: "8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "4px" }}>Distance</div>
                    <div style={{ fontWeight: "700", color: "#212529", fontSize: "16px" }}>{rec.distance}</div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "16px",
                    padding: "10px",
                    backgroundColor: "#fff8e1",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ marginRight: "8px", fontSize: "14px", color: "#6c757d" }}>Rating:</div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontWeight: "700", marginRight: "8px", color: "#212529" }}>{rec.Rating}</span>
                    <div style={{ display: "flex", fontSize: "16px" }}>{renderStars(rec.Rating)}</div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#0066ff",
                    marginBottom: "16px",
                    padding: "6px 12px",
                    backgroundColor: "#e9f7fe",
                    borderRadius: "6px",
                    display: "inline-block",
                  }}
                >
                  {rec.source}
                </div>

                <button
                  onClick={() => handleBookNow(rec)}
                  style={{
                    marginTop: "auto",
                    backgroundColor: "#0066ff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 6px rgba(0, 102, 255, 0.2)",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>⚡</span> Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}

