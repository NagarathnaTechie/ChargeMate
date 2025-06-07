import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Auth from "../frontend/Auth.jsx"
import Home from '../frontend/Home.jsx'
import Recommendations from "../frontend/Recommendations.jsx";
import Booking from "../frontend/Booking.jsx";
import MyBookings from "../frontend/MyBookings.jsx";
import Profile from "../frontend/Profile.jsx";
import Notifications from "../frontend/Notification.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/bookings" element={<Booking />} />
        <Route path="/mybookings" element={<MyBookings />} />
        <Route path="/notification" element={<Notifications />} />
        <Route path="/profile" element={<Profile user="sharatrk59@gmail.com" />} />
      </Routes>
    </Router>
  );
}

export default App;