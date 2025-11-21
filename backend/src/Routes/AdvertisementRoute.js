import express from "express";
import {
  createAdvertisement,
  getAdvertisements,
  getPendingAdvertisements,
  approveAdvertisement,
  rejectAdvertisement,
  getApprovedAdvertisements,
  getRejectedAdvertisements,
  getProviderAdvertisements,
  getPublishedAdvertisements,
  deleteAdvertisement, // Add new import
  upload,
} from "../Controllers/AdvertisementController.js";
import {
  authenticateUser,
  requireServiceProvider,
} from "../Middleware/auth.js";

const router = express.Router();

// Upload an ad (multipart/form-data) - requires authentication and service provider role
router.post(
  "/",
  authenticateUser,
  requireServiceProvider,
  upload.single("image"),
  createAdvertisement
);

// Get ads by provider - requires authentication and service provider role
router.get(
  "/by-provider",
  authenticateUser,
  requireServiceProvider,
  getProviderAdvertisements
);

// Other routes (admin only)
router.get("/", getAdvertisements);
router.get("/pending", getPendingAdvertisements);
router.get("/approved", getApprovedAdvertisements);
router.get("/rejected", getRejectedAdvertisements);
router.get("/published", getPublishedAdvertisements);
router.put("/:id/approve", approveAdvertisement);
router.put("/:id/reject", rejectAdvertisement);
router.delete("/:id", deleteAdvertisement); // Add delete route

export default router;
