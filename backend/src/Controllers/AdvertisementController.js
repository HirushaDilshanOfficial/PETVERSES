// Enhanced Advertisement Controller - FIXED VERSION

import Advertisement from "../Models/AdvertisementModel.js";
import User from "../Models/User.js";
import cloudinary from "../Config/cloudinary.js";
import multer from "multer";
import mongoose from "mongoose";

// Use multer memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Helper function to get service provider details - IMPROVED
const getServiceProviderDetails = async (providerId) => {
  try {
    console.log("=== Debug Provider Details ===");
    console.log("Looking for provider with ID:", providerId);

    // Handle case where providerId might be null/undefined
    if (!providerId) {
      console.warn("No provider ID provided");
      return {
        _id: null,
        fullName: "Unknown Provider",
        email: "N/A",
        phoneNumber: "N/A",
      };
    }

    // Convert to ObjectId if it's a string and valid
    let objectId;
    if (
      typeof providerId === "string" &&
      mongoose.Types.ObjectId.isValid(providerId)
    ) {
      objectId = new mongoose.Types.ObjectId(providerId);
    } else if (providerId instanceof mongoose.Types.ObjectId) {
      objectId = providerId;
    } else {
      console.warn("Invalid provider ID format:", providerId);
      return {
        _id: providerId,
        fullName: "Unknown Provider",
        email: "N/A",
        phoneNumber: "N/A",
      };
    }

    // Get the user's full details we need
    const user = await User.findById(objectId).select(
      "fullName email phoneNumber"
    );
    console.log("Found user:", user);

    if (!user) {
      console.warn("No user found for ID:", providerId);
      return {
        _id: providerId,
        fullName: "Unknown Provider",
        email: "N/A",
        phoneNumber: "N/A",
      };
    }

    return {
      _id: user._id,
      fullName: user.fullName || "Unknown Provider",
      email: user.email || "N/A",
      phoneNumber: user.phoneNumber || "N/A",
    };
  } catch (error) {
    console.error("Error in getServiceProviderDetails:", error);
    // Return default values in case of error
    return {
      _id: providerId || null,
      fullName: "Unknown Provider",
      email: "N/A",
      phoneNumber: "N/A",
    };
  }
};

