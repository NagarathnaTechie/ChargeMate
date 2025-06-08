"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import axios from "axios"

export default function Booking() {
  const location = useLocation()
  const navigate = useNavigate()
  const preFilledStation = location.state?.station || null
  const editMode = location.state?.editMode || false
  const existingBooking = location.state?.existingBooking || null
  const bookingId = location.state?.bookingId || null

  const [selectedDate, setSelectedDate] = useState(
    editMode && existingBooking?.bookingDate ? new Date(existingBooking.bookingDate) : new Date(),
  )
  const [selectedTime, setSelectedTime] = useState(null)
  const [duration, setDuration] = useState(editMode && existingBooking?.timeSlot ? existingBooking.timeSlot : 30)
  const [station, setStation] = useState(preFilledStation)
  const [availableSlots, setAvailableSlots] = useState(preFilledStation ? preFilledStation.Quantity : null)
  const [country, setCountry] = useState(preFilledStation ? preFilledStation.Country : "")
  const [stateField, setStateField] = useState(preFilledStation ? preFilledStation.State : "")
  const [showSuccess, setShowSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [showStripeOptions, setShowStripeOptions] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [stations, setStations] = useState([])
  const [timeSlotAvailability, setTimeSlotAvailability] = useState({})
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [isConnectorCompatible, setIsConnectorCompatible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

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
  const userInfo = useMemo(() => {
    const userData = localStorage.getItem("userData")
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }
    return { name: "", email: "" }
  }, [])

  // Load vehicles from backend
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get(`https://chargemate-sp0r.onrender.com/api/users/${userInfo.email}/vehicles`)
        const fetchedVehicles = response.data
        setVehicles(fetchedVehicles)
        if (editMode && existingBooking?.vehicle) {
          setSelectedVehicle(existingBooking.vehicle)
        } else if (fetchedVehicles.length > 0) {
          setSelectedVehicle(fetchedVehicles[0]) // Default to first vehicle
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err)
        setMessage("Failed to load vehicles")
      }
    }
    if (userInfo.email) {
      fetchVehicles()
    }
  }, [userInfo.email, editMode, existingBooking])

  // Check connector compatibility
  useEffect(() => {
    if (station && selectedVehicle) {
      const stationConnector = station.ConnectionType?.toLowerCase()
      const vehicleConnector = selectedVehicle.connectorType?.toLowerCase()
      setIsConnectorCompatible(stationConnector === vehicleConnector)
    } else {
      setIsConnectorCompatible(false) // Disable booking if either is missing
    }
  }, [station, selectedVehicle])

  // Generate time slots
  const timeSlots = useMemo(() => {
  const slots = []
  const now = new Date()
  const isToday = selectedDate.toDateString() === now.toDateString()

  let start = new Date(selectedDate)
  if (isToday) {
    const minutes = now.getMinutes()
    const nextSlotMinutes = minutes < 30 ? 30 : 60
    start.setHours(now.getHours(), nextSlotMinutes, 0, 0)
  } else {
    start.setHours(6, 0, 0, 0)
  }

  const end = new Date(selectedDate)
  end.setHours(23, 30, 0, 0)

  while (start <= end) {
    slots.push(new Date(start))
    start = new Date(start.getTime() + 30 * 60000)
  }

  return slots
}, [selectedDate])
 

  // Format time for display and API consistency
  const formatTime = (date) => {
    if (!date) return ""
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }

  // Calculate end time based on selected time and duration
  const endTime = useMemo(() => {
    if (!selectedTime) return ""
    const end = new Date(selectedTime.getTime() + duration * 60000)
    return formatTime(end)
  }, [selectedTime, duration])

  // Format date for API calls and display
  const formatDateForAPI = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Fetch available slots
  const fetchAvailableSlots = useCallback(async () => {
    if (!station || !selectedDate) return

    setIsLoadingAvailability(true)
    const formattedDate = formatDateForAPI(selectedDate)
    const availabilityMap = {}

    try {
      // Fetch availability for all time slots
      const promises = timeSlots.map(async (slot) => {
        const formattedTime = formatTime(slot)
        const response = await axios.get(
          `https://chargemate-sp0r.onrender.com/api/availability?stationId=${station._id}&bookingDate=${formattedDate}&bookingTime=${formattedTime}&duration=${duration}`,
        )
        return { time: formattedTime, availableSlots: response.data.availableSlots }
      })

      const results = await Promise.all(promises)
      results.forEach(({ time, availableSlots }) => {
        availabilityMap[time] = availableSlots
      })

      setTimeSlotAvailability(availabilityMap)
      // Set available slots for the selected time, defaulting to station.Quantity if not yet fetched
      setAvailableSlots(availabilityMap[formatTime(selectedTime)] ?? station.Quantity)
    } catch (error) {
      console.error("Error fetching availability:", error)
      setAvailableSlots(station.Quantity) // Fallback to total slots
      setMessage("Failed to fetch availability. Showing total slots.")
    } finally {
      setIsLoadingAvailability(false)
    }
  }, [station, selectedDate, duration, timeSlots, selectedTime])

  // Update useEffect to trigger on duration change
  useEffect(() => {
    if (station && selectedDate) fetchAvailableSlots()
  }, [station, selectedDate, duration, fetchAvailableSlots])

  useEffect(() => {
    axios.get("https://chargemate-sp0r.onrender.com/api/filters").then((response) => setCountries(response.data.countries))
  }, [])

  useEffect(() => {
    if (country) {
      axios.get(`https://chargemate-sp0r.onrender.com/api/states/${country}`).then((response) => setStates(response.data.states))
    } else {
      setStates([])
    }
  }, [country])

  useEffect(() => {
    if (country && stateField) {
      axios
        .get(`https://chargemate-sp0r.onrender.com/api/stations?country=${country}&state=${stateField}`)
        .then((response) => setStations(response.data))
    } else {
      setStations([])
    }
  }, [country, stateField])

  useEffect(() => {
    if (station && selectedDate && selectedTime) fetchAvailableSlots()
  }, [station, selectedDate, selectedTime, fetchAvailableSlots])

  useEffect(() => {
    if (!selectedTime && timeSlots.length > 0) {
      if (editMode && existingBooking?.bookingTime) {
        const [hours, minutes] = existingBooking.bookingTime.split(":").map(Number)
        const bookingTime = new Date()
        bookingTime.setHours(hours, minutes, 0, 0)
        const closestSlot = timeSlots.reduce((prev, curr) =>
          Math.abs(curr - bookingTime) < Math.abs(prev - bookingTime) ? curr : prev,
        )
        setSelectedTime(closestSlot)
      } else {
        setSelectedTime(timeSlots[0])
      }
    }
  }, [timeSlots, editMode, existingBooking])

  const handleSelectStation = (e) => {
    const selected = stations.find((s) => s._id === e.target.value)
    setStation(selected)
    setAvailableSlots(selected?.Quantity || 0)
    setTimeSlotAvailability({})
    if (selected && selectedDate && selectedTime) fetchAvailableSlots()
  }

  const handleDateChange = (e) => {
    const inputDate = new Date(e.target.value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 14)

    if (inputDate >= today && inputDate <= maxDate) {
      setSelectedDate(inputDate)
      setTimeSlotAvailability({})
      if (station && selectedTime) fetchAvailableSlots()
    } else {
      setMessage("Please select a date between today and 14 days from now.")
      setSelectedDate(today) // Reset to today
      e.target.value = formatDateForAPI(today) // Reset input field
    }
  }

  const isTimeSlotAvailable = (timeSlot) => {
    if (!station) return false
    const timeStr = formatTime(timeSlot)

    // Check if slot is in the past (for today only)
    const isToday = selectedDate.toDateString() === new Date().toDateString()
    if (isToday) {
      const slotDateTime = new Date(selectedDate)
      const [hours, minutes] = timeStr.split(":").map(Number)
      slotDateTime.setHours(hours, minutes, 0, 0)
      if (slotDateTime < new Date()) {
        return false // Disable past time slots
      }
    }

    if (timeSlotAvailability[timeStr] !== undefined) return timeSlotAvailability[timeStr] > 0
    if (editMode && existingBooking && timeStr === existingBooking.bookingTime) return true
    return availableSlots > 0
  }

  const getAvailableSlotsForTime = (time) =>
    time ? (timeSlotAvailability[formatTime(time)] !== undefined ? timeSlotAvailability[formatTime(time)] : null) : null

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
    setShowStripeOptions(method === "online")
  }

  const processRazorpayPayment = async () => {
    if (!selectedVehicle) {
      setMessage("Please select a vehicle before proceeding with payment.")
      return
    }
    setIsProcessingPayment(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = async () => {
      try {
        const orderRes = await axios.post("https://chargemate-sp0r.onrender.com/api/order", { amount: 10000, currency: "INR" })
        const { id: order_id, amount, currency } = orderRes.data
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_5d6WZ14fzrObDz",
          amount,
          currency,
          name: "ChargeMate",
          description: "EV Charging Payment",
          order_id,
          handler: async (response) => {
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response
            try {
              const verifyRes = await axios.post("https://chargemate-sp0r.onrender.com/api/verify-payment", {
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
              })
              if (verifyRes.data.message === "Payment verified") submitBooking(true)
              else {
                setMessage("Payment verification failed.")
                setIsProcessingPayment(false)
              }
            } catch (verifyErr) {
              setMessage("Payment verification error.")
              setIsProcessingPayment(false)
            }
          },
          prefill: { name: userInfo.name, email: userInfo.email },
          theme: { color: "#3b82f6" },
        }
        const razorpay = new window.Razorpay(options)
        razorpay.on("payment.failed", (response) => {
          setMessage(`Payment failed: ${response.error.description}`)
          setIsProcessingPayment(false)
        })
        razorpay.open()
      } catch (err) {
        setMessage("Payment initiation failed.")
        setIsProcessingPayment(false)
      }
    }
    script.onerror = () => {
      setMessage("Failed to load payment gateway.")
      setIsProcessingPayment(false)
    }
    document.body.appendChild(script)
  }

  const submitBooking = async (paymentVerified = false) => {
    if (!station) {
      setMessage("Please select a station.")
      return
    }
    if (!selectedVehicle) {
      setMessage("Please select a vehicle.")
      return
    }
    if (!isConnectorCompatible) {
      setMessage("Selected vehicle is not compatible with the station's connector type.")
      return
    }
    if (availableSlots === 0 && !editMode) {
      setMessage("No available slots.")
      return
    }
    if (!selectedTime || !selectedDate) {
      setMessage("Please select time and date.")
      return
    }
    if (!userInfo.email) {
      setMessage("User info not available.")
      return
    }

    try {
      const formattedDate = formatDateForAPI(selectedDate)
      const formattedTime = formatTime(selectedTime)
      const bookingData = {
        customerName: userInfo.name,
        customerEmail: userInfo.email,
        stationId: station._id,
        timeSlot: duration,
        bookingDate: formattedDate,
        bookingTime: formattedTime,
        paymentMethod,
        paymentVerified,
        user: userInfo.email,
        vehicle: selectedVehicle,
      }

      if (editMode && bookingId) {
        const response = await axios.put(`https://chargemate-sp0r.onrender.com/api/bookings/${bookingId}`, bookingData)
        setMessage(response.data.message || "Booking updated successfully")
      } else {
        const response = await axios.post("https://chargemate-sp0r.onrender.com/api/bookings", bookingData)
        setMessage(response.data.message || "Booking successful")
      }
      setShowSuccess(true)
      setIsProcessingPayment(false)
      fetchAvailableSlots()
    } catch (err) {
      setMessage(err.response?.data?.error || "Booking failed")
      setIsProcessingPayment(false)
    }
  }

  const handleBooking = (e) => {
    e.preventDefault()
    if (!selectedVehicle) {
      setMessage("Please select a vehicle before booking.")
      return
    }
    if (!isConnectorCompatible) {
      setMessage("Selected vehicle is not compatible with the station's connector type.")
      return
    }
    if (paymentMethod === "cash") submitBooking()
    else if (paymentMethod === "online") processRazorpayPayment()
  }

  const isBookingDisabled = () =>
    !station ||
    !selectedTime ||
    !selectedDate ||
    !selectedVehicle ||
    !isConnectorCompatible ||
    (paymentMethod === "online" && isProcessingPayment) ||
    (!editMode && !isTimeSlotAvailable(selectedTime))

  return (
    <>
      <Navbar />
      <div
        style={{
          maxHeight: "100vh",
          backgroundColor: "#f5f7fa",
          padding: isMobile ? "16px" : "24px",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #10b981, #3b82f6)",
              padding: isMobile ? "20px 16px" : "24px",
              color: "white",
              position: "relative",
            }}
          >
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: isMobile ? "20px" : "24px",
                fontWeight: "700",
                paddingRight: "40px",
              }}
            >
              {editMode ? "Update Your Booking" : "Book a Charging Session"}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? "14px" : "16px" }}>
              {editMode ? "Make changes to your existing booking" : "Reserve a charging slot"}
            </p>
            <button
              onClick={() => navigate(-1)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                fontSize: "18px",
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: isMobile ? "16px" : "24px" }}>
            {/* Station Selection Section */}
            <div
              style={{
                marginBottom: "20px",
                padding: isMobile ? "16px" : "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "600",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>📍</span> Select Charging Station
              </h2>
              {preFilledStation ? (
                <div>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: isMobile ? "14px" : "16px",
                        marginBottom: "8px",
                        color: "#0f172a",
                      }}
                    >
                      {preFilledStation.StationTitle}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                      {preFilledStation.AddressLine}, {preFilledStation.State}, {preFilledStation.Country}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#f0f9ff",
                          color: "#0284c7",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {preFilledStation.ConnectionType}
                      </div>
                      <div
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#f0fdf4",
                          color: "#16a34a",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {preFilledStation.PowerKW} kW
                      </div>
                      <div
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#fef3c7",
                          color: "#d97706",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        ₹{preFilledStation.Price}/kWh
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      backgroundColor: isLoadingAvailability
                        ? "#f8fafc"
                        : isTimeSlotAvailable(selectedTime)
                          ? "#f0fdf4"
                          : "#fef2f2",
                      borderRadius: "8px",
                      border: `1px solid ${isLoadingAvailability ? "#e2e8f0" : isTimeSlotAvailable(selectedTime) ? "#dcfce7" : "#fee2e2"}`,
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>
                      {isLoadingAvailability ? "⏳" : isTimeSlotAvailable(selectedTime) ? "✅" : "❌"}
                    </span>
                    <span
                      style={{
                        fontWeight: "500",
                        color: isLoadingAvailability
                          ? "#64748b"
                          : isTimeSlotAvailable(selectedTime)
                            ? "#16a34a"
                            : "#dc2626",
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                    >
                      {isLoadingAvailability
                        ? "Checking availability..."
                        : selectedTime
                          ? getAvailableSlotsForTime(selectedTime) !== null
                            ? `${getAvailableSlotsForTime(selectedTime)} slot${getAvailableSlotsForTime(selectedTime) === 1 ? "" : "s"} available at ${formatTime(selectedTime)}`
                            : `No slots available at ${formatTime(selectedTime)}`
                          : "Select a time to check availability"}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
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
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value)
                        setStateField("")
                        setStation(null)
                        setAvailableSlots(null)
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "white",
                        fontSize: "16px",
                        color: "#0f172a",
                      }}
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
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
                      State
                    </label>
                    <select
                      value={stateField}
                      onChange={(e) => {
                        setStateField(e.target.value)
                        setStation(null)
                        setAvailableSlots(null)
                      }}
                      disabled={!country}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: country ? "white" : "#f8fafc",
                        fontSize: "16px",
                        color: country ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      <option value="">Select State</option>
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
                      Station
                    </label>
                    <select
                      value={station ? station._id : ""}
                      onChange={handleSelectStation}
                      disabled={!stateField}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: stateField ? "white" : "#f8fafc",
                        fontSize: "16px",
                        color: stateField ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      <option value="">Select Station</option>
                      {stations.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.StationTitle} - {s.Quantity} slots total
                        </option>
                      ))}
                    </select>
                  </div>
                  {station && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px",
                        backgroundColor: isLoadingAvailability
                          ? "#f8fafc"
                          : isTimeSlotAvailable(selectedTime)
                            ? "#f0fdf4"
                            : "#fef2f2",
                        borderRadius: "8px",
                        border: `1px solid ${isLoadingAvailability ? "#e2e8f0" : isTimeSlotAvailable(selectedTime) ? "#dcfce7" : "#fee2e2"}`,
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>
                        {isLoadingAvailability ? "⏳" : isTimeSlotAvailable(selectedTime) ? "✅" : "❌"}
                      </span>
                      <span
                        style={{
                          fontWeight: "500",
                          color: isLoadingAvailability
                            ? "#64748b"
                            : isTimeSlotAvailable(selectedTime)
                              ? "#16a34a"
                              : "#dc2626",
                          fontSize: isMobile ? "13px" : "14px",
                        }}
                      >
                        {isLoadingAvailability
                          ? "Checking availability..."
                          : selectedTime
                            ? getAvailableSlotsForTime(selectedTime) !== null
                              ? `${getAvailableSlotsForTime(selectedTime)} slot${getAvailableSlotsForTime(selectedTime) === 1 ? "" : "s"} available at ${formatTime(selectedTime)}`
                              : `No slots available at ${formatTime(selectedTime)}`
                            : "Select a time to check availability"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Selection Section */}
            <div
              style={{
                marginBottom: "20px",
                padding: isMobile ? "16px" : "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "600",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>🚗</span> Select Vehicle
              </h2>
              {vehicles.length > 0 ? (
                <div>
                  <select
                    value={selectedVehicle ? selectedVehicle._id : ""}
                    onChange={(e) => {
                      const vehicle = vehicles.find((v) => v._id === e.target.value)
                      setSelectedVehicle(vehicle)
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "white",
                      fontSize: "16px",
                      color: "#0f172a",
                    }}
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} - {v.number}
                      </option>
                    ))}
                  </select>
                  {selectedVehicle && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: "#eff6ff",
                        borderRadius: "8px",
                        border: "1px solid #dbeafe",
                      }}
                    >
                      <div style={{ fontWeight: "500", color: "#1e40af", fontSize: isMobile ? "14px" : "16px" }}>
                        Selected Vehicle
                      </div>
                      <div style={{ fontSize: "14px", color: "#3b82f6" }}>
                        {selectedVehicle.name} | {selectedVehicle.number}
                      </div>
                      <div style={{ fontSize: "14px", color: "#3b82f6" }}>
                        Battery: {selectedVehicle.batteryCapacity} | Range: {selectedVehicle.range}
                      </div>
                    </div>
                  )}
                  {selectedVehicle && station && !isConnectorCompatible && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "8px",
                        border: "1px solid #fee2e2",
                        color: "#dc2626",
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                    >
                      Incompatible connector types: Vehicle requires {selectedVehicle.connectorType}, but station
                      provides {station.ConnectionType}.
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#fef2f2",
                    borderRadius: "12px",
                    border: "1px solid #fee2e2",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: "#dc2626", marginBottom: "12px", fontSize: isMobile ? "14px" : "16px" }}>
                    Add a vehicle in your profile to book.
                  </p>
                  <button
                    onClick={() => navigate("/profile")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Go to Profile
                  </button>
                </div>
              )}
            </div>

            {/* Date and Time Selection */}
            <div
              style={{
                marginBottom: "20px",
                padding: isMobile ? "16px" : "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "600",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>📅</span> Select Date & Time
              </h2>
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
                  Date
                </label>
                <input
                  type="date"
                  value={
                    selectedDate
                      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
                      : ""
                  }
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  max={new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split("T")[0]}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    fontSize: "16px",
                    color: "#0f172a",
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
                  Time
                </label>
                <select
                  value={selectedTime ? selectedTime.toISOString() : ""}
                  onChange={(e) => setSelectedTime(e.target.value ? new Date(e.target.value) : null)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    fontSize: "16px",
                    color: "#0f172a",
                  }}
                >
                  <option value="">Select Time</option>
                  {timeSlots.map((slot, index) => {
                    const timeStr = formatTime(slot)
                    const isAvailable = isTimeSlotAvailable(slot)
                    return (
                      <option key={index} value={slot.toISOString()} disabled={!isAvailable && !editMode}>
                        {timeStr} {!isAvailable && !editMode ? "(Full)" : ""}
                      </option>
                    )
                  })}
                </select>
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
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    fontSize: "16px",
                    color: "#0f172a",
                  }}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1 hour 30 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              {selectedTime && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    border: "1px solid #dbeafe",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>⏰</span>
                  <div>
                    <div style={{ fontWeight: "500", color: "#1e40af", fontSize: isMobile ? "14px" : "16px" }}>
                      Your Slot
                    </div>
                    <div style={{ fontSize: isMobile ? "13px" : "14px", color: "#3b82f6" }}>
                      {formatDate(selectedDate)} | {formatTime(selectedTime)} - {endTime}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div
              style={{
                marginBottom: "20px",
                padding: isMobile ? "16px" : "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "600",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>💳</span> Payment Options
              </h2>
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "16px",
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <div
                    onClick={() => handlePaymentMethodChange("cash")}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: "8px",
                      border: `2px solid ${paymentMethod === "cash" ? "#3b82f6" : "#e2e8f0"}`,
                      backgroundColor: paymentMethod === "cash" ? "#eff6ff" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "20px" }}>💵</span>
                      <span
                        style={{
                          fontWeight: "600",
                          color: paymentMethod === "cash" ? "#1e40af" : "#0f172a",
                          fontSize: isMobile ? "14px" : "16px",
                        }}
                      >
                        Cash Payment
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>Pay at the station</div>
                  </div>
                  <div
                    onClick={() => handlePaymentMethodChange("online")}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: "8px",
                      border: `2px solid ${paymentMethod === "online" ? "#3b82f6" : "#e2e8f0"}`,
                      backgroundColor: paymentMethod === "online" ? "#eff6ff" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "20px" }}>💳</span>
                      <span
                        style={{
                          fontWeight: "600",
                          color: paymentMethod === "online" ? "#1e40af" : "#0f172a",
                          fontSize: isMobile ? "14px" : "16px",
                        }}
                      >
                        Online Payment
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>Pay now with card or UPI</div>
                  </div>
                </div>
                {showStripeOptions && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                      You will be redirected to Razorpay.
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>🔒</span>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>
                        Payments processed securely by Razorpay
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleBooking}
              disabled={isBookingDisabled()}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: isBookingDisabled() ? "#94a3b8" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isBookingDisabled() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
            >
              {isProcessingPayment ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚡</span> Processing
                  Payment...
                </>
              ) : (
                <>
                  <span>⚡</span> {editMode ? "Update Booking" : "Book Your Charging Slot"}
                </>
              )}
            </button>

            {/* Messages */}
            {message && showSuccess && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #dcfce7",
                  color: "#16a34a",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>✅</div>
                <div>{message}</div>
              </div>
            )}
            {message && !showSuccess && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  backgroundColor: "#fef2f2",
                  borderRadius: "8px",
                  border: "1px solid #fee2e2",
                  color: "#dc2626",
                  textAlign: "center",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                {message}
              </div>
            )}
            <div style={{ height: isMobile ? "40px" : "60px" }}></div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  )
}
