import express from "express";
import { sendAnnouncement } from "../Controllers/announcementController.js";
import { authenticateUser, requireAdmin } from "../Middleware/auth.js";

const router = express.Router();

// Send announcement to users (Admin only)
router.post("/send", authenticateUser, requireAdmin, sendAnnouncement);

export default router;
