import { useState } from "react";
import axios from "axios";
import { getAuth } from "firebase/auth";

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

const validateOTP = (otp) => {
  // Only allow exactly 6 digits
  return /^\d{6}$/.test(otp);
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

const AdPaymentForm = (props) => {
  const { amount, formData, onChange, onPay, loading, message: parentMessage, adId, userEmail } = props;
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(parentMessage || "");
  const [isProcessing, setIsProcessing] = useState(loading || false);

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

  // Validate form before sending OTP
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nameOnCard?.trim()) {
      newErrors.nameOnCard = "Cardholder name is required";
    } else if (!validateCardName(formData.nameOnCard)) {
      newErrors.nameOnCard = "Cardholder name can only contain letters";
    }

    if (!formData.cardNumber?.trim()) {
      newErrors.cardNumber = "Card number is required";
    } else if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = "Card number must be between 12-16 digits";
    }

    if (!formData.expiry) {
      newErrors.expiry = "Expiry date is required";
    } else if (!validateExpiryDate(formData.expiry)) {
      newErrors.expiry = "Please select a future expiry date";
    }

    if (!formData.cvv?.trim()) {
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
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage("Please fix the validation errors before proceeding");
      return;
    }

    setIsProcessing(true);
    setMessage("");
    
    try {
      // Make sure both adId and userEmail are provided
      if (!adId || !userEmail) {
        throw new Error("Missing advertisement ID or user email");
      }
      
      const token = await getAuth().currentUser.getIdToken();
      
      const response = await axios.post(`${API_BASE_URL}/otp/send-otp`, {
        resourceType: "advertisement",
        resourceID: adId,
        email: userEmail,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOtpSent(true);
      setMessage(response.data.message || "OTP sent to your email.");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to send OTP.";
      setMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Verify OTP and automatically complete payment
  const handleVerifyOTP = async () => {
    if (!validateOTPForm()) {
      setMessage("Please enter a valid 6-digit OTP");
      return;
    }

    setIsProcessing(true);
    setMessage("");
    
    try {
      const token = await getAuth().currentUser.getIdToken();
      
      console.log("Verifying OTP for advertisement:", { resourceType: "advertisement", resourceID: adId, otp });
      
      // Verify OTP
      const res = await axios.post(
        `${API_BASE_URL}/otp/verify-otp`,
        {
          resourceType: "advertisement",
          resourceID: adId,
          otp: otp
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log("OTP verification response:", res.data);
      
      // If OTP is verified, automatically complete the payment
      if (res.data.success && res.data.paymentID) {
        // Generate a transaction ID for the payment
        const transactionID = "TXN-AD-" + Date.now() + Math.floor(Math.random() * 1000);
        
        // Automatically complete payment with the payment ID from OTP verification
        await onPay({ transactionID, paymentID: res.data.paymentID });
      } else {
        throw new Error(res.data.message || "OTP verification failed");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "OTP verification failed";
      console.error("OTP verification error:", errorMsg);
      setMessage(errorMsg);
      setIsProcessing(false);
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
        <form className="space-y-4" onSubmit={handleSendOTP}>
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
            disabled={isProcessing}
            className="w-full bg-[#1E40AF] text-white py-3 rounded-xl font-semibold hover:bg-[#1E3A8A] transition disabled:opacity-50"
          >
            {isProcessing ? "Sending OTP..." : "Proceed to Payment"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-2">Enter the 6-digit OTP sent to your email</p>
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
            type="button" 
            onClick={handleVerifyOTP}
            disabled={isProcessing}
            className="w-full bg-[#1E40AF] text-white py-3 rounded-xl font-semibold hover:bg-[#1E3A8A] transition disabled:opacity-50"
          >
            {isProcessing ? "Processing Payment..." : "Pay"}
          </button>
          
          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="w-full text-gray-600 hover:text-gray-800 font-medium mt-2"
          >
            ← Back to Card Details
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

export default AdPaymentForm;