import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import axios from "axios";
import { getAuth } from "firebase/auth";
import PaymentForm from "../components/PaymentForm";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, appointmentId } = useParams(); // Get orderId or appointmentId from URL params
  const locationState = location.state || {};
  
  // Get data from either location.state or URL params
  const orderID = locationState.orderID || orderId;
  const appointmentID = locationState.appointmentId || appointmentId;
  const amount = locationState.amount || locationState.packagePrice; // Use packagePrice if available
  const userEmail = locationState.userEmail || locationState.userEmail;
  const service = locationState.service || 'Pet Service';
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Debug logging to see what data we're receiving
  console.log("PaymentPage - orderID:", orderID);
  console.log("PaymentPage - appointmentID:", appointmentID);
  console.log("PaymentPage - amount:", amount);
  console.log("PaymentPage - userEmail:", userEmail);
  console.log("PaymentPage - service:", service);
  console.log("PaymentPage - location.state:", location.state);

  const handlePay = async ({ rememberPayment }) => {
    try {
      setLoading(true);

      console.log("orderdata");

      // Prepare payment data
      let paymentData;
      
      if (appointmentID) {
        // For appointment payments
        paymentData = {
          appointmentID,
          amount,
          paymentType: "card",
          referenceId: "APPT-" + Date.now(),
          cardDetails: formData,
          service: service
        };
      } else {
        // For order payments
        paymentData = {
          orderID,
          amount,
          paymentType: "card",
          referenceId: "DEMO-" + Date.now(),
          cardDetails: formData
        };
      }

      console.log("Sending payment data:", paymentData);

      // Call backend to save payment
      const response = await axios.post(
        "http://localhost:5003/api/payments/demo/pay",
        paymentData
      );

      console.log("Payment response:", response.data);

      setMessage(response.data.message);

      // Check if payment was successful
      if (response.data.status === "success") {
        // Send OTP after successful payment
        const token = await getAuth().currentUser.getIdToken();
        
        // Make sure we have the required data
        const resourceId = appointmentID || orderID;
        const resourceEmail = userEmail;
        
        if (!resourceId || !resourceEmail) {
          throw new Error("Missing resource ID or email");
        }
        
        // Navigate to OTP verification with payment data
        navigate("/otp-verification", { 
          state: { 
            orderID: resourceId, 
            amount, 
            userEmail: resourceEmail,
            paymentData: response.data.payment // Pass payment data for PDF generation
          } 
        });
      } else {
        // Payment failed
        setMessage("Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage(err.response?.data?.message || err.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  // If we don't have the required data, show an error message
  if ((!orderID && !appointmentID) || (!amount && amount !== 0) || !userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Missing Payment Information</h2>
          <p className="text-gray-700 mb-4">
            Required payment information is missing. Please go back and try again.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#1E40AF] text-white px-4 py-2 rounded hover:bg-[#1E3A8A]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <PaymentForm
          amount={amount}
          formData={formData}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
          onPay={handlePay}
          loading={loading}
          message={message}
          userEmail={userEmail} // Pass userEmail as prop
          orderID={orderID} // Pass orderID as prop
          appointmentID={appointmentID} // Pass appointmentID as prop
        />
      </div>
    </div>
  );
};

export default PaymentPage;