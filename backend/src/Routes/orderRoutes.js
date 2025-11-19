// Routes/orderRoutes.js
import express from "express";
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrder,
  getAllOrders,
} from "../Controllers/orderController.js";
import { requireAuth } from "../Middleware/auth.js";

const router = express.Router();


// Create order (checkout)
router.post("/", requireAuth, createOrder);

// Get order by ID
router.get("/:id", requireAuth, getOrderById);

// Update order
router.put("/:id", requireAuth, updateOrder);

// Get logged-in user's orders
router.get("/", requireAuth, getUserOrders);

// Get all orders (Admin only)
router.get("/admin/all", requireAuth, getAllOrders);


export default router;