"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import axios from "axios"

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [ratings, setRatings] = useState({})
  const [reviews, setReviews] = useState({})
  const [submittingRating, setSubmittingRating] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.log("MyBookings: No token found, redirecting to login")
      navigate("/", { state: { from: "/mybookings" } })
      return
    }

    console.log("MyBookings: Fetching bookings with token")
    setLoading(true)
    axios
      .get("https://chargemate-sp0r.onrender.com/api/mybookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("MyBookings: Received bookings:", res.data)
        if (Array.isArray(res.data)) {
          setBookings(res.data)
          const initialRatings = {}
          const initialReviews = {}
          res.data.forEach((booking) => {
            if (booking._id) {
              initialRatings[booking._id] = 0
              initialReviews[booking._id] = ""
            }
          })
          setRatings(initialRatings)
          setReviews(initialReviews)
        } else {
          console.error("MyBookings: Expected array but got:", typeof res.data)
          setError("Unexpected data format received from server")
        }
      })
      .catch((err) => {
        console.error("MyBookings: Error fetching bookings:", err)
        setError("Failed to load bookings. Please try again later.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

  const handleBackHome = () => {
    console.log("MyBookings: Navigating back to Home")
    navigate("/home")
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return { weekday: "N/A", day: "N/A", month: "N/A" }

    const options = { weekday: "short", month: "short", day: "numeric" }
    const formatted = new Date(dateString).toLocaleDateString("en-US", options)
    const parts = formatted.split(" ")

    return {
      weekday: parts[0],
      month: parts[1],
      day: parts[2],
    }
  }

  // Helper function to calculate booking end time
  const getBookingEndTime = (booking) => {
    if (!booking.bookingDate || !booking.bookingTime || !booking.timeSlot) {
      return null
    }
    const date = new Date(booking.bookingDate)
    if (isNaN(date.getTime())) {
      return null
    }
    const [hoursStr, minutesStr] = booking.bookingTime.split(":")
    const hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    if (isNaN(hours) || isNaN(minutes)) {
      return null
    }
    date.setHours(hours, minutes, 0, 0)
    const timeSlotMinutes = parseInt(booking.timeSlot, 10)
    if (isNaN(timeSlotMinutes)) {
      return null
    }
    const endDate = new Date(date.getTime() + timeSlotMinutes * 60000)
    return endDate
  }

  // Updated filter for bookings based on end time
  const filteredBookings = bookings.filter((booking) => {
    const endTime = getBookingEndTime(booking)
    const now = new Date()
    if (!endTime) {
      return activeTab === "past"
    }
    if (activeTab === "upcoming") {
      return endTime > now
    } else {
      return endTime <= now
    }
  })

  // Handle rating change
  const handleRatingChange = (bookingId, rating) => {
    setRatings((prev) => ({
      ...prev,
      [bookingId]: rating,
    }))
  }

  // Handle review change
  const handleReviewChange = (bookingId, text) => {
    setReviews((prev) => ({
      ...prev,
      [bookingId]: text,
    }))
  }

  // Submit rating and review
  const submitRating = (bookingId, stationId) => {
    const user = localStorage.getItem("userEmail")
    if (!user) {
      console.error("Cannot submit rating: No user email found in local storage")
      alert("Please log in to submit a rating.")
      navigate("/", { state: { from: "/mybookings" } })
      return
    }

    if (!stationId) {
      console.error("Cannot submit rating: No station ID available")
      alert("Cannot submit rating: Station information is missing.")
      return
    }

    const payload = {
      stationId: stationId,
      user: user, // Use email from local storage
      stars: ratings[bookingId],
      review: reviews[bookingId],
    }
    console.log("Submitting rating with payload:", payload)
    setSubmittingRating(bookingId)

    axios
      .post("https://chargemate-sp0r.onrender.com/api/rating", payload)
      .then((response) => {
        console.log("Rating submitted successfully:", response.data)
        alert("Thank you for your feedback!")
        setRatings((prev) => ({
          ...prev,
          [bookingId]: 0,
        }))
        setReviews((prev) => ({
          ...prev,
          [bookingId]: "",
        }))
      })
      .catch((error) => {
        console.error("Error submitting rating:", error)
        const errorMessage = error.response?.data?.error || "Failed to submit rating. Please try again."
        alert(errorMessage)
      })
      .finally(() => {
        setSubmittingRating(null)
      })
  }

  // Handle edit booking
  const handleEditBooking = (booking) => {
    navigate("/bookings", {
      state: {
        station: booking.station,
        editMode: true,
        bookingId: booking._id,
        existingBooking: booking,
      },
    })
  }

  // Handle cancel booking
  const handleCancelBooking = (bookingId, stationId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      axios
        .delete(`https://chargemate-sp0r.onrender.com/api/bookings/${bookingId}`)
        .then((response) => {
          console.log("Booking cancelled successfully:", response.data)
          if (stationId) {
            axios
              .post(`https://chargemate-sp0r.onrender.com/api/stations/${stationId}/release-slot`)
              .then(() => console.log("Slot released successfully"))
              .catch((err) => console.error("Error releasing slot:", err))
          }
          setBookings((prev) => prev.filter((booking) => booking._id !== bookingId))
          alert("Booking cancelled successfully")
        })
        .catch((error) => {
          console.error("Error cancelling booking:", error)
          alert("Failed to cancel booking. Please try again.")
        })
    }
  }

  // Render star rating
  const renderStarRating = (bookingId, editable = true) => {
    const rating = ratings[bookingId] || 0

    return (
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={editable ? () => handleRatingChange(bookingId, star) : undefined}
            style={{
              cursor: editable ? "pointer" : "default",
              color: star <= rating ? "#FFD700" : "#e4e5e9",
              fontSize: isMobile ? "20px" : "24px",
              marginRight: "2px",
            }}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#6b7280",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚡</div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Loading your charging sessions...
          </h3>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#e11d48",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>❌</div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>{error}</h3>
          <button
            onClick={handleBackHome}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#f1f5f9",
              color: "#1e40af",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              margin: "20px auto",
            }}
          >
            <span>🏠</span> Back to Home
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div
        style={{
          padding: isMobile ? "16px" : "20px",
          maxWidth: "850px",
          margin: "0 auto",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          maxHeight: "100vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            marginBottom: "24px",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "16px" : "0",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: isMobile ? "24px" : "28px",
                fontWeight: "700",
                margin: "0 0 8px 0",
                background: "linear-gradient(90deg, #3b82f6, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              My Charging Sessions
            </h1>
            <p
              style={{
                fontSize: isMobile ? "14px" : "16px",
                color: "#6b7280",
                margin: "0",
              }}
            >
              View and manage your EV charging bookings
            </p>
          </div>
          <button
            onClick={handleBackHome}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#f1f5f9",
              color: "#1e40af",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              alignSelf: isMobile ? "flex-start" : "auto",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e2e8f0")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
          >
            <span>🏠</span> Back to Home
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "20px",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setActiveTab("upcoming")}
            style={{
              padding: isMobile ? "10px 16px" : "12px 20px",
              backgroundColor: "transparent",
              color: activeTab === "upcoming" ? "#3b82f6" : "#6b7280",
              border: "none",
              borderBottom: activeTab === "upcoming" ? "2px solid #3b82f6" : "none",
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: activeTab === "upcoming" ? "600" : "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              minWidth: "fit-content",
            }}
          >
            <span style={{ marginRight: "8px" }}>⚡</span> Upcoming (
            {
              bookings.filter((b) => {
                const endTime = getBookingEndTime(b)
                const now = new Date()
                return endTime ? endTime > now : false
              }).length
            }
            )
          </button>
          <button
            onClick={() => setActiveTab("past")}
            style={{
              padding: isMobile ? "10px 16px" : "12px 20px",
              backgroundColor: "transparent",
              color: activeTab === "past" ? "#3b82f6" : "#6b7280",
              border: "none",
              borderBottom: activeTab === "past" ? "2px solid #3b82f6" : "none",
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: activeTab === "past" ? "600" : "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              minWidth: "fit-content",
            }}
          >
            <span style={{ marginRight: "8px" }}>📅</span> Past (
            {
              bookings.filter((b) => {
                const endTime = getBookingEndTime(b)
                const now = new Date()
                return endTime ? endTime <= now : true
              }).length
            }
            )
          </button>
        </div>

        {/* Booking Cards */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
        >
          {filteredBookings.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔌</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                No {activeTab} charging sessions
              </h3>
              <p style={{ margin: "0", fontSize: "14px" }}>
                {activeTab === "upcoming"
                  ? "Book a charging session to see it here"
                  : "Your past charging sessions will appear here"}
              </p>
            </div>
          ) : (
            <div>
              {filteredBookings.map((booking) => {
                const dateParts = formatDate(booking.bookingDate)
                const stationTitle = booking.station
                  ? typeof booking.station === "object"
                    ? booking.station.StationTitle
                    : "Station information unavailable"
                  : "Unknown Station"
                const stationAddress =
                  booking.station && booking.station.AddressLine
                    ? booking.station.AddressLine
                    : booking.station && booking.station.State
                      ? `${booking.station.State}, ${booking.station.Country}`
                      : "Address unavailable"
                const stationId = booking.station && booking.station._id ? booking.station._id : null

                return (
                  <div
                    key={booking._id}
                    style={{
                      padding: isMobile ? "16px" : "20px",
                      borderBottom: "1px solid #e5e7eb",
                      transition: "background-color 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Main Booking Info */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: isMobile ? "flex-start" : "center",
                        gap: isMobile ? "12px" : "20px",
                        flexDirection: isMobile ? "column" : "row",
                      }}
                    >
                      {/* Date Circle */}
                      <div
                        style={{
                          width: isMobile ? "60px" : "70px",
                          height: isMobile ? "60px" : "70px",
                          borderRadius: "50%",
                          backgroundColor: "#f0f9ff",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          flexShrink: "0",
                          border: "2px solid #e0f2fe",
                          alignSelf: isMobile ? "center" : "auto",
                        }}
                      >
                        <div
                          style={{
                            fontSize: isMobile ? "10px" : "12px",
                            fontWeight: "600",
                            color: "#3b82f6",
                          }}
                        >
                          {dateParts.weekday}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? "18px" : "20px",
                            fontWeight: "700",
                            color: "#1e40af",
                          }}
                        >
                          {dateParts.day}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? "10px" : "12px",
                            fontWeight: "600",
                            color: "#3b82f6",
                          }}
                        >
                          {dateParts.month}
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div style={{ flex: "1", width: isMobile ? "100%" : "auto" }}>
                        <h3
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: isMobile ? "16px" : "18px",
                            fontWeight: "600",
                            color: "#1e3a8a",
                            textAlign: isMobile ? "center" : "left",
                          }}
                        >
                          {stationTitle}
                        </h3>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: isMobile ? "8px" : "16px",
                            fontSize: "14px",
                            color: "#4b5563",
                            justifyContent: isMobile ? "center" : "flex-start",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#3b82f6" }}>🕒</span>
                            <span>{booking.bookingTime || "N/A"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#3b82f6" }}>⏱️</span>
                            <span>{booking.timeSlot || "0"} minutes</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#3b82f6" }}>🔋</span>
                            <span>22 kW</span>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "13px",
                            color: "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            justifyContent: isMobile ? "center" : "flex-start",
                            textAlign: isMobile ? "center" : "left",
                          }}
                        >
                          <span>📍</span>
                          <span>{stationAddress}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          backgroundColor: activeTab === "upcoming" ? "#ecfdf5" : "#f1f5f9",
                          color: activeTab === "upcoming" ? "#10b981" : "#6b7280",
                          fontSize: "13px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexShrink: "0",
                          alignSelf: isMobile ? "center" : "auto",
                        }}
                      >
                        <span>{activeTab === "upcoming" ? "✓" : "✓"}</span>
                        <span>{activeTab === "upcoming" ? "Confirmed" : "Completed"}</span>
                      </div>
                    </div>

                    {/* Past Session Rating Section */}
                    {activeTab === "past" && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "16px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 12px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1e3a8a",
                          }}
                        >
                          Rate Your Experience
                        </h4>

                        <div style={{ marginBottom: "12px", justifyContent: isMobile ? "center" : "flex-start" }}>
                          {renderStarRating(booking._id)}
                        </div>

                        <textarea
                          placeholder="Share your experience (optional)"
                          value={reviews[booking._id] || ""}
                          onChange={(e) => handleReviewChange(booking._id, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            minHeight: isMobile ? "60px" : "80px",
                            resize: "vertical",
                            marginBottom: "12px",
                            fontSize: "14px",
                            boxSizing: "border-box",
                          }}
                        />

                        <button
                          onClick={() => submitRating(booking._id, stationId)}
                          disabled={!ratings[booking._id] || submittingRating === booking._id}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: ratings[booking._id] ? "#3b82f6" : "#e2e8f0",
                            color: ratings[booking._id] ? "white" : "#9ca3af",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: ratings[booking._id] ? "pointer" : "default",
                            transition: "all 0.2s ease",
                            width: isMobile ? "100%" : "auto",
                          }}
                        >
                          {submittingRating === booking._id ? "Submitting..." : "Submit Rating"}
                        </button>
                      </div>
                    )}

                    {/* Upcoming Session Action Buttons */}
                    {activeTab === "upcoming" && (
                      <div
                        style={{
                          marginTop: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexDirection: isMobile ? "column" : "row",
                        }}
                      >
                        <button
                          onClick={() => handleEditBooking(booking)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            flex: isMobile ? "1" : "none",
                          }}
                        >
                          <span>✏️</span> Edit Booking
                        </button>

                        <button
                          onClick={() => handleCancelBooking(booking._id, stationId)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            flex: isMobile ? "1" : "none",
                          }}
                        >
                          <span>❌</span> Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Energy Usage Summary (only for past bookings) */}
        {activeTab === "past" && filteredBookings.length > 0 && (
          <div
            style={{
              marginTop: "24px",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              padding: isMobile ? "16px" : "20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e3a8a",
                textAlign: isMobile ? "center" : "left",
              }}
            >
              Energy Usage Summary
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                gap: isMobile ? "16px" : "20px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f0f9ff",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "24px", marginBottom: "8px" }}>⚡</span>
                <span style={{ fontSize: "24px", fontWeight: "700", color: "#1e40af" }}>
                  {filteredBookings.length * 15} kWh
                </span>
                <span style={{ fontSize: "14px", color: "#6b7280" }}>Total Energy</span>
              </div>

              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "24px", marginBottom: "8px" }}>🌱</span>
                <span style={{ fontSize: "24px", fontWeight: "700", color: "#166534" }}>
                  {(filteredBookings.length * 15 * 0.7).toFixed(1)} kg
                </span>
                <span style={{ fontSize: "14px", color: "#6b7280" }}>CO₂ Saved</span>
              </div>

              <div
                style={{
                  backgroundColor: "#eff6ff",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "24px", marginBottom: "8px" }}>🚗</span>
                <span style={{ fontSize: "24px", fontWeight: "700", color: "#1e40af" }}>
                  {filteredBookings.length * 60} km
                </span>
                <span style={{ fontSize: "14px", color: "#6b7280" }}>Est. Range Added</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
