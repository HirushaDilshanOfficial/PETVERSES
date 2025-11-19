import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  // Custom payment ID (auto-generated)
  paymentID: { type: String, unique: true },

  // Reference to Order model (foreign key) - optional for advertisement payments
  orderID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: false,
  },

  // Reference to Advertisement (optional)
  ad_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Advertisement",
    required: false,
  },

  // Reference to Appointment (optional)
  appointmentID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: false,
  },

  transactionID: { type: String },
  amount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "pending",
  },

  paidAt: { type: Date, default: Date.now },
});

// Auto-generate a custom paymentID before saving
paymentSchema.pre("save", function (next) {
  if (!this.paymentID) {
    // Example: PAY-20250918-<5-digit-random>
    this.paymentID =
      "PAY-" +
      new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      Math.floor(10000 + Math.random() * 90000);
  }
  next();
});

// Validate that exactly one of orderID, ad_ID, or appointmentID is provided
paymentSchema.pre("validate", function (next) {
  const refs = [this.orderID, this.ad_ID, this.appointmentID].filter(Boolean);
  if (refs.length !== 1) {
    return next(
      new Error(
        "Exactly one of orderID, ad_ID, or appointmentID must be provided"
      )
    );
  }
  next();
});

export default mongoose.model("Payment", paymentSchema);
