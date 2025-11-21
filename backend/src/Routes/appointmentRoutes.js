import express from "express";
import {
  createAppointment,
  getAppointments,
  getProviderAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "../Controllers/appointmentController.js";
import {
  sendAppointmentApprovalEmail,
  sendAppointmentRejectionEmail,
} from "../Utils/emailService.js";
import { authenticateUser } from "../Middleware/auth.js"; // Import authentication middleware

import Appointment from "../Models/Appointment.js"; // <-- make sure path is correct

const router = express.Router();

// Create a new appointment (requires authentication)
router.post("/", authenticateUser, createAppointment);

// Get all appointments
router.get("/", getAppointments);

// Get appointments for service provider (requires authentication)
router.get("/provider", authenticateUser, getProviderAppointments);

// Get appointments by Owner ID (for PetOwnerProfile.jsx)
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      user_id: req.params.ownerId,
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single appointment by ID
router.get("/:id", getAppointmentById);

// Update appointment by ID
router.put("/:id", updateAppointment);

// Test email endpoint (for development only)
router.post("/test-email", async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const testAppointment = {
      pet_name: "Buddy",
      package: "Premium",
      date: new Date(),
      time: "10:00 AM",
      pet_type: "Dog",
      pet_breed: "Golden Retriever",
      note: "Test appointment for email verification",
    };

    if (type === "approval") {
      await sendAppointmentApprovalEmail(email, testAppointment);
      res.json({ message: "Approval email sent successfully" });
    } else if (type === "rejection") {
      await sendAppointmentRejectionEmail(
        email,
        testAppointment,
        "Test rejection reason"
      );
      res.json({ message: "Rejection email sent successfully" });
    } else {
      res
        .status(400)
        .json({ message: "Type must be 'approval' or 'rejection'" });
    }
  } catch (error) {
    console.error("Test email error:", error);
    res
      .status(500)
      .json({ message: "Failed to send test email", error: error.message });
  }
});

// Delete appointment by ID
router.delete("/:id", deleteAppointment);

export default router;
