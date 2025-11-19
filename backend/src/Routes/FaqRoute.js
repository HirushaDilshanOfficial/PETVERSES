// Routes/faqRoutes.js
import express from "express";
import {
  addFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
} from "../Controllers/FaqController.js";
// import { requireAdmin } from "../Middleware/auth.js"; // optional

console.log("FAQ routes file loaded");

const router = express.Router();

router.post("/", /* requireAdmin, */ addFaq);
router.get("/", getFaqs);
router.put("/:id", /* requireAdmin, */ updateFaq);
router.delete("/:id", /* requireAdmin, */ deleteFaq);

console.log("FAQ routes defined");

export default router;
