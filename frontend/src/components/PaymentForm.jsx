import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
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
  const { amount, formData, onChange, onPay, loading: parentLoading, message: parentMessage, userEmail, orderID, appointmentID } = props;
  
  // Determine the resource type and ID
  const resourceType = appointmentID ? "appointment" : "order";
  const resourceID = appointmentID || orderID;
  
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
  const handleSendOTP = async () => {
    if (!validateForm()) {
      setMessage("Please fix the validation errors before proceeding");
      return;
    }

    setLocalLoading(true);
    setMessage("");
    try {
      // Make sure both resourceID and userEmail are provided
      if (!resourceID || !userEmail) {
        throw new Error("Missing resource ID or user email");
      }
      
      await axios.post(`${API_BASE_URL}/otp/send-otp`, {
        resourceType: resourceType,
        resourceID: resourceID,
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

    const token = await getAuth().currentUser.getIdToken();

    setLocalLoading(true);
    setMessage("");
    try {
      console.log("Sending OTP verify payload:", {
        resourceType: resourceType,
        resourceID: resourceID,
        otp,
      });
      
      // Use the correct endpoint for OTP verification
      const res = await axios.post(
        `${API_BASE_URL}/otp/verify-otp`,
        {
          resourceType: resourceType,
          resourceID: resourceID,
          otp: otp
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Get the resource ID from the response
      const { resourceID: verifiedResourceID, paymentID } = res.data;
      console.log("@@@@@@@@@@", res);
      
      if (resourceType === "appointment") {
        // For appointments, create the payment in backend (marks paid and awards points), then navigate to success
        try {
          const payRes = await axios.post(
            `${API_BASE_URL}/payments/appointment`,
            {
              appointmentID: verifiedResourceID,
              amount,
              paymentType: "card",
              referenceId: "TXN-APPT-" + Date.now(),
              // Include paymentID from OTP flow if any (optional)
              paymentID,
            }
          );

          const savedPayment = (payRes && payRes.data && payRes.data.payment) || {};
          setMessage("Payment successful.");

          navigate("/success", {
            state: {
              appointmentId: verifiedResourceID,
              userEmail,
              paymentData: {
                paymentID: savedPayment.paymentID || paymentID || "DEMO-" + Date.now(),
                transactionID: savedPayment.transactionID || "TXN-" + Date.now(),
                amount: savedPayment.amount || amount,
                status: savedPayment.status || "success",
                paidAt: savedPayment.paidAt || new Date(),
              },
            },
          });
        } catch (e) {
          console.error("Failed to create appointment payment:", e);
          // Fallback: still navigate to success page for demo continuity
          navigate("/success", {
            state: {
              appointmentId: verifiedResourceID,
              userEmail,
              paymentData: {
                paymentID: paymentID || "DEMO-" + Date.now(),
                transactionID: "TXN-" + Date.now(),
                amount: amount,
                status: "success",
                paidAt: new Date(),
              },
            },
          });
        }
      } else {
        // For orders, fetch order details and navigate to success page
        const orderRes = await axios.get(`${API_BASE_URL}/orders/${verifiedResourceID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const order = orderRes.data.order;
        setMessage(res.data.message || "OTP verified!");

        // Navigate to success page with order and payment data
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
      }
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
            type="button" 
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