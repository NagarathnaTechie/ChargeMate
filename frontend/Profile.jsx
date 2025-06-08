"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Navbar from "./Navbar"

export default function Profile() {
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [newVehicle, setNewVehicle] = useState({ name: "", number: "", batteryCapacity: "", range: "", connectorType: "" })
  const [connectorTypes, setConnectorTypes] = useState([])
  const navigate = useNavigate()

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

  // Fetch connector types
  useEffect(() => {
    axios.get("https://chargemate-sp0r.onrender.com/api/connectors")
      .then((response) => setConnectorTypes(response.data.connectors))
      .catch((error) => console.error("Error fetching connectors:", error))
  }, [])

  // Fetch user vehicles
  useEffect(() => {
    if (userInfo.email) {
      axios.get(`https://chargemate-sp0r.onrender.com/api/users/${userInfo.email}/vehicles`)
        .then((response) => setVehicles(response.data))
        .catch((error) => console.error("Error fetching vehicles:", error))
    }
  }, [userInfo.email])

  // Fetch bookings
  useEffect(() => {
    if (userInfo.email) {
      axios.get(`https://chargemate-sp0r.onrender.com/api/mybookings/${userInfo.email}`)
        .then((res) => setBookings(res.data))
        .catch((err) => console.error("Profile: Error fetching bookings:", err))
    }
  }, [userInfo.email])

  const handleBookingHistoryClick = () => navigate("/mybookings")

  const handleAddVehicle = async () => {
    if (!newVehicle.name || !newVehicle.number || !newVehicle.connectorType) {
      alert("Vehicle name, number, and connector type are required")
      return
    }
    try {
      const response = await axios.post(`https://chargemate-sp0r.onrender.com/api/users/${userInfo.email}/vehicles`, newVehicle)
      setVehicles(response.data)
      setNewVehicle({ name: "", number: "", batteryCapacity: "", range: "", connectorType: "" })
      setShowAddVehicle(false)
    } catch (error) {
      console.error("Error adding vehicle:", error)
      alert("Failed to add vehicle")
    }
  }

  const handleDeleteVehicle = async (id) => {
    if (window.confirm("Are you sure you want to remove this vehicle?")) {
      try {
        const response = await axios.delete(`https://chargemate-sp0r.onrender.com/api/users/${userInfo.email}/vehicles/${id}`)
        setVehicles(response.data)
      } catch (error) {
        console.error("Error deleting vehicle:", error)
        alert("Failed to delete vehicle")
      }
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginBottom: "24px" }}>My Profile</h1>
        <div style={{ padding: "24px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "16px" }}>User Information</h2>
          <p style={{ fontSize: "16px", color: "#475569" }}><strong>Name:</strong> {userInfo.name}</p>
          <p style={{ fontSize: "16px", color: "#475569" }}><strong>Email:</strong> {userInfo.email}</p>
        </div>
        <div style={{ padding: "24px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a" }}>My Vehicles</h2>
            <button onClick={() => setShowAddVehicle(true)} style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Add Vehicle</button>
          </div>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <div key={vehicle._id} style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#0f172a" }}>{vehicle.name} - {vehicle.number}</p>
                  <p style={{ fontSize: "14px", color: "#64748b" }}>Battery: {vehicle.batteryCapacity} | Range: {vehicle.range} | Connector: {vehicle.connectorType}</p>
                </div>
                <button onClick={() => handleDeleteVehicle(vehicle._id)} style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer" }}>Delete</button>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "16px", color: "#64748b" }}>No vehicles added yet.</p>
          )}
        </div>
        <div style={{ padding: "24px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a" }}>Booking History</h2>
            <button onClick={handleBookingHistoryClick} style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>View All</button>
          </div>
        </div>
        {showAddVehicle && (
          <>
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000 }} onClick={() => setShowAddVehicle(false)} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "90%", maxWidth: "500px", zIndex: 1001, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: "700" }}>Add New Vehicle</h2>
                <button onClick={() => setShowAddVehicle(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Vehicle Name*</label>
                <input type="text" value={newVehicle.name} onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })} placeholder="e.g. Tesla Model 3" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "16px" }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Vehicle Number*</label>
                <input type="text" value={newVehicle.number} onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })} placeholder="e.g. KA-01-AB-1234" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "16px" }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Battery Capacity</label>
                <input type="text" value={newVehicle.batteryCapacity} onChange={(e) => setNewVehicle({ ...newVehicle, batteryCapacity: e.target.value })} placeholder="e.g. 75 kWh" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "16px" }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Range</label>
                <input type="text" value={newVehicle.range} onChange={(e) => setNewVehicle({ ...newVehicle, range: e.target.value })} placeholder="e.g. 350 km" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "16px" }} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Connector Type*</label>
                <select value={newVehicle.connectorType} onChange={(e) => setNewVehicle({ ...newVehicle, connectorType: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "16px" }}>
                  <option value="">Select Connector Type</option>
                  {connectorTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setShowAddVehicle(false)} style={{ flex: 1, padding: "12px", backgroundColor: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "500", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleAddVehicle} style={{ flex: 1, padding: "12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "500", cursor: "pointer" }}>Add Vehicle</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
