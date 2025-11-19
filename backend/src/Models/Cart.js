import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create index on userId for faster queries
cartSchema.index({ userId: 1 });

export default mongoose.model("Cart", cartSchema);