// Create a new advertisement with image upload
export const createAdvertisement = async (req, res) => {
  try {
    console.log("=== CREATE ADVERTISEMENT REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("Authenticated user:", req.user);

    let imageUrl = "";

    // If file exists, upload to Cloudinary
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "ads" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    // Validate and convert duration to number
    const duration = Number(req.body.duration);
    if (isNaN(duration) || duration <= 0) {
      console.log("Invalid duration:", req.body.duration);
      return res
        .status(400)
        .json({ message: "Duration must be a positive number" });
    }

    // Use the authenticated user's ID instead of the one sent from frontend
    const provider_ID = req.user.userId;
    console.log("Using provider ID:", provider_ID);

    const ad = new Advertisement({
      provider_ID: provider_ID,
      title: req.body.title,
      description: req.body.description,
      imageUrl,
      duration: duration,
      created_at: new Date(),
      approved_at: null,
      status: "pending",
    });

    const savedAd = await ad.save();
    console.log("Advertisement saved:", savedAd);
    res.status(201).json({ ad: savedAd });
  } catch (err) {
    console.error("Error creating advertisement:", err);
    res.status(400).json({ message: err.message });
  }
};

// Get all ads
export const getAdvertisements = async (req, res) => {
  try {
    const ads = await Advertisement.find();
    res.json(ads);
  } catch (err) {
    console.error("Error fetching advertisements:", err);
    res.status(500).json({ message: err.message });
  }
};

// Pending ads with service provider information - IMPROVED
export const getPendingAdvertisements = async (req, res) => {
  try {
    console.log("=== FETCHING PENDING ADVERTISEMENTS ===");

    const ads = await Advertisement.find({ status: "pending" })
      .sort({ created_at: -1 }) // Sort by newest first
      .lean(); // Using .lean() for better performance

    console.log("Found pending ads:", ads.length);

    if (ads.length === 0) {
      return res.json([]);
    }

    const adsWithProviderDetails = await Promise.all(
      ads.map(async (ad) => {
        const providerDetails = await getServiceProviderDetails(ad.provider_ID);

        return {
          _id: ad._id,
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          duration: ad.duration,
          status: ad.status,
          paymentStatus: ad.paymentStatus,
          created_at: ad.created_at,
          approved_at: ad.approved_at,
          rejectionReason: ad.rejectionReason,
          // Provider details as a separate object
          serviceProvider: providerDetails,
        };
      })
    );

    console.log(
      "Sending pending ads with provider details:",
      adsWithProviderDetails.length
    );
    res.json(adsWithProviderDetails);
  } catch (err) {
    console.error("Error fetching pending ads:", err);
    res.status(500).json({ message: err.message });
  }
};

// Approved ads - COMPLETELY FIXED VERSION
export const getApprovedAdvertisements = async (req, res) => {
  try {
    console.log("=== FETCHING APPROVED ADVERTISEMENTS ===");

    // Use .lean() for better performance and ensure we get plain objects
    const ads = await Advertisement.find({ status: "approved" })
      .sort({ approved_at: -1 }) // Sort by most recently approved first
      .lean();

    console.log("Found approved ads count:", ads.length);

    if (ads.length === 0) {
      console.log("No approved ads found");
      return res.json([]);
    }

    // Log the first ad to see its structure
    if (ads[0]) {
      console.log("First approved ad structure:");
      console.log("- ID:", ads[0]._id);
      console.log("- Title:", ads[0].title);
      console.log("- Status:", ads[0].status);
      console.log("- Payment Status:", ads[0].paymentStatus);
      console.log("- Created at:", ads[0].created_at);
      console.log("- Approved at:", ads[0].approved_at);
      console.log("- Provider ID:", ads[0].provider_ID);
    }

    const adsWithProviderDetails = await Promise.all(
      ads.map(async (ad, index) => {
        console.log(
          `Processing approved ad ${index + 1}/${ads.length}:`,
          ad.title
        );

        const providerDetails = await getServiceProviderDetails(ad.provider_ID);

        // Create the formatted response
        const formattedAd = {
          _id: ad._id,
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          duration: ad.duration,
          status: ad.status,
          paymentStatus: ad.paymentStatus,
          created_at: ad.created_at,
          // Ensure approved_at is properly handled
          approved_at: ad.approved_at,
          rejectionReason: ad.rejectionReason,
          // Provider details as a separate object for clarity
          serviceProvider: providerDetails,
        };

        console.log(`Formatted approved ad ${index + 1}:`, {
          id: formattedAd._id,
          title: formattedAd.title,
          approved_at: formattedAd.approved_at,
          paymentStatus: formattedAd.paymentStatus,
          serviceProvider: formattedAd.serviceProvider.fullName,
        });

        return formattedAd;
      })
    );

    console.log("=== FINAL APPROVED ADS RESPONSE ===");
    console.log("Total ads being sent:", adsWithProviderDetails.length);
    console.log("Sample approved_at values:");
    adsWithProviderDetails.slice(0, 3).forEach((ad, i) => {
      console.log(`Ad ${i + 1}: ${ad.approved_at}`);
    });

    res.json(adsWithProviderDetails);
  } catch (err) {
    console.error("Error fetching approved ads:", err);
    res.status(500).json({ message: err.message });
  }
};

// Approve ad - ENHANCED VERSION
export const approveAdvertisement = async (req, res) => {
  try {
    console.log("=== APPROVING ADVERTISEMENT ===");
    console.log("Advertisement ID:", req.params.id);

    // Validate advertisement ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid advertisement ID" });
    }

    // Find the ad first to ensure it exists
    const existingAd = await Advertisement.findById(req.params.id);
    if (!existingAd) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    if (existingAd.status === "approved") {
      return res
        .status(400)
        .json({ message: "Advertisement is already approved" });
    }

    const currentDate = new Date();
    console.log("Setting approved_at to:", currentDate.toISOString());

    const updatedAd = await Advertisement.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approved_at: currentDate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    console.log("Successfully updated advertisement:");
    console.log("- ID:", updatedAd._id);
    console.log("- Status:", updatedAd.status);
    console.log("- Approved at:", updatedAd.approved_at);

    // Get provider details for the response
    const providerDetails = await getServiceProviderDetails(
      updatedAd.provider_ID
    );

    const responseAd = {
      _id: updatedAd._id,
      title: updatedAd.title,
      description: updatedAd.description,
      imageUrl: updatedAd.imageUrl,
      duration: updatedAd.duration,
      status: updatedAd.status,
      paymentStatus: updatedAd.paymentStatus,
      created_at: updatedAd.created_at,
      approved_at: updatedAd.approved_at,
      serviceProvider: providerDetails,
    };

    res.json(responseAd);
  } catch (err) {
    console.error("Error approving advertisement:", err);
    res.status(500).json({ message: err.message });
  }
};

