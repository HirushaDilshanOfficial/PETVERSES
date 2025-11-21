import { useEffect } from "react";

import { useLocation, useNavigate } from "react-router";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import axios from "axios";



const DELIVERY_FEE = 300;



const PaymentSuccess = () => {

  const location = useLocation();

  const navigate = useNavigate();

  const { order, appointmentId, userEmail, paymentData } = location.state || {};

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";



  //  Load logo from public folder as data URL 

  const loadImageAsDataUrl = (url) => {

    return new Promise((resolve) => {

      // Try fetch API first

      fetch(url)

        .then(response => {

          if (!response.ok) {

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

          }

          return response.blob();

        })

        .then(blob => {

          const reader = new FileReader();

          reader.onload = () => {

            console.log("Logo loaded successfully via fetch:", url);

            resolve(reader.result);

          };

          reader.onerror = () => {

            console.warn("Failed to read image blob:", url);

            resolve(null);

          };

          reader.readAsDataURL(blob);

        })

        .catch(fetchError => {

          console.warn("Failed to fetch image, falling back to Image approach:", url, fetchError);

          // Fallback to Image approach

          const img = new Image();

          img.crossOrigin = "Anonymous";

          img.onload = () => {

            try {

              const canvas = document.createElement("canvas");

              canvas.width = img.width;

              canvas.height = img.height;

              const ctx = canvas.getContext("2d");

              ctx.drawImage(img, 0, 0);

              const dataURL = canvas.toDataURL("image/jpeg");

              console.log("Logo loaded successfully via Image:", url, "Dimensions:", img.width, "x", img.height);

              resolve(dataURL);

            } catch (error) {

              console.warn("Error processing image:", url, error);

              resolve(null);

            }

          };

          img.onerror = (error) => {

            console.warn("Failed to load image via Image approach:", url, error);

            resolve(null);

          };

          try {

            img.src = url;

          } catch (error) {

            console.warn("Error setting image source:", url, error);

            resolve(null);

          }

        });

    });

  };



  //  Generate PDF Invoice for Order Payment

  const generateOrderPdf = async (order, payment) => {

    try {

      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();

      const pageHeight = doc.internal.pageSize.getHeight();

      let logoDataUrl = null; // Define logoDataUrl in the correct scope

      try {

        // Load logo from public folder - using the correct path

        // Try multiple paths to ensure compatibility

        const pathsToTry = [

          "/images/lol.jpeg",     // Standard path

          "/public/images/lol.jpeg", // Alternative path

          "./images/lol.jpeg",    // Relative path

          "../public/images/lol.jpeg" // Relative path from components

        ];

        for (const path of pathsToTry) {

          try {

            logoDataUrl = await loadImageAsDataUrl(path);

            if (logoDataUrl) {

              console.log("Logo loaded successfully from path:", path);

              break;

            }

          } catch (err) {

            console.warn("Failed to load logo from path:", path, err);

          }

        }

        if (!logoDataUrl) {

          console.warn("Failed to load logo from all attempted paths");

        }

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

        doc.text("Payment Receipt", 45, 26);

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

      

      // Payment details

      doc.text(`Payment ID: ${payment?.paymentID || 'N/A'}`, 14, 101);

      doc.text(`Transaction ID: ${payment?.transactionID || 'N/A'}`, 14, 108);

      doc.text(`Payment Method: ${order.paymentMethod || 'Online Payment'}`, 14, 115);

      doc.text(`Payment Status: ${payment?.status === 'success' ? 'Paid' : payment?.status || 'Success'}`, 14, 122);

      doc.text(`Payment Date: ${payment?.paidAt ? new Date(payment.paidAt).toLocaleString() : new Date().toLocaleString()}`, 14, 129);



      // Table of items with adjusted quantities and pricing

      const tableColumn = ["Product Name", "Quantity", "Unit Price", "Total Price"];

      const tableRows = [];



      // Add safety check for items array

      const itemsForTable = Array.isArray(order.items) ? order.items : [];

      

      // Process items for the table - fix the item structure handling

      for (const item of itemsForTable) {

        // Make sure we're accessing the correct properties

        const quantity = item.pQuantity !== undefined ? item.pQuantity : (item.quantity || 0);

        const unitPrice = item.pPrice !== undefined ? item.pPrice : (item.price || 0);

        // Calculate total price as quantity × unit price

        const totalPrice = quantity * unitPrice;

        

        // Use the correct product name property

        const productName = item.pName || item.name || 'Unknown Product';

        

        const row = [

          productName,

          quantity,

          `Rs.${unitPrice.toFixed(2)}`,

          `Rs.${totalPrice.toFixed(2)}`, // Total Price = Quantity × Unit Price

        ];

        tableRows.push(row);

      }

      

      // Calculate subtotal and total for PDF
      // Use the subtotal directly from the order object instead of calculating from items
      const subtotal = order.subtotal || 0;
      
      // Get loyalty points discount information

      const pointsRedeemed = order.pointsRedeemed || 0;

      const POINT_VALUE_LKR = 10; // 1 point = Rs.10

      const discountAmount = pointsRedeemed * POINT_VALUE_LKR;

      const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

      const finalTotal = totalAfterDiscount + DELIVERY_FEE;
      
      // Add detailed pricing breakdown before the table

      doc.setFontSize(12);

      doc.setTextColor("#1E40AF");

      doc.text("Order Summary:", 14, 136);
      
      doc.setTextColor(0);

      doc.text(`Subtotal: Rs.${subtotal.toFixed(2)}`, 14, 143);
      
      // Show discount only if points were redeemed

      if (pointsRedeemed > 0) {

        doc.text(`Loyalty Points Discount: -Rs.${discountAmount.toFixed(2)} (${pointsRedeemed} points)`, 14, 150);

        doc.text(`Subtotal after discount: Rs.${totalAfterDiscount.toFixed(2)}`, 14, 157);

        doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 164);

        doc.text(`Total Amount: Rs.${finalTotal.toFixed(2)}`, 14, 171);

      } else {

        doc.text(`Delivery Fee: Rs.${DELIVERY_FEE.toFixed(2)}`, 14, 150);

        doc.text(`Total Amount: Rs.${(subtotal + DELIVERY_FEE).toFixed(2)}`, 14, 157);

      }

      // Use autoTable with enhanced styling

      autoTable(doc, {

        head: [tableColumn],

        body: tableRows,

        startY: pointsRedeemed > 0 ? 178 : 164,

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

      const finalY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : 164;

      doc.text(

        "Thank you for your purchase!",

        105,

        finalY + 20,

        { align: "center" }

      );

      // Save the PDF with better error handling

      try {

        doc.save(`payment_receipt_${payment?.paymentID || order._id}.pdf`);

        console.log("Payment receipt downloaded successfully");

      } catch (saveError) {

        console.error("Error saving PDF:", saveError);

        // Fallback: open PDF in new tab

        try {

          const pdfBlob = doc.output('blob');

          const url = URL.createObjectURL(pdfBlob);

          window.open(url, '_blank');

          console.log("Payment receipt opened in new tab");

        } catch (fallbackError) {

          console.error("Error opening PDF in new tab:", fallbackError);

          alert("Unable to download or open the receipt. Please check your browser settings and try again.");

        }

      }

    } catch (error) {

      console.error("Error in PDF generation:", error);

      alert("Error generating receipt. Please try again.");

      throw error; // Re-throw to be caught by the caller

    }

  };



  //  Generate PDF Invoice for Appointment Payment

  const generateAppointmentPdf = async (appointmentId, payment) => {

    try {

      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();

      const pageHeight = doc.internal.pageSize.getHeight();
      
      let logoDataUrl = null;

      try {

        // Load logo from public folder - using the correct path

        // Try multiple paths to ensure compatibility

        const pathsToTry = [

          "/images/lol.jpeg",     // Standard path

          "/public/images/lol.jpeg", // Alternative path

          "./images/lol.jpeg",    // Relative path

          "../public/images/lol.jpeg" // Relative path from components

        ];

        for (const path of pathsToTry) {

          try {

            logoDataUrl = await loadImageAsDataUrl(path);

            if (logoDataUrl) {

              console.log("Logo loaded successfully from path:", path);

              break;

            }

          } catch (err) {

            console.warn("Failed to load logo from path:", path, err);

          }

        }

        if (!logoDataUrl) {

          console.warn("Failed to load logo from all attempted paths");

        }

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

        doc.text("Appointment Payment Receipt", 45, 26);

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
      
      doc.text(`Email: ${userEmail || 'N/A'}`, 14, 67);

      // Payment info

      doc.setFontSize(14);

      doc.setTextColor("#1E40AF");

      doc.text("Payment Details:", 14, 80);

      doc.setFontSize(12);

      doc.setTextColor(0);
      
      // Payment details

      doc.text(`Payment ID: ${payment?.paymentID || 'N/A'}`, 14, 87);

      doc.text(`Transaction ID: ${payment?.transactionID || 'N/A'}`, 14, 94);

      doc.text(`Payment Method: Online Payment`, 14, 101);

      doc.text(`Payment Status: ${payment?.status === 'success' ? 'Paid' : payment?.status || 'Success'}`, 14, 108);

      doc.text(`Payment Date: ${payment?.paidAt ? new Date(payment.paidAt).toLocaleString() : new Date().toLocaleString()}`, 14, 115);

      doc.text(`Amount: Rs.${payment?.amount || 0}`, 14, 122);

      // Fetch appointment details

      try {

        const response = await axios.get(`${API_BASE_URL}/appointments/${appointmentId}`);

        const appointment = response.data;
        
        if (appointment) {
          doc.setFontSize(14);
          doc.setTextColor("#1E40AF");
          doc.text("Appointment Details:", 14, 135);

          // Create table for appointment details
          const tableColumn = ["Field", "Value"];
          const tableRows = [
            ["Appointment ID", appointment._id],
            ["Pet Name", appointment.pet_name],
            ["Service", appointment.service_name || 'Pet Service'],
            ["Date", appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'],
            ["Time", appointment.time || 'N/A'],
            ["Package", appointment.package || 'N/A']
          ];

          // Use autoTable to generate the table
          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 142,
            theme: "grid",
            headStyles: { fillColor: "#1E40AF", textColor: 255 },
            alternateRowStyles: { fillColor: "#F3F4F6" },
            styles: { fontSize: 10 },
            columnStyles: {
              0: { cellWidth: 40 }, // Field column
              1: { cellWidth: 100 } // Value column
            }
          });
        }

      } catch (error) {

        console.error("Error fetching appointment details:", error);

      }

      // Footer

      doc.setFontSize(12);

      doc.setTextColor(0);
      
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;

      doc.text(

        "Thank you for your payment!",

        105,

        finalY,

        { align: "center" }

      );

      // Save the PDF instead of opening in new tab

      doc.save(`appointment_payment_receipt_${payment?.paymentID || appointmentId}.pdf`);

    } catch (error) {

      console.error("Error in PDF generation:", error);

      throw error; // Re-throw to be caught by the caller

    }

  };



  useEffect(() => {
    // If we have order and payment data, generate the PDF for order
    if (order && paymentData) {
      generateOrderPdf(order, paymentData)
        .then(() => {
          // Show success message without localhost notification
          console.log("Payment Successful! Receipt has been downloaded.");
        })
        .catch((error) => {
          console.error("Error generating receipt:", error);
          console.log("Payment successful, but there was an issue generating the receipt.");
        });
      
      // Auto-redirect to product display page after 2 seconds
      const redirectTimer = setTimeout(() => {
        navigate("/products");
      }, 2000);
      
      // Clean up timer on component unmount
      return () => clearTimeout(redirectTimer);
    } 
    // If we have appointmentId and payment data, generate the PDF for appointment
    else if (appointmentId && paymentData) {
      generateAppointmentPdf(appointmentId, paymentData)
        .then(() => {
          // Show success message without localhost notification
          console.log("Payment Successful! Receipt has been downloaded.");
        })
        .catch((error) => {
          console.error("Error generating receipt:", error);
          console.log("Payment successful, but there was an issue generating the receipt.");
        });
      
      // Auto-redirect to pet owner profile appointments page after 2 seconds
      const redirectTimer = setTimeout(() => {
        navigate("/dashboard/pet-owner/profile", { state: { openAppointments: true } });
      }, 2000);
      
      // Clean up timer on component unmount
      return () => clearTimeout(redirectTimer);
    } 
    else {
      // If no data, redirect to home
      navigate("/");
    }
  }, [order, appointmentId, paymentData, userEmail, navigate]);



  // Show appropriate success message based on payment type

  const isSuccessForOrder = order && paymentData;

  const isSuccessForAppointment = appointmentId && paymentData;



  if (!order && !appointmentId || !paymentData) {

    return (

      <div className="flex flex-col justify-center items-center min-h-screen bg-white">

        <h1 className="text-3xl font-bold text-red-600 mb-4">Invalid Request</h1>

        <p className="text-lg mb-6">Payment data not found.</p>

        <button 

          onClick={() => navigate("/")} 

          className="bg-[#1E40AF] text-white px-6 py-2 rounded hover:bg-[#1E3A8A]"

        >

          Back to Home

        </button>

      </div>

    );

  }



  return (

    <div className="flex flex-col justify-center items-center min-h-screen bg-white">

      <div className="text-center">

        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">

          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>

          </svg>

        </div>

        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>

        <p className="text-lg mb-2">Thank you for your payment.</p>

        <p className="text-md mb-6">A receipt has been downloaded to your device.</p>

        <p className="text-md mb-6">

          {isSuccessForOrder ? "Redirecting to products page..." : 
           isSuccessForAppointment ? "Redirecting to your appointments..." : 
           "Redirecting..."}

        </p>

      </div>

    </div>

  );

};



export default PaymentSuccess;