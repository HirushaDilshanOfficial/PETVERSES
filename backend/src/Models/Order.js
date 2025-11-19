// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  billingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    postalCode: String,
    country: String,
  },

  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    postalCode: String,
    country: String,
  },

  items: [
    {
      productID: { type: String, ref: "Product" },
      name: String,
      pQuantity: Number,
      pPrice: Number,
    },
  ],

  subtotal: { type: Number, default: 0 }, // ✅ Added field
  deliveryFee: { type: Number, default: 0 },
  totalAmount: Number,
  pointsRedeemed: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ["online", "bank_transfer", "cod"],
    required: true,
  },
  paymentStatus: { type: String, default: "pending" },
  status: { type: String, default: "processing" },
  date: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;