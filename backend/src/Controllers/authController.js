import User from "../Models/User.js";
import { verifyIdToken, setCustomUserClaims } from "../Config/firebase.js";
import {
  uploadNICDocuments,
  uploadFacePhoto,
  uploadBusinessDocuments,
  uploadUserDocument,
} from "../Config/cloudinary.js";
import {
  sendKYCApprovalEmail,
  sendKYCRejectionEmail,
} from "../Utils/emailService.js";

// Register a new user (Pet Owner or Service Provider)
export const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      role,
      address,
      nicNumber,
      firebaseUid,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !role || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate role
    const validRoles = ["petOwner", "serviceProvider", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be petOwner, serviceProvider, or admin",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email }, { firebaseUid: firebaseUid }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or Firebase UID",
      });
    }

    // Validate Service Provider specific fields
    if (role === "serviceProvider") {
      console.log("Validating service provider fields:", {
        address,
        nicNumber,
      });
      if (!address || !nicNumber) {
        return res.status(400).json({
          success: false,
          message: "Address and NIC number are required for service providers",
        });
      }

      // Check if NIC number already exists
      const existingNIC = await User.findOne({ nicNumber: nicNumber });
      if (existingNIC) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this NIC number",
        });
      }
    }

    // Create user data object
    const userData = {
      fullName,
      email,
      phoneNumber,
      firebaseUid,
      role,
      ...(role === "serviceProvider" && { address, nicNumber }),
    };

    console.log("Creating user with data:", userData);

    // Create new user
    const newUser = await User.createUser(userData);

    console.log("User created successfully:", newUser._id);

    // Try to set custom claims in Firebase for role-based access
    try {
      await setCustomUserClaims(firebaseUid, {
        role: role,
        userId: newUser._id.toString(),
      });
      console.log("Firebase custom claims set successfully");
    } catch (firebaseError) {
      console.log(
        "Warning: Could not set Firebase custom claims:",
        firebaseError.message
      );
      // Continue without failing the registration
    }

    // Remove sensitive information from response
    const userResponse = newUser.toJSON();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Upload documents for Service Provider
