// backend/src/Models/AdvertisementModel.js
import mongoose from "mongoose";

const AdvertisementSchema = new mongoose.Schema({
  provider_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // ✅ Use User, since providers are users
    required: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String, // store the URL or filename if uploading
  },
  duration: {
    type: Number, // e.g., number of days
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  approved_at: {
    type: Date,
  },
  rejectionReason: {
    type: String, // Added field for rejection reason
    default: null,
  },
});

const Advertisement = mongoose.model("Advertisement", AdvertisementSchema);
export default Advertisement;
