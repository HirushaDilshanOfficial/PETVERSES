import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const PetOwnerSignup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
    emergencyContact: "",
    nicNumber: "",
    role: "petOwner",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { clearError } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (!/^[a-zA-Z\s]+$/.test(value))
          return "Full name can only contain letters and spaces";
        return "";

      case "phoneNumber":
        if (!value.trim()) return "Phone number is required";
        if (!/^\d{10}$/.test(value))
          return "Phone number must be exactly 10 digits";
        return "";

      case "emergencyContact":
        if (!value.trim()) return "Emergency contact is required";
        if (!/^\d{10}$/.test(value))
          return "Emergency contact must be exactly 10 digits";
        return "";

      case "address":
        if (!value.trim()) return "Address is required";
        if (/[^a-zA-Z0-9\s,.-]/.test(value))
          return "Address cannot contain special characters";
        return "";

      case "nicNumber":
        if (!value.trim()) return "NIC number is required";
        // Allow old format (9 digits + V only) or new format (12 digits)
        if (!/^\d{9}V$/.test(value) && !/^\d{12}$/.test(value))
          return "NIC must be 9 digits + V (e.g., 123456789V) or 12 digits (e.g., 123456789012)";
        return "";

      case "password":
        if (!value) return "Password is required";
        if (value.length < 6)
          return "Password must be at least 6 characters long";
        return "";

      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return "";

      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Apply field-specific validation
    let filteredValue = value;
    switch (name) {
      case "fullName":
        // Allow only letters and spaces
        filteredValue = value.replace(/[^a-zA-Z\s]/g, "");
        break;
      case "phoneNumber":
      case "emergencyContact":
        // Allow only digits and limit to 10 characters
        filteredValue = value.replace(/\D/g, "").slice(0, 10);
        break;
      case "address":
        // Allow letters, numbers, spaces, commas, periods, and hyphens
        filteredValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, "");
        break;
      case "nicNumber":
        // Allow digits and V only at the end for old format, or just digits for new format
        if (
          /^\d{0,9}$/.test(value) ||
          /^\d{9}V?$/.test(value) ||
          /^\d{0,12}$/.test(value)
        ) {
          filteredValue = value;
        } else {
          // Allow only digits and capital V
          filteredValue = value.replace(/[^0-9V]/g, "");
        }
        // Limit to 12 characters max
        filteredValue = filteredValue.slice(0, 12);
        break;
    }

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (error) clearError();
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Create user account via Firebase Authentication
      const { getAuth, createUserWithEmailAndPassword } = await import(
        "firebase/auth"
      );
      const app = (await import("../../config/firebase")).default;
      const auth = getAuth(app);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const firebaseUser = userCredential.user;
      const firebaseUid = firebaseUser.uid;

      // Step 2: Register user in our backend
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

      // Prepare user data for backend registration
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        address: formData.address,
        nicNumber: formData.nicNumber,
        firebaseUid: firebaseUid,
      };

      const registerResponse = await axios.post(
        `${API_BASE_URL}/auth/register`,
        userData
      );

      console.log(
        "✅ User account created successfully",
        registerResponse.data
      );

      // Success - show notification and navigate to login page
      showNotification(
        "Account created successfully! Please login to continue.",
        "success"
      );

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Signup failed:", err);
      setError(err.message);
      showNotification(`Signup failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to show notification
  const showNotification = (message, type = "success") => {
    // Create notification container if it doesn't exist
    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      container.style.position = "fixed";
      container.style.top = "20px";
      container.style.right = "20px";
      container.style.zIndex = "9999";
      document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.style.backgroundColor =
      type === "success" ? "#10B981" : "#EF4444";
    notification.style.color = "white";
    notification.style.padding = "16px 24px";
    notification.style.borderRadius = "8px";
    notification.style.marginBottom = "12px";
    notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    notification.style.display = "flex";
    notification.style.alignItems = "center";
    notification.style.minWidth = "300px";
    notification.style.transform = "translateX(100%)";
    notification.style.transition = "transform 0.3s ease-in-out";
    notification.style.opacity = "0";

    // Add icon based on type
    const icon = document.createElement("span");
    icon.style.marginRight = "12px";
    icon.style.fontSize = "20px";
    icon.innerHTML = type === "success" ? "✅" : "❌";
    notification.appendChild(icon);

    // Add message
    const messageElement = document.createElement("span");
    messageElement.textContent = message;
    notification.appendChild(messageElement);

    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.style.background = "none";
    closeBtn.style.border = "none";
    closeBtn.style.color = "white";
    closeBtn.style.fontSize = "20px";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.marginLeft = "16px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.padding = "0";
    closeBtn.style.width = "24px";
    closeBtn.style.height = "24px";
    closeBtn.style.display = "flex";
    closeBtn.style.alignItems = "center";
    closeBtn.style.justifyContent = "center";
    closeBtn.onclick = () => {
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };
    notification.appendChild(closeBtn);

    // Add to container
    container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = "translateX(100%)";
        notification.style.opacity = "0";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 mt-20">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl">🐕</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Pet Owner Account
          </h2>
          <p className="text-gray-600">
            Join PETVERSE to find the best care for your pets
          </p>
        </div>

        {/* Back to Home Button */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Home
          </button>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-exclamation-circle text-red-400"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-phone text-gray-400"></i>
                  </div>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    className={`block w-full pl-10 pr-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phoneNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your phone number (10 digits)"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-map-marker-alt text-gray-400"></i>
                </div>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows="3"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your full address (no special characters)"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address}</p>
              )}
            </div>

            {/* Emergency Contact */}
            <div>
              <label
                htmlFor="emergencyContact"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Emergency Contact Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-phone-alt text-gray-400"></i>
                </div>
                <input
                  id="emergencyContact"
                  name="emergencyContact"
                  type="tel"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.emergencyContact
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Emergency contact number (10 digits)"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.emergencyContact && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.emergencyContact}
                </p>
              )}
            </div>

            {/* NIC Number */}
            <div>
              <label
                htmlFor="nicNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                NIC Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-id-card text-gray-400"></i>
                </div>
                <input
                  id="nicNumber"
                  name="nicNumber"
                  type="text"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nicNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., 123456789V or 123456789012 (max 12 characters, V must be capital)"
                  value={formData.nicNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.nicNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.nicNumber}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className={`block w-full pl-10 pr-10 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Create password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`fas ${
                          showPassword ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className={`block w-full pl-10 pr-10 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <i
                        className={`fas ${
                          showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    Create Pet Owner Account
                  </>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link
            to="/signup"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to role selection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PetOwnerSignup;
