"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import TypingEffect from "./TypingEffect"
import "./Auth.css"

const Auth = () => {
  console.log("Auth component rendered");
  const [isSignup, setIsSignup] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/home"

  useEffect(() => {
    console.log("Auth useEffect: isSignup =", isSignup);
    setFullName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }, [isSignup])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSignup && password !== confirmPassword) {
      toast.error("Passwords do not match!")
      return
    }

    try {
      const url = isSignup ? "http://localhost:5000/api/signup" : "http://localhost:5000/api/login"
      const data = isSignup ? { fullName, email, password } : { email, password }
      const response = await axios.post(url, data)

      if (!isSignup) {
        const { token, userId, fullName, email } = response.data
        console.log("Login successful, email:", email)

        localStorage.setItem("token", token)
        localStorage.setItem("userId", userId)
        localStorage.setItem("userEmail", email)
        localStorage.setItem("userName", fullName)

        toast.success("Login successful!")
        setTimeout(() => navigate(from), 1000)
      } else {
        toast.success("Signup successful!")
        setTimeout(() => navigate("/"), 1000)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error;
      if (!isSignup) {
        // Login-specific error handling
        if (errorMessage === "Invalid email ID") {
          toast.error("Invalid email ID");
        } else if (errorMessage === "Invalid credentials") {
          toast.error("Invalid credentials");
        } else if (errorMessage === "Email and password are required") {
          toast.error("Email and password are required");
        } else {
          toast.error("Server error, please try again later");
        }
      } else {
        // Signup error handling
        toast.error(errorMessage || "Something went wrong!");
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="left-side">
        <h1 className="title">
          <TypingEffect text="CHARGE MATE" />
        </h1>
        <h2 className="subtitle">
          <TypingEffect text="Smart EV charging and Navigation hub" delay={50} />
        </h2>
      </div>
      <div className="right-side">
        <div className="form-container">
          <h2 className="form-title">{isSignup ? "Sign Up" : "Login"}</h2>
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className="input-group">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div className="input-group">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️" : "👁️"}
              </span>
            </div>
            {isSignup && (
              <div className="input-group">
                <input
                  type="password"
                  required
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            <button type="submit" className="submit-btn">
              {isSignup ? "Sign Up" : "Login"}
            </button>
          </form>
          <div className="switch-mode">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <span onClick={() => setIsSignup(!isSignup)}>{isSignup ? "Login" : "Sign Up"}</span>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default Auth