import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getBestSellers,
} from "../Controllers/productController.js";
import { authenticateUser, requireAdmin } from "../Middleware/auth.js";
import { uploadSingleFile } from "../Middleware/fileUpload.js";

const router = express.Router();


// Get all products
router.get("/", getAllProducts);

// Get best-selling products
router.get("/bestsellers", getBestSellers);

// Get product by ID (this should be last as it's a catch-all pattern)
router.get("/:productId", getProductById);


// Create new product (with file upload support)
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  uploadSingleFile,
  createProduct
);

// Update product (with file upload support)
router.put(
  "/:productId",
  authenticateUser,
  requireAdmin,
  uploadSingleFile,
  updateProduct
);

// Delete product
router.delete("/:productId", authenticateUser, requireAdmin, deleteProduct);

// Toggle product status
router.put(
  "/:productId/status",
  authenticateUser,
  requireAdmin,
  toggleProductStatus
);

export default router;
