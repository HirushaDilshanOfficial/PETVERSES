import Cart from "../Models/Cart.js";
import Product from "../Models/Product.js";
import mongoose from "mongoose";

// Helper to calculate subtotal
const calculateSubtotal = (items) =>
  items.reduce((acc, item) => acc + item.price * item.quantity, 0);

// Get user's cart
export const getCart = async (req, res) => {
  // Use the correct property name for userId from the auth middleware
  const userId = req.user.userId;
  console.log("Getting cart for userId:", userId); // Debug log

  // Convert userId to ObjectId if it's a string
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  let cart = await Cart.findOne({ userId: userObjectId });
  if (!cart) {
    cart = await Cart.create({ userId: userObjectId, items: [], subtotal: 0 });
  }

  res.json({
    cart: cart.items,
    subtotal: cart.subtotal,
    total: cart.subtotal, // For now, total equals subtotal (no shipping/tax logic yet)
  });
};

// Add item to cart
export const addToCart = async (req, res) => {
  // Use the correct property name for userId from the auth middleware
  const userId = req.user.userId;
  const { productID, quantity = 1 } = req.body;

  console.log("Adding to cart for userId:", userId, "productID:", productID); // Debug log

  // Convert userId to ObjectId if it's a string
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const product = await Product.findOne({ productID });
  if (!product) return res.status(404).json({ message: "Product not found" });

  let cart = await Cart.findOne({ userId: userObjectId });
  if (!cart) {
    cart = await Cart.create({ userId: userObjectId, items: [], subtotal: 0 });
  }

  const existingItem = cart.items.find((item) => item.productId === productID);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      productId: product.productID,
      name: product.pName,
      price: product.pPrice,
      image: product.pImage, // Add the image field
      quantity,
    });
  }

  cart.subtotal = calculateSubtotal(cart.items);
  await cart.save();

  res.json({
    cart: cart.items,
    subtotal: cart.subtotal,
    total: cart.subtotal, // For now, total equals subtotal (no shipping/tax logic yet)
  });
};

// Update item quantity
export const updateCartItem = async (req, res) => {
  // Use the correct property name for userId from the auth middleware
  const userId = req.user.userId;
  const { productId } = req.params;
  const { quantity } = req.body;

  console.log(
    "Updating cart item for userId:",
    userId,
    "productId:",
    productId
  ); // Debug log

  // Convert userId to ObjectId if it's a string
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const cart = await Cart.findOne({ userId: userObjectId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = quantity;
  cart.subtotal = calculateSubtotal(cart.items);
  await cart.save();

  res.json({
    cart: cart.items,
    subtotal: cart.subtotal,
    total: cart.subtotal, // For now, total equals subtotal (no shipping/tax logic yet)
  });
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
  // Use the correct property name for userId from the auth middleware
  const userId = req.user.userId;
  const { productId } = req.params;

  console.log(
    "Removing cart item for userId:",
    userId,
    "productId:",
    productId
  ); // Debug log

  // Convert userId to ObjectId if it's a string
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const cart = await Cart.findOne({ userId: userObjectId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter((item) => item.productId !== productId);
  cart.subtotal = calculateSubtotal(cart.items);
  await cart.save();

  res.json({
    cart: cart.items,
    subtotal: cart.subtotal,
    total: cart.subtotal, // For now, total equals subtotal (no shipping/tax logic yet)
  });
};

// Clear cart
export const clearCart = async (req, res) => {
  // Use the correct property name for userId from the auth middleware
  const userId = req.user.userId;

  console.log("Clearing cart for userId:", userId); // Debug log

  // Convert userId to ObjectId if it's a string
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const cart = await Cart.findOne({ userId: userObjectId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = [];
  cart.subtotal = 0;
  await cart.save();

  res.json({
    cart: cart.items,
    subtotal: cart.subtotal,
    total: cart.subtotal, // For now, total equals subtotal (no shipping/tax logic yet)
  });
};
