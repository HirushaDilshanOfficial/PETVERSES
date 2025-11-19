import { verifyIdToken } from "../Config/firebase.js";
import User from "../Models/User.js";

// Middleware to authenticate user using Firebase ID token
export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          'No token provided or invalid format. Please provide token as "Bearer <token>"',
      });
    }

    // Extract token
    const idToken = authHeader.split(" ")[1];

    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(idToken);

    // Find user in database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    // Check if service provider is verified (only service providers need verification)
    if (user.role === "serviceProvider") {
      if (user.verification?.isRejected) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been rejected. Please contact support@petverse.com for assistance.",
        });
      }

      if (!user.verification?.isVerified) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is not verified. Please contact support@petverse.com for verification.",
        });
      }
    }

    // Attach user info to request object
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      role: user.role,
      userId: user._id,
      isVerified:
        user.role === "serviceProvider" ? user.verification.isVerified : true,
      userData: user,
    };

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    // Handle specific Firebase Auth errors
    if (error.message.includes("expired")) {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    if (error.message.includes("Invalid")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// Middleware to require admin role
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin requirement error:", error);
    return res.status(500).json({
      success: false,
      message: "Admin requirement check failed",
      error: error.message,
    });
  }
};

// Middleware to authorize roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return res.status(500).json({
        success: false,
        message: "Role authorization check failed",
        error: error.message,
      });
    }
  };
};

// Convenience middleware for requiring pet owner role
export const requirePetOwner = authorizeRoles("petOwner");

// Convenience middleware for requiring service provider role
export const requireServiceProvider = authorizeRoles("serviceProvider");

// Convenience middleware - alias for authenticateUser
export const requireAuth = authenticateUser;

// Middleware to ensure user can only access their own resources
export const requireResourceOwnership = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Allow admins to access any resource
    if (req.user.role === "admin") {
      return next();
    }

    // For other users, check if they're accessing their own resource
    const resourceUserId = req.params.userId || req.body.userId;

    if (resourceUserId && resourceUserId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own resources",
      });
    }

    next();
  } catch (error) {
    console.error("Resource ownership error:", error);
    return res.status(500).json({
      success: false,
      message: "Resource ownership check failed",
      error: error.message,
    });
  }
};

// Middleware to allow service providers to upload documents before verification
export const allowUnverifiedServiceProviderDocuments = async (
  req,
  res,
  next
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          'No token provided or invalid format. Please provide token as "Bearer <token>"',
      });
    }

    // Extract token
    const idToken = authHeader.split(" ")[1];

    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(idToken);

    // Find user in database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    // For service providers, allow access even if not verified
    // This is specifically for document upload before verification
    if (user.role === "serviceProvider") {
      // Attach user info to request object
      req.user = {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        role: user.role,
        userId: user._id,
        isVerified: user.verification?.isVerified || false,
        userData: user,
      };

      // Update last login
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

      return next();
    }

    // For non-service providers, deny access to this endpoint
    // This endpoint is only for service providers
    return res.status(403).json({
      success: false,
      message: "Access denied. This endpoint is only for service providers.",
    });
  } catch (error) {
    console.error("Authentication error:", error);

    // Handle specific Firebase Auth errors
    if (error.message.includes("expired")) {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    if (error.message.includes("Invalid")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};
