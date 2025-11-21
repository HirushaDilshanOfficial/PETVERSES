import express from "express";
import {
  registerUser,
  uploadServiceProviderDocuments,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  verifyServiceProvider,
  getUserById,
  uploadProfilePicture,
  toggleUserStatus,
  deleteUser,
  updateUserDetails,
} from "../Controllers/authController.js";
import {
  authenticateUser,
  requireAdmin,
  requireResourceOwnership,
  allowUnverifiedServiceProviderDocuments,
} from "../Middleware/auth.js";
import {
  uploadServiceProviderDocs,
  uploadProfilePicture as uploadProfilePic,
  handleMulterError,
} from "../Middleware/fileUpload.js";

const router = express.Router();

// Public routes (no authentication required)

// Register new user (Pet Owner or Service Provider)
router.post("/register", registerUser);

// Protected routes (authentication required)

// Get current user profile (this will be the /me endpoint)
router.get("/me", authenticateUser, getUserProfile);

// Get current user profile (alternative endpoint)
router.get("/profile", authenticateUser, getUserProfile);

// Update current user profile
router.put("/profile", authenticateUser, updateUserProfile);

// Upload profile picture
router.post(
  "/profile/picture",
  authenticateUser,
  uploadProfilePic,
  handleMulterError,
  uploadProfilePicture
);

// Service Provider specific routes

// Upload Service Provider documents
router.post(
  "/service-provider/:userId/documents",
  allowUnverifiedServiceProviderDocuments,
  requireResourceOwnership,
  uploadServiceProviderDocs,
  handleMulterError,
  uploadServiceProviderDocuments
);

// Admin only routes

// Get all users (with filtering and pagination)
router.get("/users", authenticateUser, requireAdmin, getAllUsers);

// Get specific user by ID
router.get("/users/:userId", authenticateUser, requireAdmin, getUserById);

// Verify/reject service provider
router.put(
  "/users/:userId/verify",
  authenticateUser,
  requireAdmin,
  verifyServiceProvider
);

// Toggle user active/inactive status
router.put(
  "/users/:userId/status",
  authenticateUser,
  requireAdmin,
  toggleUserStatus
);

// Update user details
router.put(
  "/users/:userId/details",
  authenticateUser,
  requireAdmin,
  updateUserDetails
);

// Delete user
router.delete("/users/:userId", authenticateUser, requireAdmin, deleteUser);

// User management routes

// Get user profile by ID (admin or own profile)
router.get(
  "/users/:userId/profile",
  authenticateUser,
  (req, res, next) => {
    // Allow users to view their own profile or admin to view any profile
    if (
      req.user.role === "admin" ||
      req.params.userId === req.user.userId.toString()
    ) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  },
  getUserById
);

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
