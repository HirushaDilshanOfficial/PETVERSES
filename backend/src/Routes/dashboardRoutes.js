import express from "express";
import {
  getDashboardStats,
  getServiceProviderAnalytics,
} from "../Controllers/dashboardController.js";
import { authenticateUser, requireAdmin } from "../Middleware/auth.js";

const router = express.Router();

// Get dashboard statistics (Admin only)
router.get("/stats", authenticateUser, requireAdmin, getDashboardStats);

// Get service provider analytics (Service Provider only)
router.get(
  "/provider-analytics",
  authenticateUser,
  getServiceProviderAnalytics
);

export default router;
