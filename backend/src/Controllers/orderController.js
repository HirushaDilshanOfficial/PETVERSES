// controllers/orderController.js
import Order from "../Models/Order.js";
import Product from "../Models/Product.js";
import Cart from "../Models/Cart.js";
import Payment from "../Models/Payment.js";
import mongoose from "mongoose";
import User from "../Models/User.js";

const DELIVERY_FEE = 300; // Flat fee

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch cart
    const cartDoc = await Cart.findOne({ userId: userObjectId });
    console.log("fetch cart");
    if (!cartDoc || cartDoc.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const cart = cartDoc.items;

    // Determine points to redeem from request (optional)
    const requestedPointsRedeemed = Math.max(
      0,
      Number(req.body.pointsRedeemed) || 0
    );

    // Filter out items with insufficient stock and prepare order items
    const availableItems = [];
    const outOfStockItems = [];

    for (const item of cart) {
      const product = await Product.findOne({ productID: item.productId });
      if (!product) {
        outOfStockItems.push({ ...item, reason: "Product not found" });
        continue;
      }

      if (product.pQuantity <= 0) {
        outOfStockItems.push({
          ...item,
          productName: product.pName,
          reason: "Out of stock",
        });
        continue;
      }

      if (product.pQuantity < item.quantity) {
        // Partial fulfillment - reduce quantity to available stock
        availableItems.push({
          ...item,
          quantity: product.pQuantity,
          originalQuantity: item.quantity,
          price: item.price,
        });
      } else {
        // Full fulfillment
        availableItems.push(item);
      }
    }

    // If no items are available, return error
    if (availableItems.length === 0) {
      return res.status(400).json({
        message:
          "No items available for purchase. All items in your cart are out of stock.",
        outOfStockItems,
      });
    }

    // Reduce product quantities for available items
    for (const item of availableItems) {
      const product = await Product.findOne({ productID: item.productId });
      if (product) {
        product.pQuantity -= item.quantity;
        await product.save();
      }
    }

    // Prepare order items (only available items)
    const orderItems = availableItems.map((item) => ({
      productID: item.productId,
      name: item.name,
      pQuantity: item.quantity,
      pPrice: item.price,
    }));

    const { billingAddress = {}, shippingAddress = {} } = req.body;

    // Use the subtotal from the request body if provided, otherwise calculate it
    const subtotal =
      req.body.subtotal !== undefined
        ? req.body.subtotal
        : orderItems.reduce(
            (acc, item) => acc + item.pPrice * item.pQuantity,
            0
          );

    // Calculate discount from loyalty points (cap by user's balance later)
    const user = await User.findById(userObjectId);
    const userPoints = user?.loyaltyPoints || 0;
    const pointsRedeemed = Math.min(
      req.body.pointsRedeemed !== undefined ? req.body.pointsRedeemed : 0,
      userPoints
    );
    const POINT_VALUE_LKR = 10; // 1 point = 10 LKR
    const discountLKR = pointsRedeemed * POINT_VALUE_LKR;

    const preTotal = subtotal + DELIVERY_FEE;
    const totalAmount = Math.max(0, preTotal - discountLKR);

    console.log("=== ORDER CREATION DEBUG INFO ===");
    console.log("User points available:", userPoints);
    console.log("Points requested to redeem:", requestedPointsRedeemed);
    console.log("Points actually redeemed:", pointsRedeemed);
    console.log("Subtotal:", subtotal);
    console.log("Delivery fee:", DELIVERY_FEE);
    console.log("Discount amount:", discountLKR);
    console.log("Final total amount:", totalAmount);

    const newOrder = new Order({
      userID: userObjectId,
      items: orderItems,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      totalAmount,
      pointsRedeemed,
      paymentMethod: req.body.paymentMethod || "cod",
      paymentStatus: "pending",
      billingAddress,
      shippingAddress,
    });

    console.log("Order object to be saved:", newOrder);

    await newOrder.save();
    console.log("Order saved successfully");

    // Do not deduct redeemed points here. Points will be deducted only after successful payment.
    // This prevents losing points if the user abandons or fails payment.

    // Clear cart from database
    cartDoc.items = [];
    cartDoc.subtotal = 0;
    await cartDoc.save();

    console.log("Cart cleared successfully");
    console.log("Order created successfully");

    // Prepare response message
    let message = "Order created successfully";
    if (outOfStockItems.length > 0) {
      message += ` ${outOfStockItems.length} item(s) were out of stock and not included in your order.`;
    }
    res.status(201).json({
      message,
      order: newOrder,
      userEmail: req.user.email || "N/A",
      outOfStockItems: outOfStockItems.length > 0 ? outOfStockItems : undefined,
    });
  } catch (error) {
    console.error("❌ createOrder error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    const { id: orderID } = req.params;

    console.log("=== GET ORDER BY ID DEBUG INFO ===");
    console.log("Requested order ID:", orderID);
    console.log("Request user:", req.user);
    console.log("User ID from request:", req.user?.userId);
    console.log("User email from request:", req.user?.email);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderID)) {
      console.log("Invalid order ID format");
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(orderID);

    console.log("Order found in DB:", order);

    if (!order) {
      console.log("Order not found in database");
      // Let's also check if there are any orders in the database
      const allOrders = await Order.find({});
      console.log("All orders in database:", allOrders);
      return res.status(404).json({ message: "Order not found" });
    }
    // Check if the order belongs to the current user (for security)
    // Convert both IDs to strings for comparison
    const orderUserId = order.userID.toString();
    const reqUserId = req.user.userId.toString();

    console.log("Order user ID:", orderUserId);
    console.log("Request user ID:", reqUserId);
    console.log("Do IDs match?", orderUserId === reqUserId);

    if (orderUserId !== reqUserId) {
      console.log("User ID mismatch - access denied");
      return res.status(403).json({ message: "Access denied" });
    }

    console.log("Order found and accessible, sending response");
    res.json({ order });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: err.message });
  }
};

//  GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userID: req.user.userId });

    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        const detailedItems = await Promise.all(
          order.items.map(async (item) => {
            const product = await Product.findOne({
              productID: item.productID,
            });
            return {
              ...item.toObject(),
              productDetails: product
                ? {
                    pName: product.pName,
                    pCategory: product.pCategory,
                    pImage: product.pImage,
                  }
                : null,
            };
          })
        );
        return { ...order.toObject(), items: detailedItems };
      })
    );

    res.json(detailedOrders);
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ error: err.message });
  }
};

/// GET ALL ORDERS (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Fetch all orders with populated user details
    const orders = await Order.find()
      .populate("userID", "email fullName")
      .sort({ date: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ORDER
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order belongs to the current user (for security)
    if (order.userID.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Store the previous payment status
    const previousPaymentStatus = order.paymentStatus;

    // Update the order with provided data
    Object.keys(updateData).forEach((key) => {
      order[key] = updateData[key];
    });

    await order.save();
    // If paymentStatus is updated to "success", also update associated payment
    if (
      previousPaymentStatus !== "success" &&
      order.paymentStatus === "success"
    ) {
      // Validate order ID format before querying
      if (mongoose.Types.ObjectId.isValid(id)) {
        const orderObjectId = new mongoose.Types.ObjectId(id);
        const payment = await Payment.findOne({ orderID: orderObjectId });
        if (payment) {
          payment.status = "success";
          payment.paidAt = new Date();
          await payment.save();
        }
      }
    }

    res.json({ message: "Order updated successfully", order });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ error: err.message });
  }
};
