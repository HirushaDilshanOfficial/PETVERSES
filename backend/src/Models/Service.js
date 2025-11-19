import mongoose from "mongoose";

// Subdocument for package-wise details
const packageSchema = new mongoose.Schema(
  {
    name: { type: String }, // e.g., Basic, Standard, Premium
    price: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g., "30 minutes", "1 day"
    services: { type: [String], default: [] }, // list of included services/features
  },
  { _id: false }
);

const providerSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fullName: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    role: { type: String },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    provider: providerSnapshotSchema,
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["grooming", "boarding", "training", "veterinary", "other"],
    },
    address: {
      // ✅ change from location → address
      type: String,
    },
    price: {
      type: Number,
    },
    packages: {
      type: [packageSchema],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    service_status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);
export default Service;
