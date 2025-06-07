import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
import process from "process"
dotenv.config();

// Configure nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173";

// Send confirmation email with detailed booking info
export const sendConfirmationEmail = async (to, subject, booking) => {
  try {
    // Validate booking.vehicle
    const vehicle = booking.vehicle || {};
    const vehicleName = vehicle.name || "Unknown Vehicle";
    const vehicleNumber = vehicle.number || "N/A";
    const connectorType = vehicle.connectorType || "N/A";

    console.log("Sending confirmation email with booking:", JSON.stringify(booking, null, 2));
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Your Station Booking is Confirmed!</h2>
        <p>Dear ${booking.customerName || "Customer"},</p>
        <p>Your booking at <strong>${booking.station?.StationTitle || "Unknown Station"}</strong> has been successfully confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Station</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.station?.StationTitle || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Date</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.bookingDate || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Time</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.bookingTime || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Vehicle</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${vehicleName} (${vehicleNumber})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Connector Type</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${connectorType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Payment Method</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.paymentMethod || "N/A"}</td>
          </tr>
        </table>
        <p>Thank you for choosing ChargeMate! You’ll receive a reminder 10 minutes before your session.</p>
        <p style="color: #64748b; iont-size: 12px;">If you need to cancel or modify your booking, visit <a href="${BASE_URL}/mybookings">My Bookings</a>.</p>
      </div>
    `;
    await transporter.sendMail({
      from: `"ChargeMate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log("Confirmation email sent to:", to);
  } catch (err) {
    console.error("Error sending confirmation email:", err);
    throw err;
  }
};

// Send cancellation email with detailed booking info
export const sendCancellationEmail = async (to, subject, booking) => {
  try {
    // Validate booking.vehicle
    const vehicle = booking.vehicle || {};
    const vehicleName = vehicle.name || "Unknown Vehicle";
    const vehicleNumber = vehicle.number || "N/A";
    const connectorType = vehicle.connectorType || "N/A";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">Your Station Booking is Cancelled!</h2>
        <p>Dear ${booking.customerName || "Customer"},</p>
        <p>Your booking at <strong>${booking.station?.StationTitle || "Unknown Station"}</strong> has been cancelled. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Station</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.station?.StationTitle || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Date</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.bookingDate || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Time</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.bookingTime || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Vehicle</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${vehicleName} (${vehicleNumber})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Connector Type</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${connectorType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Payment Method</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.paymentMethod || "N/A"}</td>
          </tr>
        </table>
        <p>We’re sorry to see your booking cancelled. Book again anytime at <a href="${BASE_URL}/bookings">ChargeMate</a>.</p>
        <p style="color: #64748b; font-size: 12px;">If this was a mistake, please contact support at support@chargemate.com.</p>
      </div>
    `;
    await transporter.sendMail({
      from: `"ChargeMate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log("Cancellation email sent to:", to);
  } catch (err) {
    console.error("Error sending cancellation email:", err);
    throw err;
  }
};

// Schedule reminder email 10 minutes before booking
export const scheduleReminderEmail = (to, subject, text, bookingDate, bookingTime) => {
  try {
    // Validate and parse booking date/time
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    if (isNaN(bookingDateTime.getTime())) {
      console.error("Invalid booking date/time:", { bookingDate, bookingTime });
      throw new Error("Invalid booking date or time");
    }

    const reminderTime = new Date(bookingDateTime.getTime() - 10 * 60 * 1000); // 10 minutes before
    if (reminderTime < new Date()) {
      console.warn("Reminder time is in the past:", reminderTime);
      return; // Skip scheduling if reminder time has passed
    }

    const cronTime = `${reminderTime.getMinutes()} ${reminderTime.getHours()} ${reminderTime.getDate()} ${reminderTime.getMonth() + 1} *`;
    console.log("Scheduling reminder email for:", to, "at cronTime:", cronTime, "bookingDateTime:", bookingDateTime);

    cron.schedule(cronTime, async () => {
      console.log("Cron job triggered for reminder email to:", to, "at:", new Date());
      try {
        await transporter.sendMail({
          from: `"ChargeMate" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #3b82f6;">Booking Reminder</h2>
              <p>Dear Customer,</p>
              <p>${text}</p>
              <p>Your charging session is starting in 10 minutes. Please arrive on time.</p>
              <p style="color: #64748b; font-size: 12px;">View your booking at <a href="${BASE_URL}/mybookings">My Bookings</a>.</p>
            </div>
          `,
        });
        console.log("Reminder email successfully sent to:", to);
      } catch (err) {
        console.error("Error sending reminder email to:", to, "Error:", err);
      }
    }, {
      timezone: "UTC" // Ensure cron uses UTC to avoid timezone issues
    });
  } catch (err) {
    console.error("Error scheduling reminder email:", err);
  }
};