// Reject ad - ENHANCED VERSION
export const rejectAdvertisement = async (req, res) => {
  try {
    console.log("=== REJECTING ADVERTISEMENT ===");
    console.log("Advertisement ID:", req.params.id);

    // Validate advertisement ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid advertisement ID" });
    }

    const { reason } = req.body;

    // Validate rejection reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    // Find the ad first to ensure it exists
    const existingAd = await Advertisement.findById(req.params.id);
    if (!existingAd) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    const updatedAd = await Advertisement.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectionReason: reason.trim(),
        // Clear approved_at when rejecting
        approved_at: null,
      },
      { new: true }
    );

    console.log("Successfully rejected advertisement:", updatedAd.title);
    console.log("Rejection reason:", reason);

    // Get provider details for the response
    const providerDetails = await getServiceProviderDetails(
      updatedAd.provider_ID
    );

    const responseAd = {
      _id: updatedAd._id,
      title: updatedAd.title,
      description: updatedAd.description,
      imageUrl: updatedAd.imageUrl,
      duration: updatedAd.duration,
      status: updatedAd.status,
      paymentStatus: updatedAd.paymentStatus,
      created_at: updatedAd.created_at,
      approved_at: updatedAd.approved_at,
      rejectionReason: updatedAd.rejectionReason,
      serviceProvider: providerDetails,
    };

    res.json(responseAd);
  } catch (err) {
    console.error("Error rejecting advertisement:", err);
    res.status(500).json({ message: err.message });
  }
};

