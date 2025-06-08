"use client"
import PropTypes from "prop-types"
import { useState } from "react"

export default function CountryDropdown({ onSelectCountry }) {
  const [searchTerm, setSearchTerm] = useState("")

  const countries = [
    "Australia",
    "Brazil",
    "Egypt",
    "India",
    "Indonesia",
    "Ireland",
    "Italy",
    "Portugal",
    "Russia",
    "Spain",
    "Sweden",
    "Tunisia",
    "Turkey",
    "Ukraine",
    "United Kingdom",
    "United States",
  ]

  const countryCodeMap = {
    Australia: "AU",
    Brazil: "BR",
    Egypt: "EG",
    India: "IN",
    Indonesia: "ID",
    Ireland: "IE",
    Italy: "IT",
    Portugal: "PT",
    Russia: "RU",
    Spain: "ES",
    Sweden: "SE",
    Tunisia: "TN",
    Turkey: "TR",
    Ukraine: "UA",
    "United Kingdom": "GB",
    "United States": "US",
  }

  const filteredCountries = countries.filter((country) => country.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div
      style={{
        position: "absolute",
        top: "70px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "800px",
        zIndex: 1001,
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
        maxHeight: "70vh",
        overflowY: "auto",
        padding: "16px",
        border: "none",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f5f7fa",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "15px",
          }}
        >
          <span style={{ marginRight: "8px", color: "#6c757d" }}>⚡</span>
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              width: "100%",
              outline: "none",
              fontSize: "14px",
            }}
          />
          {searchTerm && (
            <span style={{ cursor: "pointer", color: "#6c757d" }} onClick={() => setSearchTerm("")}>
              ✕
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "8px",
        }}
      >
        {filteredCountries.length > 0 ? (
          filteredCountries.map((country, index) => (
            <div
              key={index}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                backgroundColor: "#f9fafb",
                fontstyle: "bold",
                color: "black",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
              }}
              onClick={() => onSelectCountry(country)}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f4f8")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
            >
              <img height={16} src={`https://flagsapi.com/${countryCodeMap[country]}/flat/64.png`} />
              <span style={{ fontSize: "13px" }}>{country}</span>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px", color: "#6c757d" }}>
            No countries found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  )
}

CountryDropdown.propTypes = {
  onSelectCountry: PropTypes.func.isRequired,
}
