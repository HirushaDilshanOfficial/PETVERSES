// RatingsController.js
import mongoose from "mongoose";
import Ratings from "../Models/RatingsModel.js";
import cloudinary from "../Config/cloudinary.js";

// Create/Add new feedback
export const createRating = async (req, res) => {
  try {
    // Debug logging
    console.log("=== CREATE RATING DEBUG INFO ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("Request user:", req.user);
    console.log("===============================");

    // ✅ Take the userID from auth, not from body
    const userID = req.user?.userId; // Changed from req.user?._id to req.user?.userId

    // Check if userID is available
    if (!userID) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Still allow serviceID and productID from frontend
    let { rating, feedback, serviceID, productID } = req.body;
    let { image_url } = req.body;

    // Handle parsing of fields that might come as strings from FormData
    if (typeof rating === "string") {
      rating = parseInt(rating, 10);
    }

    // Convert string IDs to ObjectId if they exist and are valid
    if (serviceID && typeof serviceID === "string") {
      if (mongoose.Types.ObjectId.isValid(serviceID)) {
        serviceID = new mongoose.Types.ObjectId(serviceID);
      } else {
        return res.status(400).json({ message: "Invalid serviceID format" });
      }
    }

    if (productID && typeof productID === "string") {
      if (mongoose.Types.ObjectId.isValid(productID)) {
        productID = new mongoose.Types.ObjectId(productID);
      } else {
        return res.status(400).json({ message: "Invalid productID format" });
      }
    }

    // Debug logging
    console.log("Extracted data:", {
      rating,
      feedback,
      serviceID,
      productID,
      image_url,
    });
    console.log("Rating type:", typeof rating);

    // Validate required fields
    if (rating === undefined || rating === null || isNaN(rating)) {
      return res
        .status(400)
        .json({ message: "Rating is required and must be a number" });
    }

    if (!feedback || typeof feedback !== "string") {
      return res
        .status(400)
        .json({ message: "Feedback is required and must be a string" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    if (
      (!serviceID || serviceID === "null") &&
      (!productID || productID === "null")
    ) {
      return res
        .status(400)
        .json({ message: "Either serviceID or productID is required" });
    }

    // Handle image upload if present
    if (req.file?.path) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "petverse/ratings",
        resource_type: "image",
      });
      image_url = upload.secure_url;
    }

    const newFeedback = new Ratings({
      rating,
      feedback,
      userID, // 👈 from req.user
      serviceID,
      productID,
      image_url,
    });

    // Debug logging
    console.log("About to save feedback:", newFeedback);

    const savedFeedback = await newFeedback.save();

    // 🔥 CRITICAL FIX: Populate the user data before sending response
    const populatedFeedback = await Ratings.findById(
      savedFeedback._id
    ).populate("userID", "fullName email");

    res.status(201).json(populatedFeedback);
  } catch (err) {
    console.error("Error in createRating:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.name === "ValidationError") {
      console.error("Validation errors:", err.errors);
    }
    res.status(400).json({ message: err.message });
  }
};

// Get feedbacks (with optional filters)
export const getRatings = async (req, res) => {
  try {
    const { productID, serviceID, rating } = req.query;

    let filter = {};
    if (productID) {
      const trimmedProductID = productID.trim();
      if (mongoose.Types.ObjectId.isValid(trimmedProductID)) {
        filter.productID = new mongoose.Types.ObjectId(trimmedProductID);
      } else {
        return res.status(400).json({ message: "Invalid productID format" });
      }
    }
    if (serviceID) {
      const trimmedServiceID = serviceID.trim();
      if (mongoose.Types.ObjectId.isValid(trimmedServiceID)) {
        filter.serviceID = new mongoose.Types.ObjectId(trimmedServiceID);
      } else {
        return res.status(400).json({ message: "Invalid serviceID format" });
      }
    }
    // 🔥 NEW: Rating filter
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        filter.rating = ratingNum;
      }
    }

    // 🔥 MAIN FIX: Added .populate("userID", "fullName email")
    const feedbacks = await Ratings.find(filter)
      .populate("serviceID")
      .populate("productID")
      .populate("userID", "fullName email"); // 👈 THIS WAS MISSING!

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update feedback
export const updateRating = async (req, res) => {
  try {
    console.log("=== UPDATE RATING DEBUG INFO ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);
    console.log("Feedback ID from params:", req.params.id);
    console.log("User ID from auth:", req.user?.userId);
    console.log("===============================");

    const { rating, feedback } = req.body;
    let { image_url } = req.body;

    if (req.file?.path) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "petverse/ratings",
        resource_type: "image",
      });
      image_url = upload.secure_url;
    }

    const update = {};
    if (rating !== undefined) update.rating = rating;
    if (feedback !== undefined) update.feedback = feedback;
    if (image_url !== undefined) update.image_url = image_url;

    // ⚠️ Fixed: Use req.user.userId instead of req.user?._id to match the auth middleware
    const updatedFeedback = await Ratings.findOneAndUpdate(
      { _id: req.params.id, userID: req.user.userId }, // only update own feedback
      update,
      { new: true, runValidators: true }
    ).populate("userID", "fullName email"); // 🔥 Added populate

    console.log("Updated feedback result:", updatedFeedback);

    if (!updatedFeedback) {
      // Let's check if the feedback exists at all
      const existingFeedback = await Ratings.findById(req.params.id);
      console.log("Existing feedback (for debugging):", existingFeedback);

      if (!existingFeedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      // Check if it belongs to a different user
      if (existingFeedback.userID.toString() !== req.user.userId.toString()) {
        console.log(
          "User ID mismatch - Feedback belongs to:",
          existingFeedback.userID,
          "Current user:",
          req.user.userId
        );
        return res.status(403).json({
          message: "Not authorized to update this feedback",
          feedbackUserId: existingFeedback.userID,
          currentUserId: req.user.userId,
        });
      }

      return res
        .status(403)
        .json({ message: "Not authorized to update this feedback" });
    }

    res.json(updatedFeedback);
  } catch (err) {
    console.error("Error in updateRating:", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete feedback
export const deleteRating = async (req, res) => {
  try {
    console.log("=== DELETE RATING DEBUG INFO ===");
    console.log("Request params:", req.params);
    console.log("Request user:", req.user);
    console.log("Feedback ID from params:", req.params.id);
    console.log("User ID from auth:", req.user?.userId);
    console.log("===============================");

    // ⚠️ Fixed: Use req.user.userId instead of req.user?._id to match the auth middleware
    const deleted = await Ratings.findOneAndDelete({
      _id: req.params.id,
      userID: req.user.userId,
    });

    console.log("Deleted feedback result:", deleted);

    if (!deleted) {
      // Let's check if the feedback exists at all
      const existingFeedback = await Ratings.findById(req.params.id);
      console.log("Existing feedback (for debugging):", existingFeedback);

      if (!existingFeedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      // Check if it belongs to a different user
      if (existingFeedback.userID.toString() !== req.user.userId.toString()) {
        console.log(
          "User ID mismatch - Feedback belongs to:",
          existingFeedback.userID,
          "Current user:",
          req.user.userId
        );
        return res.status(403).json({
          message: "Not authorized to delete this feedback",
          feedbackUserId: existingFeedback.userID,
          currentUserId: req.user.userId,
        });
      }

      return res
        .status(403)
        .json({ message: "Not authorized to delete this feedback" });
    }

    res.json({ message: "Feedback deleted" });
  } catch (err) {
    console.error("Error in deleteRating:", err);
    res.status(500).json({ message: err.message });
  }
};
