"use client"

// frontend/components/Home.jsx
import { useState, useEffect } from "react"
import Navbar from "./Navbar"
import Map from "./Map"
import Filter from "./Filter"
import CountryDropdown from "./CountryDropdown"

export default function Home() {
  const [showFilter, setShowFilter] = useState(false)
  const [showCountry, setShowCountry] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredStations, setFilteredStations] = useState([])
  const [viewMode, setViewMode] = useState("map") // "map" or "list"
  const [quickStats, setQuickStats] = useState({
    totalStations: 0,
    availableNow: 0,
    IndianStations: 0,
  })

  useEffect(() => {
    // Simulate fetching stats
    setQuickStats({
      totalStations: filteredStations.length || 2767,
      availableNow: filteredStations.length || 2767,
      IndianStations: filteredStations.length || 125,
    })
  }, [filteredStations])

  const handleSearch = (query) => {
    console.log("Home: Search query:", query)
    setSearchQuery(query)
  }

  const handleApplyFilters = (stations) => {
    console.log("Home: Stations to display:", stations)
    setFilteredStations(stations)
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <Navbar
        onFilterClick={() => setShowFilter(!showFilter)}
        onCountryClick={() => setShowCountry(!showCountry)}
        onCountrySelect={(country) => {
          console.log("Home: Country selected:", country)
          setSelectedCountry(country)
          setShowCountry(false)
        }}
        onSearch={handleSearch}
      />

      {/* Dashboard Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              margin: 0,
              color: "#0f172a",
            }}
          >
            {selectedCountry ? `Charging Stations in ${selectedCountry}` : "Find Charging Stations"}
          </h1>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setViewMode("map")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: viewMode === "map" ? "#3b82f6" : "#f1f5f9",
                color: viewMode === "map" ? "white" : "#64748b",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🗺️</span> Map View
            </button>
            
          </div>
        </div>

       
      </div>

      {/* Main Content */}
      <div
        style={{
          position: "relative",
          flexGrow: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: viewMode === "list" ? "100%" : "320px",
            backgroundColor: "white",
            borderRight: "1px solid #e2e8f0",
            overflowY: "auto",
            display: viewMode === "map" ? "block" : "flex",
            flexDirection: "column",
          }}
        >
          {/* Active Filters */}
          {selectedCountry && (
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#64748b" }}>Active Filters:</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  backgroundColor: "#eff6ff",
                  borderRadius: "16px",
                  fontSize: "13px",
                  color: "#3b82f6",
                }}
              >
                <span>🌎</span>
                <span>{selectedCountry}</span>
                <span style={{ cursor: "pointer", fontSize: "16px" }} onClick={() => setSelectedCountry(null)}>
                  ×
                </span>
              </div>
            </div>
          )}

          {/* Station List */}
          <div
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
            }}
          >
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => <StationCard key={station._id} station={station} />)
            ) : (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#64748b",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  flex: viewMode === "list" ? 1 : "unset",
                  justifyContent: viewMode === "list" ? "center" : "flex-start",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                  }}
                >
                  🔍
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontSize: "16px" }}>No stations found</h3>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Try adjusting your filters or search for a different location
                  </p>
                </div>
                <button
                  onClick={() => setShowFilter(true)}
                  style={{
                    marginTop: "8px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>⚙️</span> Adjust Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        {viewMode === "map" && (
          <div style={{ flex: 1 }}>
            <Map selectedCountry={selectedCountry} searchQuery={searchQuery} />
          </div>
        )}

        {/* Filter Panel */}
        {showFilter && <Filter onClose={() => setShowFilter(false)} onApplyFilters={handleApplyFilters} />}

        {/* Country Dropdown */}
        {showCountry && <CountryDropdown onSelectCountry={setSelectedCountry} />}
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ icon, value, label, color }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: `${color}10`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>{value}</div>
        <div style={{ fontSize: "13px", color: "#64748b" }}>{label}</div>
      </div>
    </div>
  )
}

function StationCard({ station }) {
  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)"
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#0f172a",
            }}
          >
            {station.StationTitle}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            <span>📍</span>
            <span>{station.AddressLine}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            <span>🌎</span>
            <span>
              {station.State}, {station.Country}
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ecfdf5",
            color: "#10b981",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>✓</span>
          <span>Available</span>
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f8fafc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Power</div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>⚡</span>
              <span>{station.PowerKW || "22"} kW</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Type</div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>🔌</span>
              <span>{station.ConnectionType || "Type 2"}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#10b981",
            }}
          >
            ₹{station.Price}
          </div>
          <div
            style={{
              display: "flex",
              gap: "2px",
              color: "#f59e0b",
              fontSize: "14px",
            }}
          >
            {"★".repeat(station.Rating)}
            {"☆".repeat(5 - station.Rating)}
          </div>
        </div>
      </div>
    </div>
  )
}

