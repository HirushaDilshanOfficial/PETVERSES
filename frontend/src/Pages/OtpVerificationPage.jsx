// src/pages/OtpVerificationPage.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DELIVERY_FEE = 300;

// Define header color (blue)
const headerColor = [30, 64, 175]; // RGB for #1E40AF

// Function to add header to PDF
const addHeader = (doc, logoBase64, pageNumber) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header background
  doc.setFillColor(30, 64, 175); // Blue background
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Add logo
  if (logoBase64) {
    doc.addImage(logoBase64, "JPEG", 15, 8, 24, 24);
  }

  // Company name and title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PETVERSE", 45, 18);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Payments Report", 45, 26);

  // Contact info
  doc.setFontSize(8);
  doc.text("New Kandy Road, Malabe • Tel: 091-2345675", 45, 32);
  doc.text("www.petverse.com • mailtopetverse@gmail.com", 45, 36);

  // Generated date (right aligned)
  const currentDate = new Date();
  const dateString = `Generated on: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;
  doc.setFontSize(8);
  const dateWidth = doc.getTextWidth(dateString);
  doc.text(dateString, pageWidth - dateWidth - 15, 32);

  // Page number (right aligned)
  const pageText = `Page ${pageNumber}`;
  const pageTextWidth = doc.getTextWidth(pageText);
  doc.text(pageText, pageWidth - pageTextWidth - 15, 36);
  
  // Reset text color back to black for content
  doc.setTextColor(0, 0, 0);
};

// Function to add footer
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

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderID, amount, userEmail, paymentData } = location.state || {};
  
  // Use environment variable for API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(300); // 5 minutes countdown
  const [resendDisabled, setResendDisabled] = useState(true);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setResendDisabled(false);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getImageBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Important for same-origin images
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/jpeg");
      resolve(dataURL);
    };
    img.onerror = function () {
      reject(new Error("Failed to load image at " + url));
    };
    img.src = url;
  });
};

  //  Generate PDF Invoice with Payment Details
  const generatePdf = async (order, payment) => {
    try {
      const doc = new jsPDF();

      //Load logo image from public folder
      const logoBase64 = await getImageBase64("/images/lol.jpeg");

      // Add header on first page
      addHeader(doc, logoBase64, 1);

      // Add content starting after header (y=45)
      // Customer info
      doc.setFontSize(14);
      doc.setTextColor("#1E40AF");
      doc.text("Customer Details:", 14, 55);
      doc.setFontSize(12);
      doc.setTextColor(0);
        
        // Add safety checks for address data
        const billingAddress = order.billingAddress || {};
        const shippingAddress = order.shippingAddress || {};
        
        doc.text(`Email: ${userEmail || 'N/A'}`, 14, 62);
        doc.text(
          `Billing: ${billingAddress.fullName || ''}, ${billingAddress.street || ''}, ${billingAddress.city || ''}`,
          14,
          69
        );
        doc.text(
          `Shipping: ${shippingAddress.fullName || ''}, ${shippingAddress.street || ''}, ${shippingAddress.city || ''}`,
          14,
          76
        );

        // Payment info
        doc.setFontSize(14);
        doc.setTextColor("#1E40AF");
        doc.text("Payment Details:", 14, 89);
        doc.setFontSize(12);
        doc.setTextColor(0);
        
        // Get loyalty points discount information
        const pointsRedeemed = order.pointsRedeemed || 0;
        const POINT_VALUE_LKR = 10; // 1 point = Rs.10
        const discountAmount = pointsRedeemed * POINT_VALUE_LKR;
        const subtotal = order.subtotal || 0;
        const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
        const finalTotal = totalAfterDiscount + DELIVERY_FEE;
        
        // Ensure proper calculation
        const calculatedTotal = subtotal + DELIVERY_FEE - discountAmount;
        
        // Payment details
        doc.text(`Payment ID: ${payment?.paymentID || 'N/A'}`, 14, 96);
        doc.text(`Transaction ID: ${payment?.transactionID || 'N/A'}`, 14, 103);
        doc.text(`Payment Method: ${order.paymentMethod || 'Online Payment'}`, 14, 110);
        doc.text(`Payment Status: ${payment?.status || 'Success'}`, 14, 117);
        
        // Add detailed pricing breakdown
        doc.setFontSize(12);
        doc.setTextColor("#1E40AF");
        doc.text("Order Summary:", 14, 124);
        
        doc.setTextColor(0);
        doc.text(`Subtotal: Rs.${subtotal.toFixed(2)}`, 14, 131);
        
        // Show discount only if points were redeemed
        if (pointsRedeemed > 0) {
          doc.text(`Loyalty Points Discount: -Rs.${discountAmount.toFixed(2)} (${pointsRedeemed} points)`, 14, 138);
          doc.text(`Subtotal after discount: Rs.${totalAfterDiscount.toFixed(2)}`, 14, 145);
          doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 152);
          doc.text(`Total Amount: Rs.${finalTotal.toFixed(2)}`, 14, 159);
          // Update startY for table based on whether points were redeemed
          var tableStartY = 166;
        } else {
          doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 138);
          doc.text(`Total Amount: Rs.${(subtotal + DELIVERY_FEE).toFixed(2)}`, 14, 145);
          // Update startY for table based on whether points were redeemed
          var tableStartY = 152;
        }

        // Table of items
        const tableColumn = ["Product", "Quantity", "Price", "Total"];
        const tableRows = [];

        // Add safety check for items array
        const items = Array.isArray(order.items) ? order.items : [];
        
        items.forEach((item) => {
          // Calculate total price (quantity × unit price)
          const quantity = item.pQuantity || 0;
          const unitPrice = item.pPrice || 0;
          // Calculate total price as quantity × unit price
          const totalPrice = quantity * unitPrice;
          
          const row = [
            item.name || 'Unknown Product',
            quantity,
            `Rs.${unitPrice.toFixed(2)}`,
            `Rs.${totalPrice.toFixed(2)}`, // Total Price = Quantity × Unit Price
          ];
          tableRows.push(row);
        });

        // Use autoTable correctly
       autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: tableStartY,
        theme: "grid",
        headStyles: { fillColor: "#1E40AF", textColor: 255 },
        alternateRowStyles: { fillColor: "#F3F4F6" },
        margin: { top: 40 }, // Make sure table doesn't overlap header
        didDrawPage: (data) => {
          // Add header & footer on every page (including multi-page tables)
          addHeader(doc, logoBase64, doc.internal.getNumberOfPages());
          addFooter(doc);
        },
      });

      // Footer text under the table
      const finalY = doc.lastAutoTable.finalY || 200;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(
        "Thank you for your purchase!",
        105,
        finalY + 20,
        { align: "center" }
      );

      addFooter(doc);
        // Save the PDF instead of opening in new tab
        doc.save(`payment_receipt_${payment?.paymentID || order._id}.pdf`);
      } catch (error) {
        console.error("Error in PDF generation:", error);
        throw error; // Re-throw to be caught by the caller
      }
    };

  //  Handle OTP Verification 
  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setMessage("");
      const token = await getAuth().currentUser.getIdToken();

      console.log("=== OTP Verification Debug Info ===");
      console.log("userEmail:", userEmail);
      console.log("otp:", otp);

      // First verify OTP using the server endpoint
      const otpRes = await axios.post(
        `${API_BASE_URL}/otp/verify-otp`,
        { 
          resourceType: "order",
          resourceID: orderID,
          otp: otp
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("OTP verification response:", otpRes.data);

      // Get the verified order ID
      const verifiedOrderID = otpRes.data.resourceID;
      
      console.log("Verified order ID:", verifiedOrderID);
      
      // Fetch the order details
      const orderRes = await axios.get(`${API_BASE_URL}/orders/${verifiedOrderID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const order = orderRes.data.order;
      
      console.log("Order details:", order);

      await generatePdf(order, paymentData);

      // Navigate to success page with order and payment data
      navigate("/success", { 
        state: { 
          order,
          userEmail,
          paymentData: { 
            paymentID: otpRes.data.paymentID || "DEMO-" + Date.now(),
            transactionID: "TXN-" + Date.now(),
            amount: order.totalAmount,
            status: "success",
            paidAt: new Date()
          }
        } 
      });
    } catch (err) {
      console.error("OTP verification error:", err);
      setMessage(err.response?.data?.message || "OTP verification failed.");
    }
  };

  // ] Handle Resend OTP 
  const handleResend = async () => {
    try {
      setMessage("");
      const token = await getAuth().currentUser.getIdToken();

      await axios.post(
        `${API_BASE_URL}/otp/resend-otp`,
        { 
          resourceType: "order",
          resourceID: orderID,
          email: userEmail
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimer(300);
      setResendDisabled(true);
      setMessage("A new OTP has been sent to your email.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">OTP Verification</h2>
        <p className="mb-2">
          Enter the OTP sent to your email: <b>{userEmail}</b>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full border rounded-lg p-2 bg-white"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Verify
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {resendDisabled ? (
            <p>Resend OTP in {formatTime(timer)}</p>
          ) : (
            <button
              onClick={handleResend}
              className="text-blue-600 font-semibold hover:underline"
            >
              Resend OTP
            </button>
          )}
        </div>

        {message && <p className="mt-3 text-red-600 text-center">{message}</p>}
      </div>
    </div>
  );
};

export default OtpVerificationPage;