import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import AdPaymentForm from "./AdPaymentForm"; // Use AdPaymentForm instead of PaymentForm
import { useAuth } from "../contexts/AuthContext";

const AdPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { adId, title, amount, duration } = location.state || {};
  
  const [formData, setFormData] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    rememberCard: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Redirect if no ad data
  useEffect(() => {
    if (!adId || !title || !amount) {
      toast.error("Invalid payment request");
      navigate("/dashboard/service-provider/advertisements");
    }
  }, [adId, title, amount, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePayment = async (paymentData) => {
    setLoading(true);
    setMessage("");
    
    try {
      console.log("Processing advertisement payment:", paymentData);
      
      // Create payment for advertisement
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/payments/advertisement`,
        {
          adId,
          amount: parseFloat(amount),
          paymentType: "card",
          referenceId: paymentData.transactionID,
          paymentID: paymentData.paymentID, // Pass the payment ID from OTP verification
        }
      );
      
      console.log("Payment response:", response.data);
      
      if (response.data.success) {
        toast.success("Payment successful!");
        // Small delay to allow toast to be seen before redirecting
        setTimeout(() => {
          // Redirect to advertisements page with success message
          navigate("/dashboard/service-provider/advertisements", {
            state: { paymentSuccess: true, adTitle: title }
          });
        }, 1500);
      } else {
        throw new Error(response.data.message || "Payment failed");
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Payment failed";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!adId || !title || !amount) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#1E40AF] text-white p-6">
            <h1 className="text-2xl font-bold">Advertisement Payment</h1>
            <p className="text-blue-100 mt-1">
              Complete payment for your advertisement
            </p>
          </div>
          
          <div className="p-6">
            {/* Ad Details */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Advertisement Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-medium">{title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{duration} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-bold text-lg text-[#1E40AF]">Rs {amount}</p>
                </div>
              </div>
            </div>
            
            {/* Payment Form */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h2>
              <AdPaymentForm // Use AdPaymentForm instead of PaymentForm
                amount={amount}
                formData={formData}
                onChange={handleInputChange}
                onPay={handlePayment}
                loading={loading}
                message={message}
                adId={adId} // Pass adId for OTP purposes
                userEmail={user?.email} // Pass user email for OTP purposes
              />
            </div>
            
            {/* Back Button */}
            <div className="mt-6">
              <button
                onClick={() => navigate("/dashboard/service-provider/advertisements")}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back to Advertisements
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdPaymentPage;