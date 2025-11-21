// Controllers/paymentController.js
import Payment from "../Models/Payment.js";
import Order from "../Models/Order.js";
import Advertisement from "../Models/AdvertisementModel.js"; // Add Advertisement model import
import Appointment from "../Models/Appointment.js"; // Add Appointment model import
import User from "../Models/User.js";
import mongoose from "mongoose";

// CREATE PAYMENT
export const createPayment = async (req, res) => {
  try {
    console.log("💡 createPayment called"); // function is triggered
    console.log("Incoming request body:", req.body); // check what data comes from frontend

    const { orderID, amount, paymentType, referenceId, simulate } = req.body;

    // Validate required fields
    if (!orderID || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderID)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    console.log("✅ orderID and amount validated");

    // Determine status
    let status = "success"; // default for real payments
    if (simulate) {
      status = Math.random() > 0.2 ? "success" : "failed"; // 80% chance success
    }

    const payment = new Payment({
      orderID: new mongoose.Types.ObjectId(orderID),
      transactionID: referenceId || "TXN-" + Date.now(),
      amount,
      paymentType: paymentType || "card",
      status,
      ...(status === "success" && { paidAt: new Date() }),
    });

    console.log("Payment object to save:", payment);

    const savedPayment = await payment.save();
    console.log("💾 Payment saved:", savedPayment);

    // Update order paymentStatus if successful
    if (status === "success") {
      const order = await Order.findById(orderID);
      if (order) {
        console.log("Found order:", order);
        order.paymentStatus = "success";
        await order.save();
        console.log("Order payment status updated:", order);

        // Deduct loyalty points if they were used in this order
        console.log("🔍 Checking if points should be deducted...");
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
      } else {
        console.log("❌ Order not found");
      }
    }

    res.status(201).json({
      success: status === "success",
      message: `Payment ${status} for ${paymentType || "card"}`,
      payment,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating payment",
      error: error.message,
    });
  }
};

// CREATE APPOINTMENT PAYMENT
export const createAppointmentPayment = async (req, res) => {
  try {
    console.log("💡 createAppointmentPayment called");
    console.log("Incoming request body:", req.body);

    const { appointmentID, amount, paymentType, referenceId, paymentID } =
      req.body;

    // Validate required fields
    if (!appointmentID || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentID)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid appointment ID" });
    }

    console.log("✅ appointmentID and amount validated");

    let savedPayment;

    // If paymentID is provided (from OTP verification), update the existing payment record
    if (paymentID && mongoose.Types.ObjectId.isValid(paymentID)) {
      console.log("Updating existing payment record with ID:", paymentID);
      savedPayment = await Payment.findByIdAndUpdate(
        paymentID,
        {
          appointmentID: new mongoose.Types.ObjectId(appointmentID),
          amount: parseFloat(amount),
          paymentType: paymentType || "card",
          status: "success",
          paidAt: new Date(),
        },
        { new: true }
      );

      if (!savedPayment) {
        return res
          .status(404)
          .json({ success: false, message: "Payment record not found" });
      }
      console.log("Updated payment record:", savedPayment);
    } else {
      // Create a new payment record
      const payment = new Payment({
        appointmentID: new mongoose.Types.ObjectId(appointmentID),
        transactionID: referenceId || "TXN-APPT-" + Date.now(),
        amount: parseFloat(amount),
        paymentType: paymentType || "card",
        status: "success",
        paidAt: new Date(),
      });

      console.log("Appointment payment object to save:", payment);
      savedPayment = await payment.save();
    }

    console.log("💾 Appointment payment saved:", savedPayment);

    // Update appointment paymentStatus if successful and award loyalty points
    const appointment = await Appointment.findById(appointmentID);
    if (appointment) {
      try {
        appointment.paymentStatus = "paid";

        // Award points based on package if not already awarded
        const pointsMap = { Basic: 5, Premium: 10, Luxury: 15 };
        const pointsToAward = pointsMap[appointment.package] || 0;
        if (
          pointsToAward > 0 &&
          (!appointment.points_awarded || appointment.points_awarded === 0)
        ) {
          appointment.points_awarded = pointsToAward;
        }
        await appointment.save();
        console.log("Appointment payment status updated:", appointment);

        // Update user's loyalty points
        if (pointsToAward > 0) {
          const user = await User.findOne({ firebaseUid: appointment.user_id });
          if (user) {
            user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAward;
            await user.save();
            console.log(
              `Awarded ${pointsToAward} points to user ${user._id} for appointment ${appointmentID}`
            );
          }
        }
      } catch (awardErr) {
        console.error(
          "Error awarding loyalty points on appointment payment:",
          awardErr
        );
        // Do not fail the payment response due to points awarding issues
      }
    }

    res.status(201).json({
      success: true,
      message: `Appointment payment successful for ${paymentType || "card"}`,
      payment: savedPayment,
    });
  } catch (error) {
    console.error("Error creating appointment payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating appointment payment",
      error: error.message,
    });
  }
};

