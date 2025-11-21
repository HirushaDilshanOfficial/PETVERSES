import React, { useState } from "react";
import axios from "axios";
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { getIdToken } from '../../utils/authUtils'; // Import getIdToken

const AnnouncementManagement = () => {
  const { user: currentUser } = useAuth(); // Get current user from context
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    recipientType: "all", // all, serviceProviders, customers
  });
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success or error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage("");
    setMessageType("");

    try {
      // Get Firebase ID token for authentication
      const token = await getIdToken();

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/announcements/send`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType("success");
        // Reset form
        setFormData({
          subject: "",
          message: "",
          recipientType: "all",
        });
      } else {
        setMessage(response.data.message || "Failed to send announcement");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      // Show more detailed error information
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.response?.statusText ||
                          "Failed to send announcement. Please try again.";
      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setIsSending(false);
    }
  };

  // Show access denied message if user is not admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-orange-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-orange-500 text-lg font-medium">Access denied</p>
          <p className="text-gray-600 mt-2">You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Announcement</h1>
      
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="recipientType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Recipients
            </label>
            <select
              id="recipientType"
              name="recipientType"
              value={formData.recipientType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="all">All Users (Service Providers & Customers)</option>
              <option value="serviceProviders">Service Providers Only</option>
              <option value="customers">Customers Only</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter announcement subject"
              required
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your announcement message"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className={`px-6 py-2 text-white font-medium rounded-md ${
                isSending
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {isSending ? "Sending..." : "Send Announcement"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Select the recipient type (all users, service providers only, or customers only)</li>
          <li>Enter a clear and concise subject for your announcement</li>
          <li>Write your message with all necessary details</li>
          <li>Click "Send Announcement" to deliver your message to the selected recipients</li>
          <li>All emails will be sent from the PETVERSE official email address</li>
        </ul>
      </div>
    </div>
  );
};

export default AnnouncementManagement;