// Ads by provider - ENHANCED VERSION WITH BETTER ERROR HANDLING
export const getProviderAdvertisements = async (req, res) => {
  try {
    console.log("=== FETCHING PROVIDER ADVERTISEMENTS ===");
    console.log("Request user object:", JSON.stringify(req.user, null, 2));

    // Check if user is authenticated
    if (!req.user) {
      console.error("No user object found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if userId exists
    if (!req.user.userId) {
      console.error("No userId found in user object:", req.user);
      return res.status(401).json({ message: "User ID not found" });
    }

    // Use the authenticated user's ID instead of query parameter
    const provider_ID = req.user.userId;
    console.log("Using provider ID:", provider_ID);

    // Validate provider ID
    if (!provider_ID || !mongoose.Types.ObjectId.isValid(provider_ID)) {
      console.error("Invalid provider ID:", provider_ID);
      return res.status(400).json({ message: "Valid provider ID is required" });
    }

    const ads = await Advertisement.find({ provider_ID })
      .sort({ created_at: -1 })
      .lean();

    console.log("Found advertisements:", ads.length);

    // Add provider details to each ad
    const adsWithDetails = await Promise.all(
      ads.map(async (ad) => {
        try {
          const providerDetails = await getServiceProviderDetails(
            ad.provider_ID
          );
          return {
            ...ad,
            serviceProvider: providerDetails,
          };
        } catch (providerError) {
          console.error(
            "Error fetching provider details for ad:",
            ad._id,
            providerError
          );
          // Return ad without provider details if there's an error
          return {
            ...ad,
            serviceProvider: {
              _id: ad.provider_ID,
              fullName: "Unknown Provider",
              email: "N/A",
              phoneNumber: "N/A",
            },
          };
        }
      })
    );

    console.log("Sending advertisements response:", adsWithDetails.length);
    res.json(adsWithDetails);
  } catch (err) {
    console.error("Error fetching provider advertisements:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      message: "Failed to fetch advertisements",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get rejected ads - NEW FUNCTION to add to your controller
export const getRejectedAdvertisements = async (req, res) => {
  try {
    console.log("=== FETCHING REJECTED ADVERTISEMENTS ===");

    const ads = await Advertisement.find({ status: "rejected" })
      .sort({ created_at: -1 }) // Sort by creation date (newest first)
      .lean();

    console.log("Found rejected ads:", ads.length);

    if (ads.length === 0) {
      return res.json([]);
    }

    const adsWithProviderDetails = await Promise.all(
      ads.map(async (ad) => {
        const providerDetails = await getServiceProviderDetails(ad.provider_ID);

        return {
          _id: ad._id,
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          duration: ad.duration,
          status: ad.status,
          paymentStatus: ad.paymentStatus,
          created_at: ad.created_at,
          approved_at: ad.approved_at,
          rejectionReason: ad.rejectionReason,
          // Provider details as a separate object
          serviceProvider: providerDetails,
        };
      })
    );

    console.log(
      "Sending rejected ads with provider details:",
      adsWithProviderDetails.length
    );
    res.json(adsWithProviderDetails);
  } catch (err) {
    console.error("Error fetching rejected ads:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get published ads (approved and paid) - NEW FUNCTION
export const getPublishedAdvertisements = async (req, res) => {
  try {
    console.log("=== FETCHING PUBLISHED ADVERTISEMENTS ===");

    // Get advertisements that are both approved and paid
    const ads = await Advertisement.find({
      status: "approved",
      paymentStatus: "paid",
    })
      .sort({ approved_at: -1 }) // Sort by most recently approved first
      .lean();

    console.log("Found published ads count:", ads.length);

    if (ads.length === 0) {
      console.log("No published ads found");
      return res.json([]);
    }

    // Log the first ad to see its structure
    if (ads[0]) {
      console.log("First published ad structure:");
      console.log("- ID:", ads[0]._id);
      console.log("- Title:", ads[0].title);
      console.log("- Status:", ads[0].status);
      console.log("- Payment Status:", ads[0].paymentStatus);
      console.log("- Created at:", ads[0].created_at);
      console.log("- Approved at:", ads[0].approved_at);
      console.log("- Provider ID:", ads[0].provider_ID);
    }

    const adsWithProviderDetails = await Promise.all(
      ads.map(async (ad, index) => {
        console.log(
          `Processing published ad ${index + 1}/${ads.length}:`,
          ad.title
        );

        const providerDetails = await getServiceProviderDetails(ad.provider_ID);

        // Create the formatted response
        const formattedAd = {
          _id: ad._id,
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          duration: ad.duration,
          status: ad.status,
          paymentStatus: ad.paymentStatus,
          created_at: ad.created_at,
          // Ensure approved_at is properly handled
          approved_at: ad.approved_at,
          rejectionReason: ad.rejectionReason,
          // Provider details as a separate object for clarity
          serviceProvider: providerDetails,
        };

        console.log(`Formatted published ad ${index + 1}:`, {
          id: formattedAd._id,
          title: formattedAd.title,
          approved_at: formattedAd.approved_at,
          paymentStatus: formattedAd.paymentStatus,
          serviceProvider: formattedAd.serviceProvider.fullName,
        });

        return formattedAd;
      })
    );

    console.log("=== FINAL PUBLISHED ADS RESPONSE ===");
    console.log("Total ads being sent:", adsWithProviderDetails.length);
    console.log("Sample approved_at values:");
    adsWithProviderDetails.slice(0, 3).forEach((ad, i) => {
      console.log(`Ad ${i + 1}: ${ad.approved_at}`);
    });

    res.json(adsWithProviderDetails);
  } catch (err) {
    console.error("Error fetching published ads:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete an advertisement by ID - NEW FUNCTION
export const deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid advertisement ID" });
    }

    // Find and delete the advertisement
    const deletedAd = await Advertisement.findByIdAndDelete(id);

    if (!deletedAd) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    console.log("Advertisement deleted:", deletedAd._id);
    res.json({ message: "Advertisement deleted successfully", deletedAd });
  } catch (err) {
    console.error("Error deleting advertisement:", err);
    res.status(500).json({ message: err.message });
  }
};
