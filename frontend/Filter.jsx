"use client"

import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import axios from "axios"
import { useNavigate } from "react-router-dom"

export default function Filter({ onClose }) {
  const [priceRange, setPriceRange] = useState([0, 100])
  const [rating, setRating] = useState(5)
  const [radius, setRadius] = useState(50)
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [addresses, setAddresses] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedAddress, setSelectedAddress] = useState("")
  const [connectors, setConnectors] = useState([])
  const [selectedConnector, setSelectedConnector] = useState("")
  const [activeTab, setActiveTab] = useState("location")
  const [userLocation, setUserLocation] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/filters")
      .then((response) => {
        console.log("Fetched countries:", response.data.countries)
        setCountries(response.data.countries)
      })
      .catch((error) => console.error("Error fetching countries:", error))
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      // Fetch states for the selected country
      axios
        .get(`http://localhost:5000/api/states/${selectedCountry}`)
        .then((response) => {
          console.log("Fetched states:", response.data.states)
          setStates(response.data.states)
        })
        .catch((error) => console.error("Error fetching states:", error))
      
      // Fetch connectors for the selected country
      axios
        .get(`http://localhost:5000/api/connectors/${selectedCountry}/${selectedState}`)
        .then((response) => {
          console.log("Fetched connectors for country:", response.data.connectors)
          setConnectors(response.data.connectors)
          // Reset selected connector when country changes
          setSelectedConnector("")
        })
        .catch((error) => console.error("Error fetching connectors for country:", error))
    } else {
      // Clear connectors when no country is selected
      setConnectors([])
      setSelectedConnector("")
    }
  }, [selectedCountry, selectedState])

  useEffect(() => {
    if (selectedCountry && selectedState) {
      axios
        .get(`http://localhost:5000/api/addresses/${selectedCountry}/${selectedState}`)
        .then((response) => {
          console.log("Fetched addresses:", response.data.addresses)
          setAddresses(response.data.addresses)
          setSelectedAddress("")
        })
        .catch((error) => console.error("Error fetching addresses:", error))
    }
  }, [selectedCountry, selectedState])



