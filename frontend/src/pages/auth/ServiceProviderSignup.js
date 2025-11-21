import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const ServiceProviderSignup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
    nicNumber: "",
    businessType: "",
    emergencyContact: "",
    role: "serviceProvider",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const businessTypes = [
    "Veterinary Clinic",
    "Animal Hospital",
    "Pet Grooming Salon",
    "Mobile Pet Grooming",
    "Pet Boarding Facility",
    "Pet Daycare Center",
    "Dog Walking Service",
    "Pet Training Academy",
    "Dog Training Center",
    "Pet Sitting Service",
    "Pet Supply Store",
    "Pet Pharmacy",
    "Pet Photography",
    "Pet Taxi Service",
    "Pet Behavioral Therapy",
    "Pet Nutrition Consulting",
    "Pet Emergency Care",
    "Mobile Veterinary Service",
    "Pet Spa & Wellness",
    "Pet Dental Care",
    "Pet Physical Therapy",
    "Pet Insurance Agency",
    "Pet Adoption Center",
    "Pet Breeding Service",
    "Pet Equipment Rental",
    "Pet Waste Removal",
    "Pet Funeral Services",
    "Aquarium Services",
    "Bird Care Specialist",
    "Exotic Pet Care",
    "Pet Home Visits",
    "Pet Acupuncture",
    "Pet Massage Therapy",
    "Other",
  ];
  const [files, setFiles] = useState({
    nicFrontPhoto: null,
    nicBackPhoto: null,
    facePhoto: null,
    businessDocuments: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previews, setPreviews] = useState({});
  const { clearError } = useAuth();
  const navigate = useNavigate();

  // Handle file changes for document uploads
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;

    if (name === "businessDocuments") {
      // Handle multiple file selection for business documents
      const filesArray = Array.from(selectedFiles);
      setFiles((prev) => ({
        ...prev,
        businessDocuments: [...prev.businessDocuments, ...filesArray],
      }));

      // Create previews for business documents
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => ({
            ...prev,
            [`${name}-${Date.now()}`]: e.target.result,
          }));
        };
        reader.readAsDataURL(file);
      });
    } else {
      // Handle single file selection for other documents
      const file = selectedFiles[0];
      if (file) {
        setFiles((prev) => ({
          ...prev,
          [name]: file,
        }));

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => ({
            ...prev,
            [name]: e.target.result,
          }));
        };
        reader.readAsDataURL(file);

        // Clear error for this field when user selects a file
        if (errors[name]) {
          setErrors((prev) => ({ ...prev, [name]: "" }));
        }
      }
    }
  };

  // Remove a file from the state
  const removeFile = (fileName) => {
    setFiles((prev) => ({
      ...prev,
      [fileName]: null,
    }));

    setPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fileName];
      return newPreviews;
    });
  };

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

      case "nicNumber":
        if (!value.trim()) return "NIC number is required";
        // Allow old format (9 digits + V only) or new format (12 digits)
        if (!/^\d{9}V$/.test(value) && !/^\d{12}$/.test(value))
          return "NIC must be 9 digits + V (e.g., 123456789V) or 12 digits (e.g., 123456789012)";
        return "";

      case "address":
        if (!value.trim()) return "Address is required";
        if (/[^a-zA-Z0-9\s,.-]/.test(value))
          return "Address cannot contain special characters";
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
      case "address":
        // Allow letters, numbers, spaces, commas, periods, and hyphens
        filteredValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, "");
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

    // Check if required files are uploaded
    if (!files.nicFrontPhoto) {
      newErrors.nicFrontPhoto = "NIC front photo is required";
    }
    if (!files.nicBackPhoto) {
      newErrors.nicBackPhoto = "NIC back photo is required";
    }
    if (!files.facePhoto) {
      newErrors.facePhoto = "Face photo is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      console.log("🔥 Starting service provider registration...");

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

      // Step 3: Upload documents to backend
      console.log("📤 Uploading documents...");
      const userId = registerResponse.data.user._id;

      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();

      // Create FormData for document upload
      const documentData = new FormData();
      documentData.append("nicFront", files.nicFrontPhoto);
      documentData.append("nicBack", files.nicBackPhoto);
      documentData.append("facePhoto", files.facePhoto);

      // Add business documents if any
      files.businessDocuments.forEach((file) => {
        documentData.append("businessDocuments", file);
      });

      // Upload documents with proper authentication
      await axios.post(
        `${API_BASE_URL}/auth/service-provider/${userId}/documents`,
        documentData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log("✅ Documents uploaded successfully");

      // Success - show notification and navigate to login page
      console.log("🎉 Service provider registration completed successfully!");

      // Show success notification
      showNotification(
        "Registration successful! Your account has been created and documents uploaded. Please wait for admin verification before logging in.",
        "success"
      );

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message);
      showNotification(`Registration failed: ${err.message}`, "error");
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 mt-20">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl">👨‍⚕️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Service Provider Account
          </h2>
          <p className="text-gray-600">
            Join PETVERSE to offer your professional pet care services
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <i className="fas fa-info-circle mr-2"></i>
              Your account will be verified by our admin team before activation.
              This usually takes 24-48 hours.
            </p>
          </div>
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
          <form className="space-y-8" onSubmit={handleSubmit}>
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

            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <i className="fas fa-user mr-2 text-orange-500"></i>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className={`block w-full px-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.fullName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name (letters and spaces only)"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName}</p>
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
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    className={`block w-full px-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.phoneNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your phone number (10 digits)"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`block w-full px-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows="3"
                    className={`block w-full px-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full address (no special characters)"
                    value={formData.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600">{errors.address}</p>
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
                  <input
                    id="nicNumber"
                    name="nicNumber"
                    type="text"
                    required
                    className={`block w-full px-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.nicNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., 123456789V or 123456789012 (max 12 characters, V must be capital)"
                    value={formData.nicNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.nicNumber && (
                    <p className="text-sm text-red-600">{errors.nicNumber}</p>
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
                  <input
                    id="emergencyContact"
                    name="emergencyContact"
                    type="tel"
                    required
                    className={`block w-full px-3 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.emergencyContact
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Emergency contact number (10 digits)"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.emergencyContact && (
                    <p className="text-sm text-red-600">
                      {errors.emergencyContact}
                    </p>
                  )}
                </div>

                {/* Business Type */}
                <div>
                  <label
                    htmlFor="businessType"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={formData.businessType}
                    onChange={handleChange}
                  >
                    <option value="">Select your business type</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <i className="fas fa-file-upload mr-2 text-orange-500"></i>
                Required Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* NIC Front Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIC Front Photo *
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-orange-400 transition-colors ${
                      errors.nicFrontPhoto
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    {previews.nicFrontPhoto ? (
                      <div className="relative">
                        <img
                          src={previews.nicFrontPhoto}
                          alt="NIC Front"
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile("nicFrontPhoto")}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                        <p className="text-sm text-gray-600">
                          Upload NIC front
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      name="nicFrontPhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="nicFrontPhoto"
                    />
                    <label
                      htmlFor="nicFrontPhoto"
                      className="mt-2 inline-block cursor-pointer text-sm text-orange-600 hover:text-orange-700"
                    >
                      Choose File
                    </label>
                  </div>
                  {errors.nicFrontPhoto && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.nicFrontPhoto}
                    </p>
                  )}
                </div>

                {/* NIC Back Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIC Back Photo *
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-orange-400 transition-colors ${
                      errors.nicBackPhoto ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    {previews.nicBackPhoto ? (
                      <div className="relative">
                        <img
                          src={previews.nicBackPhoto}
                          alt="NIC Back"
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile("nicBackPhoto")}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                        <p className="text-sm text-gray-600">Upload NIC back</p>
                      </>
                    )}
                    <input
                      type="file"
                      name="nicBackPhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="nicBackPhoto"
                    />
                    <label
                      htmlFor="nicBackPhoto"
                      className="mt-2 inline-block cursor-pointer text-sm text-orange-600 hover:text-orange-700"
                    >
                      Choose File
                    </label>
                  </div>
                  {errors.nicBackPhoto && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.nicBackPhoto}
                    </p>
                  )}
                </div>

                {/* Face Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Face Photo *
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-orange-400 transition-colors ${
                      errors.facePhoto ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    {previews.facePhoto ? (
                      <div className="relative">
                        <img
                          src={previews.facePhoto}
                          alt="Face Photo"
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile("facePhoto")}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                        <p className="text-sm text-gray-600">
                          Upload face photo
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      name="facePhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="facePhoto"
                    />
                    <label
                      htmlFor="facePhoto"
                      className="mt-2 inline-block cursor-pointer text-sm text-orange-600 hover:text-orange-700"
                    >
                      Choose File
                    </label>
                  </div>
                  {errors.facePhoto && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.facePhoto}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Documents */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Documents (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <i className="fas fa-file-alt text-3xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload business license, certificates, or other relevant
                    documents
                  </p>
                  <input
                    type="file"
                    name="businessDocuments"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="businessDocuments"
                  />
                  <label
                    htmlFor="businessDocuments"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-600 bg-white hover:bg-orange-50"
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Choose Files
                  </label>
                  {files.businessDocuments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Selected files:
                      </p>
                      <ul className="text-sm text-gray-800">
                        {files.businessDocuments.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded mb-1"
                          >
                            <span>{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = files.businessDocuments.filter(
                                  (_, i) => i !== index
                                );
                                setFiles((prev) => ({
                                  ...prev,
                                  businessDocuments: newFiles,
                                }));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <i className="fas fa-lock mr-2 text-orange-500"></i>
                Account Security
              </h3>
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
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className={`block w-full px-3 pr-10 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
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
                    <p className="text-sm text-red-600">{errors.password}</p>
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
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className={`block w-full px-3 pr-10 py-3 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
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
                    <p className="text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    Create Service Provider Account
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
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
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

export default ServiceProviderSignup;
