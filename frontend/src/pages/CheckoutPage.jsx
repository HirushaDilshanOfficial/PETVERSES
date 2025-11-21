import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";
import CheckoutForm from "../components/CheckoutForm";
import axios from "axios";
import toast from "react-hot-toast";

// ===== PDF Dependencies =====
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===== Utility Functions for PDF =====
const DELIVERY_FEE = 300;
const headerColor = [30, 64, 175];

const addHeader = (doc, logoBase64, pageNumber) => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 45, "F");
  if (logoBase64) {
    doc.addImage(logoBase64, "JPEG", 15, 8, 24, 24);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PETVERSE", 45, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Payments Report", 45, 26);
  doc.setFontSize(8);
  doc.text("New Kandy Road, Malabe • Tel: 091-2345675", 45, 32);
  doc.text("www.petverse.com • mailtopetverse@gmail.com", 45, 36);
  const currentDate = new Date();
  const dateString = `Generated on: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;
  const dateWidth = doc.getTextWidth(dateString);
  doc.text(dateString, pageWidth - dateWidth - 15, 32);
  const pageText = `Page ${pageNumber}`;
  const pageTextWidth = doc.getTextWidth(pageText);
  doc.text(pageText, pageWidth - pageTextWidth - 15, 36);
  doc.setTextColor(0, 0, 0);
};

const addFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.setFont("helvetica", "normal");
  const footerText = "©️ 2025 PETVERSE. All rights reserved.";
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
};

const getImageBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = () => {
      console.warn("Failed to load image at " + url);
      resolve(null); // Resolve with null instead of rejecting
    };
    img.src = url;
  });
};

const generatePdf = async (order, payment, userEmail) => {
  try {
    const doc = new jsPDF();
    let logoBase64 = null;
  try {
    logoBase64 = await getImageBase64("/images/company-logo.jpg");
  } catch (err) {
    console.warn("Failed to load logo, continuing without it:", err);
  }

    addHeader(doc, logoBase64, 1);

    doc.setFontSize(18);
    doc.setTextColor("#1E40AF");
    doc.text("Payment Receipt", 105, 55, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor("#1E40AF");
    doc.text("Customer Details:", 14, 70);
    doc.setFontSize(12);
    doc.setTextColor(0);

    const billingAddress = order.billingAddress || {};
    const shippingAddress = order.shippingAddress || {};

    doc.text(`Email: ${userEmail || "N/A"}`, 14, 77);
    doc.text(
      `Billing: ${billingAddress.fullName || ""}, ${billingAddress.street || ""}, ${billingAddress.city || ""}`,
      14,
      84
    );
    doc.text(
      `Shipping: ${shippingAddress.fullName || ""}, ${shippingAddress.street || ""}, ${shippingAddress.city || ""}`,
      14,
      91
    );

    doc.setFontSize(14);
    doc.setTextColor("#1E40AF");
    doc.text("Payment Details:", 14, 104);
    doc.setFontSize(12);
    doc.setTextColor(0);

    // Get loyalty points discount information
    const pointsRedeemed = order.pointsRedeemed || 0;
    const POINT_VALUE_LKR = 10; // 1 point = Rs.10
    const discountAmount = pointsRedeemed * POINT_VALUE_LKR;
    // Fix the subtotal calculation - use order.subtotal directly
    const subtotal = order.subtotal || 0;
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const finalTotal = totalAfterDiscount + DELIVERY_FEE;

    doc.text(`Payment ID: ${payment?.paymentID || "N/A"}`, 14, 111);
    doc.text(`Transaction ID: ${payment?.transactionID || "N/A"}`, 14, 118);
    doc.text(`Payment Method: ${order.paymentMethod || "COD"}`, 14, 125);
    doc.text(`Payment Status: ${payment?.status || "Pending"}`, 14, 132);
    
    // Add detailed pricing breakdown
    doc.text(`Subtotal: Rs.${subtotal.toFixed(2)}`, 14, 139);
    
    // Show discount only if points were redeemed
    if (pointsRedeemed > 0) {
      doc.text(`Loyalty Points Discount: -Rs.${discountAmount.toFixed(2)} (${pointsRedeemed} points)`, 14, 146);
      doc.text(`Subtotal after discount: Rs.${totalAfterDiscount.toFixed(2)}`, 14, 153);
      doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 160);
      doc.text(`Total Amount: Rs.${finalTotal.toFixed(2)}`, 14, 167);
    } else {
      doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 146);
      doc.text(`Total Amount: Rs.${(subtotal + DELIVERY_FEE).toFixed(2)}`, 14, 153);
    }

    const tableColumn = ["Product Name", "Quantity", "Unit Price", "Total Price"];
    const tableRows = [];
    // Fix the items processing - ensure we're using the correct item structure
    const items = Array.isArray(order.items) ? order.items : [];

    items.forEach((item) => {
      // Make sure we're accessing the correct properties
      const quantity = item.pQuantity !== undefined ? item.pQuantity : (item.quantity || 0);
      const unitPrice = item.pPrice !== undefined ? item.pPrice : (item.price || 0);
      // Calculate total price as quantity × unit price
      const totalPrice = quantity * unitPrice;
      
      // Use the correct product name property
      const productName = item.name || item.pName || "Unknown Product";
      
      const row = [
        productName,
        quantity,
        `Rs.${unitPrice.toFixed(2)}`,
        `Rs.${totalPrice.toFixed(2)}`, // Total Price = Quantity × Unit Price
      ];
      tableRows.push(row);
    });

    // Use autoTable with enhanced styling
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: pointsRedeemed > 0 ? 174 : 160,
      theme: "grid",
      headStyles: { fillColor: "#1E40AF", textColor: 255 },
      alternateRowStyles: { fillColor: "#F3F4F6" },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 }, // Product Name
        1: { cellWidth: 25, halign: 'center' }, // Quantity
        2: { cellWidth: 35, halign: 'right' }, // Unit Price
        3: { cellWidth: 35, halign: 'right' }  // Total Price
      },
      margin: { top: 40 },
      didDrawPage: () => {
        addHeader(doc, logoBase64, doc.internal.getNumberOfPages());
        addFooter(doc);
      },
    });

    const finalY = doc.lastAutoTable.finalY || 200;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Thank you for your purchase!", 105, finalY + 20, { align: "center" });

    addFooter(doc);
    doc.save(`payment_receipt_${payment?.paymentID || order._id}.pdf`);
  } catch (error) {
    console.error("Error generating COD PDF:", error);
  }
};

// ===== CheckoutPage Component =====
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart } = useContext(CartContext);
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  if (!cart || cart.length === 0) {
    navigate("/cart");
    return null;
  }

  const handlePlaceOrder = async (orderData) => {
    setIsProcessing(true);
    try {
      const auth = getAuth(app);
      const token = await auth.currentUser.getIdToken();

      // Fix the order items structure to ensure correct properties
      const orderItems = cart.map((item) => ({
        productID: item.productId || item.productID,
        name: item.pName || item.name,
        pQuantity: item.quantity,
        pPrice: item.price || item.pPrice,
      }));

      const order = {
        items: orderItems,
        subtotal: orderData.subtotal, // Include subtotal
        totalAmount: orderData.total, // Use the calculated total from the form
        email: orderData.email,
        billingAddress: orderData.billing,
        shippingAddress: orderData.shipping,
        pointsRedeemed: orderData.pointsRedeemed, // Include pointsRedeemed
        paymentMethod: orderData.paymentMethod,
      };

      const response = await axios.post(`${API_BASE_URL}/orders`, order, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      clearCart();

      if (orderData.paymentMethod === "online") {
        navigate(`/payment/${response.data.order._id}`, {
          state: {
            orderID: response.data.order._id,
            amount: response.data.order.totalAmount,
            userEmail: orderData.email,
          },
        });
      } else if (orderData.paymentMethod === "bank_transfer") {
        navigate(`/bank-transfer/${response.data.order._id}`, {
          state: {
            orderID: response.data.order._id,
            amount: response.data.order.totalAmount,
            userEmail: orderData.email,
          },
        });
      } else {
        // COD: generate PDF + redirect
        await generatePdf(
          response.data.order, // Use the order data from the response
          {
            paymentID: "COD-" + Date.now(),
            transactionID: "TXN-" + Date.now(),
            amount: response.data.order.totalAmount,
            status: "Pending",
          },
          orderData.email
        );

        navigate("/success", {
          state: {
            orderId: response.data.order._id,
            paymentMethod: orderData.paymentMethod,
          },
        });
      }

      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutForm onPlaceOrder={handlePlaceOrder} userData={user} isProcessing={isProcessing} />
    </div>
  );
};

export default CheckoutPage;