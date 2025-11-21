// RatingsRoute.js
import express from "express";
import multer from "multer";
import {
  createRating,
  getRatings,
  updateRating,
  deleteRating,
} from "../Controllers/RatingsController.js";
import { authenticateUser } from "../Middleware/auth.js";

const router = express.Router();
// Multer config for handling image uploads; stored temporarily on disk
const upload = multer({ dest: "tmp/" });

// Routes
router.post("/", authenticateUser, upload.single("image"), createRating); // Create feedback (supports image)
router.get("/", getRatings); // Get all feedbacks or filter by ?productID / ?serviceID
router.put("/:id", authenticateUser, upload.single("image"), updateRating); // Update feedback by ID (supports image)
router.delete("/:id", authenticateUser, deleteRating); // Delete feedback by ID

export default router;
