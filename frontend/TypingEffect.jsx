"use client"

import { useEffect, useState } from "react"

const TypingEffect = ({ text, delay = 100 }) => {
  const [currentText, setCurrentText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isBlinking, setIsBlinking] = useState(true)

  useEffect(() => {
    // Reset when text changes
    setCurrentText("")
    setCurrentIndex(0)
  }, [text])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex])
        setCurrentIndex((prevIndex) => prevIndex + 1)
      }, delay)

      return () => clearTimeout(timeout)
    } else {
      // Start blinking cursor effect after typing is complete
      const blinkInterval = setInterval(() => {
        setIsBlinking((prev) => !prev)
      }, 500)

      return () => clearInterval(blinkInterval)
    }
  }, [currentIndex, delay, text])

  // EV charging-themed colors
  const primaryColor = "#10b981" // Green for eco-friendly
  const secondaryColor = "#3b82f6" // Blue for electricity
  const accentColor = "#f59e0b" // Amber for energy

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: "8px 16px",
        borderRadius: "8px",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        overflow: "hidden",
      }}
    >
      {/* Energy pulse animation */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: `${(currentIndex / text.length) * 100}%`,
          background: `linear-gradient(90deg, 
          rgba(16, 185, 129, 0.1), 
          rgba(59, 130, 246, 0.1)
        )`,
          transition: "width 0.2s ease-out",
          zIndex: 0,
        }}
      />

      {/* Lightning bolt icon */}
      <span
        style={{
          marginRight: "8px",
          color: currentIndex < text.length ? primaryColor : accentColor,
          fontSize: "1.1em",
          verticalAlign: "middle",
          display: "inline-block",
          animation: "pulse 1.5s infinite ease-in-out",
        }}
      >
        ⚡
      </span>

      {/* Text content */}
      <span
        style={{
          position: "relative",
          fontWeight: "500",
          color: "#1e293b",
          zIndex: 1,
          background: `linear-gradient(90deg, 
          ${primaryColor}, 
          ${secondaryColor}
        )`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: "inline-block",
        }}
      >
        {currentText}

        
      </span>

      {/* Battery indicator */}
      {currentIndex === text.length && (
        <span
          style={{
            marginLeft: "10px",
            fontSize: "0.9em",
            color: primaryColor,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "20px",
              height: "10px",
              borderRadius: "2px",
              border: `1px solid ${primaryColor}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: "100%",
                backgroundColor: primaryColor,
                animation: "battery-charge 2s infinite linear",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: "-3px",
                top: "2px",
                height: "6px",
                width: "2px",
                backgroundColor: primaryColor,
                borderRadius: "1px",
              }}
            />
          </span>
          <span style={{ fontSize: "0.8em" }}>100%</span>
        </span>
      )}

      <style>
        {`
          @keyframes typing-cursor {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes battery-charge {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}
      </style>
    </div>
  )
}

export default TypingEffect

