// Routes/paymentRoutes.js
import express from "express";
import { requireAuth } from "../Middleware/auth.js";
import {
  createPayment,
  createAppointmentPayment,
  createAdvertisementPayment,
  updatePaymentStatus,
  getPayment,
  getAllPayments,
  createDemoPayment,
} from "../Controllers/paymentController.js";

const router = express.Router();

// ------------------------
// Regular Payment Routes
// ------------------------

// Create a payment
router.post("/", createPayment);

// Create an appointment payment
router.post("/appointment", createAppointmentPayment);

// Create an advertisement payment
router.post("/advertisement", createAdvertisementPayment);

// Update payment status
router.put("/:paymentID", updatePaymentStatus);

// Get payment by ID
router.get("/:paymentID", getPayment);

// Get all payments (Admin only)
router.get("/admin/all", requireAuth, getAllPayments);

// ------------------------
// Demo Payment Route
// ------------------------

// Simulates a payment (80% success rate)
router.post("/demo/pay", async (req, res) => {
  console.log("💳 /demo/pay called with body:", req.body);
  try {
    // For demo purposes, we'll use the createDemoPayment controller
    await createDemoPayment(req, res);
  } catch (error) {
    console.error("Error in demo payment route:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
