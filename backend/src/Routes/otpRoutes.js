import express from "express";
import { requireAuth } from "../Middleware/auth.js";
import { generateOtp, verifyOtp, otpStore } from "../Utils/otpUtils.js";
import Order from "../Models/Order.js";
import Advertisement from "../Models/AdvertisementModel.js"; // Add Advertisement model import
import Payment from "../Models/Payment.js";
import User from "../Models/User.js"; // Add User model import for loyalty points
import mongoose from "mongoose";

const router = express.Router();

// Send OTP endpoint
router.post("/send-otp", requireAuth, async (req, res) => {
  try {
    const { resourceType, resourceID, email } = req.body;

    if (!resourceType || !resourceID || !email) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: resourceType, resourceID, and email are required",
      });
    }

    const otp = await generateOtp(resourceType, resourceID, email);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      resourceType,
      resourceID,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

// Verify OTP endpoint
router.post("/verify-otp", requireAuth, async (req, res) => {
  try {
    const { resourceType, resourceID, otp } = req.body;

    if (!resourceType || !resourceID || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: resourceType, resourceID, and otp are required",
      });
    }

    const result = verifyOtp(resourceType, resourceID, otp);

    if (result.valid) {
      // If this is an order verification, create a payment record
      if (resourceType === "order") {
        // Fetch the order
        const order = await Order.findById(resourceID);
        if (order) {
          console.log("Found order for OTP verification:", order);
          // Create payment record
          const payment = new Payment({
            orderID: new mongoose.Types.ObjectId(resourceID),
            transactionID: "TXN-" + Date.now(),
            amount: order.totalAmount,
            paymentType: order.paymentMethod || "card",
            status: "success",
            paidAt: new Date(),
          });

          const savedPayment = await payment.save();
          console.log("Payment record created:", savedPayment);

          // Update order payment status
          order.paymentStatus = "success";
          await order.save();
          console.log("Order payment status updated:", order);

          // Deduct loyalty points if they were used in this order
          console.log(
            "🔍 Checking if points should be deducted in OTP verification..."
          );
          console.log("Order pointsRedeemed value:", order.pointsRedeemed);
          console.log("Order userID:", order.userID);

          if (order.pointsRedeemed > 0) {
            console.log(
              `💰 Attempting to deduct ${order.pointsRedeemed} points from user ${order.userID}`
            );
            try {
              const user = await User.findById(order.userID);
              if (user) {
                console.log(`👤 User found: ${user._id}`);
                console.log(`📊 Current points balance: ${user.loyaltyPoints}`);

                const originalPoints = user.loyaltyPoints || 0;
                const pointsToDeduct = order.pointsRedeemed;
                // Ensure we don't go below 0 points
                const newPoints = Math.max(0, originalPoints - pointsToDeduct);

                console.log(
                  `🧮 Calculation: ${originalPoints} - ${pointsToDeduct} = ${newPoints}`
                );

                user.loyaltyPoints = newPoints;
                await user.save();

                console.log(
                  `✅ Points successfully deducted. New balance: ${user.loyaltyPoints}`
                );
              } else {
                console.log("❌ ERROR: User not found for point deduction");
              }
            } catch (pointsErr) {
              console.log(
                "❌ ERROR: Failed to deduct loyalty points:",
                pointsErr
              );
              // Don't fail the payment if points deduction fails
            }
          } else {
            console.log(
              "ℹ️ No points to deduct for this order (pointsRedeemed = 0)"
            );
          }

          res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resourceType,
            resourceID,
            orderID: resourceID,
            paymentID: savedPayment._id,
          });
        } else {
          console.log("Order not found for ID:", resourceID);
          res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resourceType,
            resourceID,
          });
        }
      }
      // If this is an advertisement verification, create a payment record
      else if (resourceType === "advertisement") {
        console.log("Verifying OTP for advertisement:", resourceID);
        // Fetch the advertisement
        const advertisement = await Advertisement.findById(resourceID);
        if (advertisement) {
          console.log("Found advertisement:", advertisement);
          // Create payment record
          const payment = new Payment({
            ad_ID: new mongoose.Types.ObjectId(resourceID),
            transactionID: "TXN-AD-" + Date.now(),
            amount: 0, // We'll update this when the actual payment is made
            paymentType: "card",
            status: "pending",
            paidAt: null,
          });

          const savedPayment = await payment.save();
          console.log("Advertisement payment record created:", savedPayment);

          res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resourceType,
            resourceID,
            advertisementID: resourceID,
            paymentID: savedPayment._id,
          });
        } else {
          console.log("Advertisement not found for ID:", resourceID);
          res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resourceType,
            resourceID,
          });
        }
      } else {
        res.status(200).json({
          success: true,
          message: "OTP verified successfully",
          resourceType,
          resourceID,
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
});

// Resend OTP endpoint
router.post("/resend-otp", requireAuth, async (req, res) => {
  try {
    const { resourceType, resourceID, email } = req.body;

    if (!resourceType || !resourceID || !email) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: resourceType, resourceID, and email are required",
      });
    }

    // First verify that the original OTP exists and is expired
    const record = otpStore[resourceType]?.[resourceID];
    if (record && Date.now() < record.expires) {
      return res.status(400).json({
        success: false,
        message: "OTP is still valid, please use the existing OTP",
      });
    }

    const otp = await generateOtp(resourceType, resourceID, email);

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      resourceType,
      resourceID,
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
});

export default router;
