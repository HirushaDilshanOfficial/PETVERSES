import mongoose from "mongoose";

// Product Schema for inventory management
const productSchema = new mongoose.Schema(
  {
    // Product ID - unique identifier
    productID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 6,
    },
    // Product Name
    pName: {
      type: String,
      required: true,
      trim: true,
    },
    // Product Description
    pDescription: {
      type: String,
      required: true,
    },
    // Product Category
    pCategory: {
      type: String,
      required: true,
      trim: true,
    },
    // Product Price
    pPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // Product Quantity
    pQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    // Product Image URL
    pImage: {
      type: String, // Store Cloudinary URL
    },
    // Product Status (Active/Inactive)
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create and export the Product model
const Product = mongoose.model("Product", productSchema);

export default Product;