const getVillageName = async (lat, lon) => {
  const url = 'https://nominatim.openstreetmap.org/reverse';

  const params = {
    format: 'json',
    lat: lat,
    lon: lon
  };

  const headers = {
    accept: '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9,kn;q=0.8',
    origin: 'https://www.findlatlong.com',
    referer: 'https://www.findlatlong.com/',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  };

  const response = await axios.get(url, { headers, params });
  // console.log(response.data.address.country);
  setSelectedCountry(response.data.address.country)
  setSelectedState(response.data.address.state)
};



  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    setIsLoadingLocation(true)
    setLocationError("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
        
        getVillageName(latitude,longitude);
        setIsLoadingLocation(false)
        
      },
      (error) => {
        console.error("Error getting location:", error)
        setLocationError(
          error.code === 1
            ? "Location access denied. Please enable location services."
            : "Unable to retrieve your location"
        )
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleApplyFilters = async () => {
    const useRadiusOnly = radius !== 50
    const filters = {
      country: selectedCountry,
      state: selectedState,
      address: selectedAddress,
      connectionType: selectedConnector,
      priceRange: priceRange,
      ratingRange: [0, rating],
      radius: radius,
      useRadiusOnly: useRadiusOnly,
      userLocation: userLocation, // Add the user's location to the filters
    }
    console.log("Applying filters:", filters)
    try {
      const response = await axios.post("http://localhost:5000/api/recommendations", filters)
      console.log("Recommendations received:", response.data)
      navigate("/recommendations", { state: { recommendations: response.data } })
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    }
  }

  // Clear user location and reset related fields
  const clearUserLocation = () => {
    setUserLocation(null)
    setLocationError("")
  }

  // Generate star rating display
  const renderStars = (value) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(value)) {
        stars.push(
          <span key={i} style={{ color: "#FFD700" }}>
            ★
          </span>,
        )
      } else if (i === Math.floor(value) && value % 1 !== 0) {
        stars.push(
          <span key={i} style={{ color: "#FFD700" }}>
            ⯨
          </span>,
        )
      } else {
        stars.push(
          <span key={i} style={{ color: "#D3D3D3" }}>
            ☆
          </span>,
        )
      }
    }
    return stars
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(5px)",
          zIndex: 999,
        }}
        onClick={onClose}
      ></div>
      <div
        style={{
          position: "fixed", 
          top: "60%", 
          left: "50%",
          transform: "translate(-50%, -60%)", 
          width: "90%",
          maxWidth: "500px",
          backgroundColor: "#f8f9fa",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          zIndex: 1000,
          overflow: "hidden",
          maxHeight: "90vh",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 25px 10px",
            borderBottom: "1px solid #eaeaea",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "700",
              color: "#333",
            }}
          >
            ⚡ EV Charging Filters
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #eaeaea",
            backgroundColor: "#fff",
          }}
        >
          {[
            { id: "location", icon: "📍", label: "Location" },
            { id: "charging", icon: "🔌", label: "Charging" },
            { id: "price", icon: "💰", label: "Price" },
            { id: "rating", icon: "⭐", label: "Rating" },
            { id: "radius", icon: "⭕", label: "Radius" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 5px",
                border: "none",
                background: activeTab === tab.id ? "#f0f7ff" : "transparent",
                borderBottom: activeTab === tab.id ? "3px solid #0066ff" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "18px", marginBottom: "4px" }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: activeTab === tab.id ? "600" : "normal",
                  color: activeTab === tab.id ? "#0066ff" : "#666",
                }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: "20px 25px", height: "300px", overflowY: "auto" }}>
          {activeTab === "location" && (
            <div>
              {/* Live Location Button */}
              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={getUserLocation}
                  disabled={isLoadingLocation}
                  style={{
                    width: "100%",
                    padding: "14px 15px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: userLocation ? "#4CAF50" : "#0066ff",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isLoadingLocation ? "default" : "pointer",
                    opacity: isLoadingLocation ? 0.7 : 1,
                    boxShadow: "0 4px 10px rgba(0, 102, 255, 0.2)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isLoadingLocation ? (
                    "Getting location..."
                  ) : userLocation ? (
                    <>
                      <span style={{ marginRight: "8px" }}>✓</span> Location Found
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: "8px" }}>📍</span> Use My Live Location
                    </>
                  )}
                </button>
                
                {userLocation && (
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    marginTop: "10px",
                    fontSize: "14px",
                    color: "#666" 
                  }}>
                    <span>
                      Lat: {userLocation.latitude.toFixed(4)}, Long: {userLocation.longitude.toFixed(4)}
                    </span>
                    <button
                      onClick={clearUserLocation}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ff4d4d",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                
                {locationError && (
                  <div style={{ color: "#ff4d4d", fontSize: "14px", marginTop: "5px" }}>
                    {locationError}
                  </div>
                )}
              </div>

              {/* Or separator */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                margin: "20px 0",
                color: "#888" 
              }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
                <div style={{ margin: "0 10px", fontSize: "14px" }}>OR</div>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  🌎 Country
                </label>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value)
                      setSelectedState("")
                      setAddresses([])
                      setSelectedAddress("")
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      borderRadius: "10px",
                      border: "2px solid #e0e0e0",
                      backgroundColor: "#fff",
                      appearance: "none",
                      fontSize: "16px",
                      color: "#333",
                      outline: "none",
                    }}
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#666",
                    }}
                  >
                    ▼
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  🏙️ State
                </label>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      setAddresses([])
                      setSelectedAddress("")
                    }}
                    disabled={!selectedCountry}
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      borderRadius: "10px",
                      border: "2px solid #e0e0e0",
                      backgroundColor: !selectedCountry ? "#f5f5f5" : "#fff",
                      appearance: "none",
                      fontSize: "16px",
                      color: !selectedCountry ? "#999" : "#333",
                      outline: "none",
                    }}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: !selectedCountry ? "#999" : "#666",
                    }}
                  >
                    ▼
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  🏠 Address
                </label>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <select
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    disabled={!selectedState || addresses.length === 0}
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      borderRadius: "10px",
                      border: "2px solid #e0e0e0",
                      backgroundColor: !selectedState || addresses.length === 0 ? "#f5f5f5" : "#fff",
                      appearance: "none",
                      fontSize: "16px",
                      color: !selectedState || addresses.length === 0 ? "#999" : "#333",
                      outline: "none",
                    }}
                  >
                    <option value="">Select Address</option>
                    {addresses.map((address) => (
                      <option key={address} value={address}>
                        {address}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: !selectedState || addresses.length === 0 ? "#999" : "#666",
                    }}
                  >
                    ▼
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "charging" && (
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                🔌 Connector Type
              </label>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  marginBottom: "20px",
                }}
              >
                <select
                  value={selectedConnector}
                  onChange={(e) => setSelectedConnector(e.target.value)}
                  disabled={!selectedCountry || connectors.length === 0}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    backgroundColor: !selectedCountry || connectors.length === 0 ? "#f5f5f5" : "#fff",
                    appearance: "none",
                    fontSize: "16px",
                    color: !selectedCountry || connectors.length === 0 ? "#999" : "#333",
                    outline: "none",
                  }}
                >
                  <option value="">All Connectors</option>
                  {connectors.map((connector) => (
                    <option key={connector} value={connector}>
                      {connector}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: !selectedCountry || connectors.length === 0 ? "#999" : "#666",
                  }}
                >
                  ▼
                </div>
              </div>

              {!selectedCountry ? (
                <div style={{ textAlign: "center", color: "#666", padding: "20px 0" }}>
                  Please select a country first to see available connector types
                </div>
              ) : connectors.length === 0 ? (
                <div style={{ textAlign: "center", color: "#666", padding: "20px 0" }}>
                  No connector types available for the selected country
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {connectors.map((connector) => (
                    <button
                      key={connector}
                      onClick={() => setSelectedConnector(connector)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: selectedConnector === connector ? "#0066ff" : "#e9ecef",
                        color: selectedConnector === connector ? "#fff" : "#333",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        marginBottom: "5px"
                      }}
                    >
                      {connector}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "price" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <label
                  style={{
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  💰 Price Range
                </label>
                <div
                  style={{
                    padding: "8px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#e9ecef",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  ₹{priceRange[0]} - ₹{priceRange[1]}
                </div>
              </div>

              <div style={{ position: "relative", padding: "10px 0" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: "4px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "2px",
                    transform: "translateY(-50%)",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: `${priceRange[1]}%`,
                    height: "4px",
                    backgroundColor: "#0066ff",
                    borderRadius: "2px",
                    transform: "translateY(-50%)",
                  }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, Number.parseInt(e.target.value)])}
                  style={{
                    width: "100%",
                    appearance: "none",
                    background: "transparent",
                    margin: 0,
                    height: "30px",
                    position: "relative",
                    zIndex: 2,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "5px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                <span>₹0</span>
                <span>₹25</span>
                <span>₹50</span>
                <span>₹75</span>
                <span>₹100</span>
              </div>
            </div>
          )}

          {activeTab === "rating" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <label
                  style={{
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  ⭐ Minimum Rating
                </label>
                <div
                  style={{
                    padding: "8px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#e9ecef",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  {rating}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                  fontSize: "24px",
                }}
              >
                {renderStars(rating)}
              </div>

              <div style={{ position: "relative", padding: "10px 0" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: "4px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "2px",
                    transform: "translateY(-50%)",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: `${(rating / 5) * 100}%`,
                    height: "4px",
                    backgroundColor: "#FFD700",
                    borderRadius: "2px",
                    transform: "translateY(-50%)",
                  }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(Number.parseFloat(e.target.value))}
                  style={{
                    width: "100%",
                    appearance: "none",
                    background: "transparent",
                    margin: 0,
                    height: "30px",
                    position: "relative",
                    zIndex: 2,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "5px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          )}

          {activeTab === "radius" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <label
                  style={{
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  ⭕ Search Radius
                </label>
                <div
                  style={{
                    padding: "8px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#e9ecef",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  {radius} km
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                  fontSize: "24px",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: "3px solid #0066ff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: `${(radius / 250) * 100}%`,
                      height: `${(radius / 250) * 100}%`,
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 102, 255, 0.2)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px", fontWeight: "bold" }}>{radius} km</span>
                </div>
              </div>

              <div style={{ position: "relative", padding: "10px 0" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: "4px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "2px",
                    transform: "translateY(-50%)",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: `${((radius - 50) / 200) * 100}%`,
                    height: "4px",
                    backgroundColor: "#0066ff",
                    borderRadius: "2px",
                    transform: "translateY(-50%)",
                  }}
                ></div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="50"
                  value={radius}
                  onChange={(e) => setRadius(Number.parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    appearance: "none",
                    background: "transparent",
                    margin: 0,
                    height: "30px",
                    position: "relative",
                    zIndex: 2,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "5px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                <span>50km</span>
                <span>100km</span>
                <span>150km</span>
                <span>200km</span>
                <span>250km</span>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "15px 25px 25px",
            borderTop: "1px solid #eaeaea",
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "#fff",
          }}
        >
          <button
            onClick={() => {
              setPriceRange([0, 100])
              setRating(5)
              setRadius(50)
              setSelectedCountry("")
              setSelectedState("")
              setAddresses([])
              setSelectedAddress("")
              setSelectedConnector("")
            }}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "2px solid #e0e0e0",
              backgroundColor: "#fff",
              color: "#666",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ↺ Reset
          </button>
          <button
            onClick={() => {
              handleApplyFilters()
              onClose()
            }}
            style={{
              padding: "12px 25px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#0066ff",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0, 102, 255, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            ✓ Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}

Filter.propTypes = {
  onClose: PropTypes.func.isRequired,
}