export const uploadServiceProviderDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const files = req.files;

    console.log("📤 Starting document upload for user:", userId);
    console.log("📁 Received files:", Object.keys(files || {}));

    // Log file details for debugging
    if (files) {
      Object.entries(files).forEach(([key, fileArray]) => {
        console.log(
          `📄 ${key}:`,
          fileArray.map((f) => ({
            name: f.originalname,
            size: f.size,
            type: f.mimetype,
          }))
        );
      });
    }

    // Validate user exists and is a service provider
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "serviceProvider") {
      return res.status(403).json({
        success: false,
        message: "Only service providers can upload documents",
      });
    }

    // Validate required files
    if (!files || !files.nicFront || !files.nicBack || !files.facePhoto) {
      console.log("❌ Missing required files:", {
        nicFront: !!files?.nicFront,
        nicBack: !!files?.nicBack,
        facePhoto: !!files?.facePhoto,
      });
      return res.status(400).json({
        success: false,
        message: "NIC front, NIC back, and face photo are required",
      });
    }

    console.log("☁️ Uploading documents to Cloudinary...");

    // Upload NIC documents
    console.log("📸 Uploading NIC documents...");
    const nicDocuments = await uploadNICDocuments(
      files.nicFront[0],
      files.nicBack[0],
      userId
    );
    console.log("✅ NIC documents uploaded:", {
      front: nicDocuments.nicFront.url,
      back: nicDocuments.nicBack.url,
    });

    // Upload face photo
    console.log("📸 Uploading face photo...");
    const facePhoto = await uploadFacePhoto(files.facePhoto[0], userId);
    console.log("✅ Face photo uploaded:", facePhoto.url);

    // Upload business documents (if provided)
    let businessDocuments = [];
    if (files.businessDocuments && files.businessDocuments.length > 0) {
      console.log(
        `📄 Uploading ${files.businessDocuments.length} business documents...`
      );
      const businessUploadResults = await uploadBusinessDocuments(
        files.businessDocuments,
        userId
      );

      businessDocuments = businessUploadResults.map((result, index) => ({
        fileName: files.businessDocuments[index].originalname,
        fileUrl: result.url,
        uploadDate: new Date(),
      }));
      console.log(
        "✅ Business documents uploaded:",
        businessDocuments.map((d) => d.fileName)
      );
    }

    console.log("💾 Updating user document URLs in database...");
    // Update user with document URLs
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        documents: {
          nicFrontPhoto: nicDocuments.nicFront.url,
          nicBackPhoto: nicDocuments.nicBack.url,
          facePhoto: facePhoto.url,
          businessDocuments: businessDocuments,
        },
      },
      { new: true }
    );

    console.log("🎉 Document upload completed successfully for user:", userId);

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      user: updatedUser.toJSON(),
      uploadedFiles: {
        nicFrontPhoto: nicDocuments.nicFront.url,
        nicBackPhoto: nicDocuments.nicBack.url,
        facePhoto: facePhoto.url,
        businessDocuments: businessDocuments,
      },
    });
  } catch (error) {
    console.error("❌ Error in uploadServiceProviderDocuments:", error);
    res.status(500).json({
      success: false,
      message: "Document upload failed",
      error: error.message,
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { firebaseUid } = req.user; // Set by auth middleware

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { firebaseUid } = req.user;
    const { fullName, phoneNumber, address } = req.body;

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address && user.role === "serviceProvider")
      updateData.address = address;

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { role, verified, page = 1, limit = 10, search } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;

    // For service providers, handle verification filtering
    if (role === "serviceProvider") {
      if (verified !== undefined) {
        if (verified === "true") {
          // Only verified providers
          filter["verification.isVerified"] = true;
          filter["verification.isRejected"] = false;
        } else if (verified === "false") {
          // Only unverified providers (not rejected)
          filter["verification.isVerified"] = false;
          filter["verification.isRejected"] = false;
        }
        // When verified is not specified, we show all providers including rejected ones
      }
      // When no verification filter is specified, we want to see all providers
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("verification.verifiedBy", "fullName email");

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users: users.map((user) => user.toJSON()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Admin: Verify service provider
export const verifyServiceProvider = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified, rejectionReason } = req.body;
    const { firebaseUid: adminUid } = req.user;

    // Find admin user
    const admin = await User.findOne({ firebaseUid: adminUid });
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can verify service providers",
      });
    }

    // Find service provider
    const serviceProvider = await User.findById(userId);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Service provider not found",
      });
    }

    if (serviceProvider.role !== "serviceProvider") {
      return res.status(400).json({
        success: false,
        message: "User is not a service provider",
      });
    }

    // Store original verification status for email notification
    const wasVerified = serviceProvider.verification?.isVerified;
    const wasRejected = serviceProvider.verification?.isRejected;

    // Update verification status
    const verificationData = {
      "verification.verifiedBy": admin._id,
    };

    if (isVerified) {
      // For approval
      verificationData["verification.isVerified"] = true;
      verificationData["verification.isRejected"] = false;
      verificationData["verification.verifiedAt"] = new Date();
      verificationData["verification.rejectionReason"] = undefined;
    } else {
      // For rejection
      verificationData["verification.isVerified"] = false;
      verificationData["verification.isRejected"] = true;
      verificationData["verification.rejectionReason"] =
        rejectionReason || "Not specified";
      verificationData["verification.verifiedAt"] = undefined;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, verificationData, {
      new: true,
    }).populate("verification.verifiedBy", "fullName email");

    // Update Firebase custom claims
    await setCustomUserClaims(serviceProvider.firebaseUid, {
      role: "serviceProvider",
      userId: serviceProvider._id.toString(),
      isVerified: isVerified, // This will be false for rejected providers
    });

    // Send email notification based on action
    if (isVerified && !wasVerified) {
      // Send approval email only if it was not already approved
      await sendKYCApprovalEmail(updatedUser.email, updatedUser.fullName);
    } else if (!isVerified && !wasRejected) {
      // Send rejection email only if it was not already rejected
      await sendKYCRejectionEmail(
        updatedUser.email,
        updatedUser.fullName,
        rejectionReason || "Not specified"
      );
    }

    res.status(200).json({
      success: true,
      message: `Service provider ${
        isVerified ? "verified" : "rejected"
      } successfully`,
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error("Error in verifyServiceProvider:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user by ID (for admin use)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate(
      "verification.verifiedBy",
      "fullName email"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const { firebaseUid } = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Profile picture file is required",
      });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadUserDocument(
      file,
      user._id,
      "profile-pictures"
    );

    // Update user profile picture
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { profilePicture: uploadResult.url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error);
    res.status(500).json({
      success: false,
      message: "Profile picture upload failed",
      error: error.message,
    });
  }
};

// Simple toggle user active/inactive status
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Find user and update status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: isActive },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error("Error in toggleUserStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

// Simple delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      deletedUser: {
        _id: deletedUser._id,
        fullName: deletedUser.fullName,
        email: deletedUser.email,
      },
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Simple update user details
export const updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, phoneNumber, address, nicNumber } = req.body;

    // Build update object
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;
    if (nicNumber) updateData.nicNumber = nicNumber;

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error("Error in updateUserDetails:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};
