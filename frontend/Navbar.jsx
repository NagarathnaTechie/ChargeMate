"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import CountryDropdown from "./CountryDropdown"
import axios from "axios"

export default function Navbar({ onFilterClick, onCountrySelect, onSearch, unreadCount: propUnreadCount = 0 }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [batteryLevel, setBatteryLevel] = useState(75) // Simulated battery level
  const [userInfo, setUserInfo] = useState({ name: "", email: "" })
  const [showVehicleInfo, setShowVehicleInfo] = useState(false)
  const [unreadCount, setUnreadCount] = useState(propUnreadCount) // Initialize with prop
  const searchRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in (JWT exists)
    const token = localStorage.getItem("token")
    const userId = localStorage.getItem("userId")

    if (token && userId) {
      setIsAuthenticated(true)
      fetchUserInfo(token, userId)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  // Fetch user info and unread notifications
  const fetchUserInfo = async (token, userId) => {
    try {
      // Fetch user details
      const userResponse = await axios.get(`https://chargemate-sp0r.onrender.com/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (userResponse.data) {
        const userData = {
          name: userResponse.data.fullName || "User",
          email: userResponse.data.email || "",
        }
        setUserInfo(userData)
        localStorage.setItem("userData", JSON.stringify(userData))

        // Fetch unread notifications
        const notificationsResponse = await axios.get(`https://chargemate-sp0r.onrender.com/api/notifications`, {
          params: { user: userData.email, unread: true },
        })
        setUnreadCount(notificationsResponse.data.length)
      }
    } catch (error) {
      console.error("Error fetching user data or notifications:", error)
      // Fallback to cached user data
      const cachedUserData = localStorage.getItem("userData")
      if (cachedUserData) {
        try {
          const parsedData = JSON.parse(cachedUserData)
          setUserInfo({
            name: parsedData.name || "User",
            email: parsedData.email || "",
          })
        } catch (e) {
          console.error("Error parsing cached user data:", e)
        }
      }
    }
  }

  // Update unreadCount when prop changes
  useEffect(() => {
    setUnreadCount(propUnreadCount)
  }, [propUnreadCount])

  // Handle search input changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      axios
        .get(`https://chargemate-sp0r.onrender.com/search?q=${searchQuery}`)
        .then((response) => {
          setSearchResults(response.data)
          setShowSearchResults(true)
        })
        .catch((error) => {
          console.error("Error fetching search results:", error)
          setSearchResults([])
        })
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userData")
    setIsAuthenticated(false)
    setUserInfo({ name: "", email: "" })
    setUnreadCount(0)
    navigate("/") // Redirect to login page
  }

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery)
    }
    setShowSearchResults(false)
  }

  const handleSearchItemClick = (station) => {
    setSearchQuery(station.StationTitle)
    setShowSearchResults(false)
    if (onSearch) {
      onSearch(station.StationTitle)
    }
  }

  const handleMyBookingsClick = () => {
    console.log("Navbar: Navigating to MyBookings")
    setShowProfileDropdown(false)
    navigate("/mybookings")
  }

  const handleNotification = () => {
    console.log("Navbar: Navigating to Notifications")
    setShowProfileDropdown(false)
    navigate("/notification")
  }

  const handleAboutClick = () => {
    setShowProfileDropdown(false)
    setShowVehicleInfo(true)
  }

  const handleLogoClick = () => {
    navigate("/home")
  }

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "linear-gradient(90deg, #0f172a, #1e293b)",
        color: "white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        position: "relative",
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
        }}
        onClick={handleLogoClick}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #10b981, #3b82f6)",
            transform: "rotate(-5deg)",
          }}
        >
          <span style={{ fontSize: "22px" }}>⚡</span>
        </div>
        <div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              background: "linear-gradient(90deg, #10b981, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Chargemate
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              marginTop: "2px",
            }}
          >
            Find charging stations near you
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px",
          padding: "4px",
          backdropFilter: "blur(10px)",
        }}
      >
        {isAuthenticated && (
          <>
            <NavButton icon="🏠" label="Home" onClick={() => navigate("/home")} />
            <NavButton icon="🔋" label="Bookings" onClick={() => navigate("/bookings")} />
            <NavButton icon="⚙️" label="Filter" onClick={onFilterClick} />
            <NavButton
              icon="🌎"
              label="Country"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              active={showCountryDropdown}
            />
          </>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", width: "30%" }} ref={searchRef}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.07)",
            borderRadius: "12px",
            padding: "8px 16px",
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ marginRight: "8px", color: "#10b981" }}>🔌</span>
          <input
            type="text"
            placeholder="Search charging stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: "14px",
              padding: "4px 0",
            }}
          />
          <span
            style={{
              color: "#10b981",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleSearch}
          >
            🔍
          </span>
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "#1e293b",
              borderRadius: "0 0 12px 12px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
              marginTop: "4px",
              maxHeight: "300px",
              overflowY: "auto",
              zIndex: 1000,
            }}
          >
            {searchResults.map((station) => (
              <div
                key={station._id}
                onClick={() => handleSearchItemClick(station)}
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div style={{ fontWeight: "500", color: "white" }}>{station.StationTitle}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                  {station.AddressLine}, {station.State}, {station.Country}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #10b981, #3b82f6)",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
          border: "2px solid rgba(255,255,255,0.2)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)"
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(59, 130, 246, 0.3)"
        }}
      >
        &#128100;
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              backgroundColor: "#ef4444",
              color: "white",
              fontSize: "10px",
              fontWeight: "600",
              padding: "2px 6px",
              borderRadius: "10px",
              minWidth: "16px",
              textAlign: "center",
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* Profile Dropdown */}
      {showProfileDropdown && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            right: "20px",
            backgroundColor: "#1e293b",
            borderRadius: "12px",
            padding: "5px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 1000,
            border: "1px solid rgba(255,255,255,0.1)",
            minWidth: "200px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>{userInfo.name || "User"}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
              {userInfo.email || "No email available"}
            </div>
          </div>

          <ProfileDropdownItem icon="ℹ️" label="About" onClick={handleAboutClick} />
          <ProfileDropdownItem icon="🔋" label="My Bookings" onClick={handleMyBookingsClick} />
          <ProfileDropdownItem
            icon="🔔"
            label="Notification"
            onClick={handleNotification}
            badgeCount={unreadCount}
          />
          <ProfileDropdownItem icon="🚪" label="Logout" onClick={handleLogout} isLast={true} />
        </div>
      )}

      {/* Vehicle Info Modal */}
      {showVehicleInfo && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 1001,
            }}
            onClick={() => setShowVehicleInfo(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              zIndex: 1002,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
            >
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: "700" }}>Vehicle Information</h2>
              <button
                onClick={() => setShowVehicleInfo(false)}
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

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
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
                      marginRight: "12px",
                    }}
                  >
                    🚗
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "16px" }}>Tesla Model 3</div>
                    <div style={{ color: "#64748b", fontSize: "14px" }}>KA-01-AB-1234</div>
                  </div>
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
                    Battery: 75 kWh
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
                    Range: 350 km
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
                    Type 2 Connector
                  </div>
                </div>
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onClick={() => navigate("/profile")}
            >
              <span>➕</span> Add More Vehicles
            </button>
          </div>
        </>
      )}

      {/* Country Dropdown */}
      {showCountryDropdown && (
        <CountryDropdown
          onSelectCountry={(country) => {
            setShowCountryDropdown(false)
            onCountrySelect(country)
          }}
        />
      )}

      {/* Charging Animation */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          width: "100%",
          height: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            height: "100%",
            width: "50%",
            background: "linear-gradient(90deg, transparent, #10b981, transparent)",
            animation: "charging 2s infinite linear",
          }}
        />
      </div>
      <style>
        {`
          @keyframes charging {
            0% { left: -50%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </nav>
  )
}

// Helper Components
function NavButton({ icon, label, onClick, active = false }) {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        background: active ? "rgba(16, 185, 129, 0.2)" : "transparent",
        color: active ? "#10b981" : "white",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        transition: "all 0.2s ease",
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.1)"
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.background = "transparent"
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}

function ProfileDropdownItem({ icon, label, onClick, isLast = false, badgeCount = 0 }) {
  return (
    <div
      style={{
        padding: "10px 16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        transition: "background-color 0.2s ease",
        color: "white",
        position: "relative",
      }}
      onClick={onClick}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badgeCount > 0 && (
        <span
          style={{
            position: "absolute",
            right: "16px",
            backgroundColor: "#ef4444",
            color: "white",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 6px",
            borderRadius: "10px",
            minWidth: "16px",
            textAlign: "center",
          }}
        >
          {badgeCount}
        </span>
      )}
    </div>
  )
}

Navbar.propTypes = {
  onFilterClick: PropTypes.func.isRequired,
  onCountrySelect: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  unreadCount: PropTypes.number,
}