// CREATE ADVERTISEMENT PAYMENT
export const createAdvertisementPayment = async (req, res) => {
  try {
    console.log("💡 createAdvertisementPayment called");
    console.log("Incoming request body:", req.body);

    const { adId, amount, paymentType, referenceId, paymentID } = req.body;

    // Validate required fields
    if (!adId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid advertisement ID" });
    }

    console.log("✅ adId and amount validated");

    let savedPayment;

    // If paymentID is provided (from OTP verification), update the existing payment record
    if (paymentID && mongoose.Types.ObjectId.isValid(paymentID)) {
      console.log("Updating existing payment record with ID:", paymentID);
      savedPayment = await Payment.findByIdAndUpdate(
        paymentID,
        {
          ad_ID: new mongoose.Types.ObjectId(adId),
          amount: parseFloat(amount),
          paymentType: paymentType || "card",
          status: "success",
          paidAt: new Date(),
        },
        { new: true }
      );

      if (!savedPayment) {
        return res
          .status(404)
          .json({ success: false, message: "Payment record not found" });
      }
      console.log("Updated payment record:", savedPayment);
    } else {
      // Create a new payment record
      const payment = new Payment({
        ad_ID: new mongoose.Types.ObjectId(adId),
        transactionID: referenceId || "TXN-AD-" + Date.now(),
        amount: parseFloat(amount),
        paymentType: paymentType || "card",
        status: "success",
        paidAt: new Date(),
      });

      console.log("Advertisement payment object to save:", payment);
      savedPayment = await payment.save();
    }

    console.log("💾 Advertisement payment saved:", savedPayment);

    // Update advertisement paymentStatus if successful
    const advertisement = await Advertisement.findById(adId);
    if (advertisement) {
      advertisement.paymentStatus = "paid";
      await advertisement.save();
      console.log("Advertisement payment status updated:", advertisement);
    }

    res.status(201).json({
      success: true,
      message: `Advertisement payment successful for ${paymentType || "card"}`,
      payment: savedPayment,
    });
  } catch (error) {
    console.error("Error creating advertisement payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating advertisement payment",
      error: error.message,
    });
  }
};

// UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentID } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(paymentID)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment ID" });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentID,
      { status, paidAt: status === "success" ? new Date() : undefined },
      { new: true }
    );

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    console.log("Payment status updated:", payment);

    // Update order if payment is now successful
    if (status === "success" && payment.orderID) {
      const order = await Order.findById(payment.orderID);
      if (order) {
        console.log("Found order for payment status update:", order);
        order.paymentStatus = "success";
        await order.save();

        // Deduct loyalty points if they were used in this order
        console.log(
          "🔍 Checking if points should be deducted in updatePaymentStatus..."
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
            // Don't fail the payment update if points deduction fails
          }
        } else {
          console.log(
            "ℹ️ No points to deduct for this order (pointsRedeemed = 0)"
          );
        }
      } else {
        console.log("❌ Order not found for payment:", payment.orderID);
      }
    }

    // Update advertisement if this is an advertisement payment
    if (status === "success" && payment.ad_ID) {
      const advertisement = await Advertisement.findById(payment.ad_ID);
      if (advertisement) {
        advertisement.paymentStatus = "paid";
        await advertisement.save();
      }
    }

    // Update appointment if this is an appointment payment
    if (status === "success" && payment.appointmentID) {
      const appointment = await Appointment.findById(payment.appointmentID);
      if (appointment) {
        try {
          appointment.paymentStatus = "paid";

          // Award points based on package if not already awarded
          const pointsMap = { Basic: 5, Premium: 10, Luxury: 15 };
          const pointsToAward = pointsMap[appointment.package] || 0;
          if (
            pointsToAward > 0 &&
            (!appointment.points_awarded || appointment.points_awarded === 0)
          ) {
            appointment.points_awarded = pointsToAward;
          }
          await appointment.save();

          // Update user's loyalty points
          if (pointsToAward > 0) {
            const user = await User.findOne({
              firebaseUid: appointment.user_id,
            });
            if (user) {
              user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAward;
              await user.save();
            }
          }
        } catch (awardErr) {
          console.error(
            "Error awarding loyalty points on payment status update:",
            awardErr
          );
        }
      }
    }

    res.json({
      success: true,
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// GET PAYMENT BY ID
export const getPayment = async (req, res) => {
  try {
    const { paymentID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentID)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment ID" });
    }

    const payment = await Payment.findById(paymentID)
      .populate("orderID")
      .populate("ad_ID")
      .populate("appointmentID");

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// GET ALL PAYMENTS (Admin only)
export const getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admin only." });
    }

    const payments = await Payment.find()
      .populate("orderID")
      .populate("ad_ID")
      .populate("appointmentID")
      .sort({ paidAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// CREATE DEMO PAYMENT (for testing)
export const createDemoPayment = async (req, res) => {
  try {
    console.log("💡 createDemoPayment called");
    console.log("Incoming request body:", req.body);

    const { orderID, appointmentID, amount, paymentType, referenceId } =
      req.body;

    // Validate required fields
    if (!amount) {
      return res
        .status(400)
        .json({ success: false, message: "Amount is required" });
    }

    const paymentData = {
      transactionID: referenceId || "DEMO-" + Date.now(),
      amount: parseFloat(amount),
      paymentType: paymentType || "card",
      status: "success",
      paidAt: new Date(),
    };

    // Add the appropriate reference
    if (orderID) {
      if (!mongoose.Types.ObjectId.isValid(orderID)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid order ID" });
      }
      paymentData.orderID = new mongoose.Types.ObjectId(orderID);
    } else if (appointmentID) {
      if (!mongoose.Types.ObjectId.isValid(appointmentID)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid appointment ID" });
      }
      paymentData.appointmentID = new mongoose.Types.ObjectId(appointmentID);
    } else {
      return res.status(400).json({
        success: false,
        message: "Either orderID or appointmentID is required",
      });
    }

    console.log("✅ Fields validated");

    const payment = new Payment(paymentData);
    console.log("Payment object to save:", payment);

    const savedPayment = await payment.save();
    console.log("💾 Payment saved:", savedPayment);

    // If this is a demo order payment, also deduct loyalty points if used
    if (paymentData.orderID) {
      console.log(
        "Processing demo order payment for order:",
        paymentData.orderID
      );
      try {
        const order = await Order.findById(paymentData.orderID);
        if (order) {
          console.log("Found order for demo payment:", order);
          // Deduct loyalty points if they were used in this order
          console.log(
            "🔍 Checking if points should be deducted in createDemoPayment..."
          );
          console.log("Order pointsRedeemed value:", order.pointsRedeemed);
          console.log("Order userID:", order.userID);

          if (order.pointsRedeemed > 0) {
            console.log(
              `💰 Attempting to deduct ${order.pointsRedeemed} points from user ${order.userID}`
            );
            const user = await User.findById(order.userID);
            if (user) {
              console.log(`👤 User found: ${user._id}`);
              console.log(`📊 Current points balance: ${user.loyaltyPoints}`);

              const originalPoints = user.loyaltyPoints || 0;
              const pointsToDeduct = order.pointsRedeemed;
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
          } else {
            console.log(
              "ℹ️ No points to deduct for this order (pointsRedeemed = 0)"
            );
          }
        } else {
          console.log("❌ Order not found for demo payment");
        }
      } catch (pointsErr) {
        console.error(
          "❌ Error deducting loyalty points in demo payment:",
          pointsErr
        );
      }
    }

    // If this is a demo appointment payment, also update appointment and award points
    if (paymentData.appointmentID) {
      try {
        const appointment = await Appointment.findById(
          paymentData.appointmentID
        );
        if (appointment) {
          appointment.paymentStatus = "paid";

          const pointsMap = { Basic: 5, Premium: 10, Luxury: 15 };
          const pointsToAward = pointsMap[appointment.package] || 0;
          if (
            pointsToAward > 0 &&
            (!appointment.points_awarded || appointment.points_awarded === 0)
          ) {
            appointment.points_awarded = pointsToAward;
          }
          await appointment.save();

          if (pointsToAward > 0) {
            const user = await User.findOne({
              firebaseUid: appointment.user_id,
            });
            if (user) {
              user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAward;
              await user.save();
            }
          }
        }
      } catch (awardErr) {
        console.error(
          "Error awarding loyalty points in demo payment:",
          awardErr
        );
      }
    }

    res.status(201).json({
      success: true,
      message: `Demo payment successful for ${paymentType || "card"}`,
      payment: savedPayment,
      status: "success",
    });
  } catch (error) {
    console.error("Error creating demo payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating demo payment",
      error: error.message,
    });
  }
};
