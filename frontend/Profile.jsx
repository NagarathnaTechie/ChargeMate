"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Navbar from "./Navbar"

export default function Profile() {
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      name: "Tesla Model 3",
      number: "KA-01-AB-1234",
      batteryCapacity: "75 kWh",
      range: "350 km",
      connectorType: "Type 2",
    },
  ])
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    name: "",
    number: "",
    batteryCapacity: "",
    range: "",
    connectorType: "Type 2",
  })
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

  // Get user info from localStorage
  const userInfo = (() => {
    const userData = localStorage.getItem("userData")
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }
    return { name: "", email: "" }
  })()

  useEffect(() => {
    if (userInfo.email) {
      console.log("Profile: Fetching bookings for user:", userInfo.email)
      axios
        .get(`https://chargemate-sp0r.onrender.com/api/mybookings/${userInfo.email}`)
        .then((res) => {
          console.log("Profile: Received bookings:", res.data)
          setBookings(res.data)
        })
        .catch((err) => {
          console.error("Profile: Error fetching bookings:", err)
        })
    }
  }, [userInfo.email])

  const handleBookingHistoryClick = () => {
    console.log("Profile: Redirecting to Booking History page")
    navigate("/mybookings")
  }

  const handleAddVehicle = () => {
    // Validate form
    if (!newVehicle.name || !newVehicle.number) {
      alert("Vehicle name and number are required")
      return
    }

    // Add new vehicle to the list
    const vehicleWithId = {
      ...newVehicle,
      id: vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.id)) + 1 : 1,
    }

    setVehicles([...vehicles, vehicleWithId])
    setNewVehicle({
      name: "",
      number: "",
      batteryCapacity: "",
      range: "",
      connectorType: "Type 2",
    })
    setShowAddVehicle(false)
  }

  const handleDeleteVehicle = (id) => {
    if (window.confirm("Are you sure you want to remove this vehicle?")) {
      setVehicles(vehicles.filter((vehicle) => vehicle.id !== id))
    }
  }

  return (
    <>
      <Navbar />
      <div
        style={{
          height: "100vh",
          backgroundColor: "#f9fafb",
          paddingBottom: "40px", 
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: isMobile ? "16px" : "24px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
                My Profile
              </h1>
              <p style={{ fontSize: isMobile ? "14px" : "16px", color: "#6b7280", margin: "0" }}>
                Manage your account and vehicles
              </p>
            </div>

            <button
              onClick={handleBookingHistoryClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                alignSelf: isMobile ? "flex-start" : "auto",
              }}
            >
              <span>🔋</span> Booking History
            </button>
          </div>

          {/* User Info Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              padding: isMobile ? "20px" : "24px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: "600",
                margin: "0 0 16px 0",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "20px" }}>👤</span> User Information
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  Full Name
                </label>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    fontSize: "16px",
                    color: "#0f172a",
                    wordBreak: "break-word",
                  }}
                >
                  {userInfo.name || "Not available"}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  Email Address
                </label>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    fontSize: "16px",
                    color: "#0f172a",
                    wordBreak: "break-word",
                  }}
                >
                  {userInfo.email || "Not available"}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles Section */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              padding: isMobile ? "20px" : "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <h2
                style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "600",
                  margin: "0",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>🚗</span> My Vehicles
              </h2>

              <button
                onClick={() => setShowAddVehicle(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                <span>+</span> Add Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  color: "#64748b",
                }}
              >
                <p style={{ margin: "0 0 12px 0" }}>You haven't added any vehicles yet</p>
                <button
                  onClick={() => setShowAddVehicle(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Add Your First Vehicle
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                        alignItems: isMobile ? "flex-start" : "center",
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? "12px" : "0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            backgroundColor: "#eff6ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            flexShrink: 0,
                          }}
                        >
                          🚗
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "16px" }}>{vehicle.name}</div>
                          <div style={{ color: "#64748b", fontSize: "14px" }}>{vehicle.number}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          backgroundColor: "#fee2e2",
                          color: "#ef4444",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "16px",
                          alignSelf: isMobile ? "flex-end" : "auto",
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <div
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#e0f2fe",
                          color: "#0284c7",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        Battery: {vehicle.batteryCapacity}
                      </div>
                      <div
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#dcfce7",
                          color: "#16a34a",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        Range: {vehicle.range}
                      </div>
                      <div
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#fef3c7",
                          color: "#d97706",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {vehicle.connectorType}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Vehicle Modal */}
          {showAddVehicle && (
            <>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  zIndex: 1000,
                }}
                onClick={() => setShowAddVehicle(false)}
              />

              <div
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: isMobile ? "20px" : "24px",
                  width: isMobile ? "95%" : "90%",
                  maxWidth: "500px",
                  zIndex: 1001,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontSize: isMobile ? "18px" : "20px",
                      fontWeight: "700",
                    }}
                  >
                    Add New Vehicle
                  </h2>
                  <button
                    onClick={() => setShowAddVehicle(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "20px",
                      cursor: "pointer",
                      color: "#64748b",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#64748b",
                    }}
                  >
                    Vehicle Name*
                  </label>
                  <input
                    type="text"
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    placeholder="e.g. Tesla Model 3"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#64748b",
                    }}
                  >
                    Vehicle Number*
                  </label>
                  <input
                    type="text"
                    value={newVehicle.number}
                    onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
                    placeholder="e.g. KA-01-AB-1234"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#64748b",
                    }}
                  >
                    Battery Capacity
                  </label>
                  <input
                    type="text"
                    value={newVehicle.batteryCapacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, batteryCapacity: e.target.value })}
                    placeholder="e.g. 75 kWh"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#64748b",
                    }}
                  >
                    Range
                  </label>
                  <input
                    type="text"
                    value={newVehicle.range}
                    onChange={(e) => setNewVehicle({ ...newVehicle, range: e.target.value })}
                    placeholder="e.g. 350 km"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#64748b",
                    }}
                  >
                    Connector Type
                  </label>
                  <select
                    value={newVehicle.connectorType}
                    onChange={(e) => setNewVehicle({ ...newVehicle, connectorType: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Type 1">Type 1</option>
                    <option value="Type 2">Type 2</option>
                    <option value="CCS">CCS</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="Tesla">Tesla</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <button
                    onClick={() => setShowAddVehicle(false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#f1f5f9",
                      color: "#64748b",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddVehicle}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    Add Vehicle
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
