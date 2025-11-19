import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";
import axios from "axios";
import toast from "react-hot-toast";

const BankTransferPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankDetails] = useState({
    bankName: "PETVERSE Bank",
    accountName: "PETVERSE Pvt Ltd",
    accountNumber: "1234567890",
    branch: "Colombo Branch"
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          toast.error("Invalid order");
          navigate("/cart");
          return;
        }

        const auth = getAuth(app);
        const token = await auth.currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setOrder(response.data.order);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
        navigate("/cart");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    }
  }, [orderId, user, navigate]);

  const handlePaymentConfirmation = async () => {
    try {
      const auth = getAuth(app);
      const token = await auth.currentUser.getIdToken();
      
      // Update order status to indicate bank transfer initiated
      await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/bank-transfer`,
        {
          paymentMethod: "bank_transfer",
          bankDetails: bankDetails
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Navigate to success page
      navigate("/success", {
        state: {
          order: order,
          userEmail: user.email,
          paymentData: {
            paymentID: `BT-${orderId}`,
            transactionID: `BT-${orderId}-${Date.now()}`,
            status: "pending",
            paidAt: new Date().toISOString()
          }
        }
      });
      
      toast.success("Bank transfer initiated. Please complete the transfer within 24 hours.");
    } catch (error) {
      console.error("Error initiating bank transfer:", error);
      toast.error("Failed to initiate bank transfer. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <button 
            onClick={() => navigate("/cart")}
            className="bg-[#1E40AF] text-white px-6 py-2 rounded hover:bg-[#1E3A8A]"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  // Calculate total amount
  const subtotal = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = 300;
  const totalAmount = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#1E40AF] mb-2">Bank Transfer Payment</h1>
          <p className="text-gray-600">Order ID: {order._id}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>Rs.{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Delivery Fee:</span>
                  <span>Rs.{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4">
                  <span>Total:</span>
                  <span>Rs.{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Transfer Instructions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Bank Transfer Details</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Bank Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Bank:</span> {bankDetails.bankName}</p>
                  <p><span className="font-medium">Account Name:</span> {bankDetails.accountName}</p>
                  <p><span className="font-medium">Account Number:</span> {bankDetails.accountNumber}</p>
                  <p><span className="font-medium">Branch:</span> {bankDetails.branch}</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Transfer the total amount to the bank account above</li>
                  <li>Include your Order ID ({order._id}) in the transfer description</li>
                  <li>Upload the transfer receipt in your dashboard</li>
                  <li>Your order will be processed after payment confirmation</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 text-yellow-800">Important</h3>
                <p className="text-yellow-700">
                  Please complete the transfer within 24 hours. Orders not paid within this time will be cancelled.
                </p>
              </div>
              
              <button
                onClick={handlePaymentConfirmation}
                className="w-full bg-[#1E40AF] text-white py-3 rounded-xl font-semibold hover:bg-[#1E3A8A] transition mt-4"
              >
                I Have Completed the Transfer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransferPage;