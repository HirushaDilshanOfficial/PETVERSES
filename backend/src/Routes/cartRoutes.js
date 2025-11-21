import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../Controllers/cartController.js";
import { requireAuth, requirePetOwner } from "../Middleware/auth.js";

const router = express.Router();

// All cart routes require authentication
router.use(requireAuth);

// All cart routes require pet owner role
router.use(requirePetOwner);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/:productId", updateCartItem);
router.delete("/:productId", removeCartItem);
router.delete("/clear", clearCart);

export default router;
