import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

// Validation functions
const validateCardName = (name) => {
  // Only allow letters and spaces
  return /^[a-zA-Z\s]*$/.test(name);
};

const validateCardNumber = (number) => {
  // Only allow digits and between 12-16 digits
  return /^\d{12,16}$/.test(number);
};

// Updated validation function for date picker
const validateExpiryDate = (expiry) => {
  // For date picker, we receive a date string in YYYY-MM-DD format
  if (!expiry) return false;
  
  const selectedDate = new Date(expiry);
  const today = new Date();
  
  // Reset time part for comparison
  selectedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Check if selected date is in the future
  return selectedDate >= today;
};

const validateCVV = (cvv) => {
  // Only allow exactly 3 digits
  return /^\d{3}$/.test(cvv);
};

const validateOTP = (otp) => {
  // Only allow exactly 6 digits
  return /^\d{6}$/.test(otp);
};

const PaymentForm = (props) => {
  const { amount, formData, onChange, onPay, loading: parentLoading, message: parentMessage, userEmail, orderID } = props;
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(parentMessage || ""); // Add local message state
  const [localLoading, setLocalLoading] = useState(parentLoading || false); // Add local loading state

  const navigate = useNavigate();

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let filteredValue = value;

    // Apply validation based on field type
    switch (name) {
      case "nameOnCard":
        // Only allow letters and spaces
        if (!validateCardName(value)) return;
        break;
      case "cardNumber":
        // Only allow digits and limit to 16 characters
        filteredValue = value.replace(/\D/g, "").slice(0, 16);
        break;
      case "cvv":
        // Only allow digits and limit to 3 characters
        filteredValue = value.replace(/\D/g, "").slice(0, 3);
        break;
    }

    // Use the onChange prop to update formData
    onChange({
      target: {
        name,
        value: type === "checkbox" ? checked : filteredValue,
      },
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 6 characters
    const filteredValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(filteredValue);
    
    // Clear error for OTP field when user starts typing
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: "" }));
    }
  };

  //  Load logo from public folder as data URL 
  const loadImageAsDataUrl = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.onerror = () => {
        // Resolve with null if image fails to load
        resolve(null);
      };
    });
  };

  //  Generate PDF Invoice 
  const generatePdf = async (order) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let logoDataUrl = null; // Define logoDataUrl in the correct scope

      try {
        // Load logo
        logoDataUrl = await loadImageAsDataUrl("/images/lol.jpeg");
      } catch (err) {
        console.warn("Failed to load logo, continuing without it:", err);
      }

      // Header function
      const addHeader = (doc, pageNumber = 1) => {
        // Header background
        doc.setFillColor(30, 64, 175); // Blue background
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Add logo if available
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "JPEG", 15, 8, 25, 25); // x, y, width, height
        }
        
        // Company name and title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PETVERSE", 45, 18);

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Invoice", 45, 26);

        // Contact info
        doc.setFontSize(8);
        doc.text("New Kandy Road, Malabe • Tel: 0912345673", 45, 32);
        doc.text("www.petverse.com • hello@petverse.com", 45, 36);

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
      };

      // Footer function
      const addFooter = (doc) => {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont("helvetica", "normal");
        const footerText = "©️ 2025 PETVERSE. All rights reserved.";
        const footerWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
      };

      // Add header and footer to first page
      addHeader(doc);
      addFooter(doc);

      // Customer info
      doc.setFontSize(14);
      doc.setTextColor("#1E40AF");
      doc.text("Customer Details:", 14, 60);
      doc.setFontSize(12);
      doc.setTextColor(0);
      
      // Add safety checks for address data
      const billingAddress = order.billingAddress || {};
      const shippingAddress = order.shippingAddress || {};
      
      doc.text(`Email: ${userEmail || 'N/A'}`, 14, 67);
      doc.text(
        `Billing: ${billingAddress.fullName || ''}, ${billingAddress.street || ''}, ${billingAddress.city || ''}`,
        14,
        74
      );
      doc.text(
        `Shipping: ${shippingAddress.fullName || ''}, ${shippingAddress.street || ''}, ${shippingAddress.city || ''}`,
        14,
        81
      );

      // Payment info
      doc.setFontSize(14);
      doc.setTextColor("#1E40AF");
      doc.text("Payment Details:", 14, 94);
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 14, 101);
      doc.text(`Payment Status: ${order.paymentStatus || 'N/A'}`, 14, 108);
      
      // Get loyalty points discount information
      const pointsRedeemed = order.pointsRedeemed || 0;
      const POINT_VALUE_LKR = 10; // 1 point = Rs.10
      const discountAmount = pointsRedeemed * POINT_VALUE_LKR;
      const subtotal = order.subtotal || 0;
      const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
      const finalTotal = totalAfterDiscount + DELIVERY_FEE;
      
      // Add detailed pricing breakdown before the table
      doc.setFontSize(12);
      doc.setTextColor("#1E40AF");
      doc.text("Order Summary:", 14, 115);
      
      doc.setTextColor(0);
      doc.text(`Subtotal: Rs.${subtotal.toFixed(2)}`, 14, 122);
      
      // Show discount only if points were redeemed
      if (pointsRedeemed > 0) {
        doc.text(`Loyalty Points Discount: -Rs.${discountAmount.toFixed(2)} (${pointsRedeemed} points)`, 14, 129);
        doc.text(`Subtotal after discount: Rs.${totalAfterDiscount.toFixed(2)}`, 14, 136);
        doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 143);
        doc.text(`Total Amount: Rs.${finalTotal.toFixed(2)}`, 14, 150);
      } else {
        doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 129);
        doc.text(`Total Amount: Rs.${(subtotal + DELIVERY_FEE).toFixed(2)}`, 14, 136);
      }

      // Table of items with enhanced column headers
      const tableColumn = ["Product Name", "Quantity", "Unit Price", "Total Price"];
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

      // Use autoTable with enhanced styling
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: pointsRedeemed > 0 ? 157 : 143,
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
        didDrawPage: function(data) {
          // Add header and footer to each page
          if (data.pageNumber > 1) {
            addHeader(doc, data.pageNumber);
          }
          addFooter(doc);
        }
      });

      // Footer
      doc.setFontSize(12);
      doc.setTextColor(0);
      const finalY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : 143;
      doc.text(
        "Thank you for your purchase!",
        105,
        finalY + 20,
        { align: "center" }
      );

      // Save the PDF with better error handling
      try {
        doc.save(`invoice_${order._id}.pdf`);
        console.log("Invoice downloaded successfully");
      } catch (saveError) {
        console.error("Error saving PDF:", saveError);
        // Fallback: open PDF in new tab
        try {
          const pdfBlob = doc.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          console.log("Invoice opened in new tab");
        } catch (fallbackError) {
          console.error("Error opening PDF in new tab:", fallbackError);
          alert("Unable to download or open the invoice. Please check your browser settings and try again.");
        }
      }
    } catch (error) {
      console.error("Error in PDF generation:", error);
      alert("Error generating invoice. Please try again.");
      throw error; // Re-throw to be caught by the caller
    }
  };

  // Validate form before sending OTP
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nameOnCard.trim()) {
      newErrors.nameOnCard = "Cardholder name is required";
    } else if (!validateCardName(formData.nameOnCard)) {
      newErrors.nameOnCard = "Cardholder name can only contain letters";
    }

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = "Card number is required";
    } else if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = "Card number must be between 12-16 digits";
    }

    if (!formData.expiry) {
      newErrors.expiry = "Expiry date is required";
    } else if (!validateExpiryDate(formData.expiry)) {
      newErrors.expiry = "Please select a future expiry date";
    }

    if (!formData.cvv.trim()) {
      newErrors.cvv = "CVV is required";
    } else if (!validateCVV(formData.cvv)) {
      newErrors.cvv = "CVV must be exactly 3 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTPForm = () => {
    const newErrors = {};

    if (!otp.trim()) {
      newErrors.otp = "OTP is required";
    } else if (!validateOTP(otp)) {
      newErrors.otp = "OTP must be exactly 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!validateForm()) {
      setMessage("Please fix the validation errors before proceeding");
      return;
    }

    setLocalLoading(true);
    setMessage("");
    try {
      // Make sure both orderID and userEmail are provided
      if (!orderID || !userEmail) {
        throw new Error("Missing order ID or user email");
      }
      
      await axios.post(`${API_BASE_URL}/otp/send-otp`, {
        resourceType: "order",
        resourceID: orderID,
        email: userEmail,
      });
      setOtpSent(true);
      setMessage("OTP sent to your email.");
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Failed to send OTP.");
    } finally {
      setLocalLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!validateOTPForm()) {
      setMessage("Please enter a valid 6-digit OTP");
      return;
    }

    setLocalLoading(true);
    setMessage("");
    try {
      // Use the correct endpoint for OTP verification
      const token = await getAuth().currentUser.getIdToken();
      const res = await axios.post(`${API_BASE_URL}/otp/verify-otp`, {
        resourceType: "order",
        resourceID: orderID,
        otp,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get the order ID and payment ID from the response
      const { resourceID: verifiedOrderID, paymentID } = res.data;
      
      // Fetch the order details
      const orderRes = await axios.get(`${API_BASE_URL}/orders/${verifiedOrderID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const order = orderRes.data.order;
      setMessage(res.data.message || "OTP verified!");
      
      // Navigate to success page with order and actual payment data
      navigate("/success", { 
        state: { 
          order,
          userEmail,
          paymentData: { 
            paymentID: paymentID || "DEMO-" + Date.now(),
            transactionID: "TXN-" + Date.now(),
            amount: order.totalAmount,
            status: "success",
            paidAt: new Date()
          }
        } 
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLocalLoading(false);
    }
  };

  // Format date for display (convert YYYY-MM-DD to MM/YY)
  const formatExpiryDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
  };

  // Get minimum date for date picker (today)
  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold text-gray-800">PETVERSE</h2>
      <p className="text-gray-500 text-sm">New Kandy Road, Malabe</p>

      <div className="my-4">
        <p className="text-2xl font-bold text-gray-900">Rs {amount}.00</p>
      </div>

      {!otpSent ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendOTP();
          }}
        >
          <div>
            <input
              type="text"
              name="nameOnCard"
              placeholder="Name on card"
              value={formData.nameOnCard || ""}
              onChange={handleInputChange}
              className={`w-full border-b p-2 outline-none ${errors.nameOnCard ? 'border-red-500' : ''}`}
              required
            />
            {errors.nameOnCard && <p className="text-red-500 text-xs mt-1">{errors.nameOnCard}</p>}
          </div>
          
          <div>
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={formData.cardNumber || ""}
              onChange={handleInputChange}
              className={`w-full border-b p-2 outline-none ${errors.cardNumber ? 'border-red-500' : ''}`}
              required
            />
            {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
          </div>
          
          <div className="flex gap-4">
            <div className="w-1/2">
              <input
                type="date"
                name="expiry"
                value={formData.expiry || ""}
                onChange={handleInputChange}
                min={getMinDate()}
                className={`w-full border-b p-2 outline-none ${errors.expiry ? 'border-red-500' : ''}`}
                required
              />
              {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
              <p className="text-xs text-gray-500 mt-1">Select expiry date</p>
            </div>
            
            <div className="w-1/2">
              <input
                type="password"
                name="cvv"
                placeholder="CVV"
                value={formData.cvv || ""}
                onChange={handleInputChange}
                className={`w-full border-b p-2 outline-none ${errors.cvv ? 'border-red-500' : ''}`}
                required
              />
              {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
            </div>
          </div>
          
          {formData.expiry && (
            <div className="text-sm text-gray-600">
              Card expires on: {formatExpiryDate(formData.expiry)}
            </div>
          )}
          
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              name="rememberCard"
              checked={formData.rememberCard || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-[#F97316] focus:ring-[#F97316]"
            />
            Remember my card
          </label>
          
          <button
            type="submit"
            disabled={localLoading}
            className="w-full bg-[#1E40AF] text-white py-3 rounded-xl font-semibold hover:bg-[#1E3A8A] transition disabled:opacity-50"
          >
            {localLoading ? "Sending OTP..." : "Pay"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={otp}
              placeholder="Enter OTP"
              onChange={handleOtpChange}
              className={`w-full border-b p-2 outline-none ${errors.otp ? 'border-red-500' : ''}`}
            />
            {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
          </div>
          
          <button
            onClick={handleVerifyOTP}
            disabled={localLoading}
            className="w-full bg-[#1E40AF] text-white py-3 rounded-xl font-semibold hover:bg-[#1E3A8A] transition disabled:opacity-50"
          >
            {localLoading ? "Verifying OTP..." : "Verify OTP"}
          </button>
        </div>
      )}

      {(message || parentMessage) && (
        <p className={`mt-4 text-center text-sm font-medium ${(message || parentMessage).includes('error') || (message || parentMessage).includes('failed') || (message || parentMessage).includes('Failed') ? 'text-red-500' : 'text-gray-700'}`}>
          {message || parentMessage}
        </p>
      )}
    </div>
  );
};

export default PaymentForm;