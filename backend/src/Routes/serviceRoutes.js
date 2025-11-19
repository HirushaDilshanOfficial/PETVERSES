import express from "express";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getMyServices,
} from "../Controllers/serviceController.js";
import upload from "../Middleware/upload.js"; // ✅ use memory storage
import { authenticateUser } from "../Middleware/auth.js"; // Import auth middleware

// Create router
const router = express.Router();

// Simple CRUD routes
router.get("/", getAllServices); // GET all services
router.get("/my-services", authenticateUser, getMyServices); // GET services for logged-in user
router.get("/:id", getServiceById); // GET one service by ID
router.post("/", authenticateUser, upload.array("images", 3), createService); // CREATE new service with Cloudinary uploads
router.put("/:id", authenticateUser, updateService); // UPDATE service by ID
router.delete("/:id", authenticateUser, deleteService); // DELETE service by ID

export default router;
