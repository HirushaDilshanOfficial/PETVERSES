import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointment_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, ref: "User" },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    package: { type: String, enum: ["Basic", "Premium", "Luxury"] },
    packagePrice: { type: Number, default: 0 }, // Add package price field
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Scheduled",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    rejectionReason: { type: String },
    points_awarded: { type: Number, default: 0 },
    service_id: { type: String }, // Add service_id field (stored as string to match frontend)
    service_name: { type: String }, // Add service_name field

    pet_name: { type: String, required: true },
    pet_type: { type: String, required: true },
    pet_breed: { type: String, required: true },
    note: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
