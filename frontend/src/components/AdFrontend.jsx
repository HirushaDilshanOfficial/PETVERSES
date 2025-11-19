import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation import
import apiClient from "../lib/axios"; // Use the configured axios instance
import toast from "react-hot-toast";

const AdFrontend = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Add location hook
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [ads, setAds] = useState([]);

  // Check for payment success message
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      console.log("Payment success detected for ad:", location.state.adTitle);
      toast.success(`Payment successful for "${location.state.adTitle}"!`);
      // Clear the state to prevent showing the message again
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, location.pathname]);

  const durationOptions = [
    { label: "15 Days - Rs 3000", value: 15 },
    { label: "1 Month (30 Days) - Rs 5000", value: 30 },
    { label: "2 Months (60 Days) - Rs 9000", value: 60 },
  ];

  // Validation function for title (only letters and spaces)
  const validateTitle = (title) => {
    return /^[a-zA-Z\s]*$/.test(title);
  };

  // Fetch ads on load - Now filtered by provider
  useEffect(() => {
    const fetchAds = async () => {
      try {
        console.log("Fetching ads for authenticated provider");
        const res = await apiClient.get("/advertisements/by-provider");
        console.log("API Response:", res.data);
        setAds(res.data || []);
      } catch (err) {
        console.error("Error fetching ads:", err);
        console.error("Error response:", err.response?.data);
        toast.error("Failed to load ads");
      }
    };
    
    fetchAds();
  }, []);


  


  


  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !duration) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate title before submitting
    if (!validateTitle(title)) {
      toast.error("Title can only contain letters and spaces");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("duration", duration);
      formData.append("description", description);

      // Note: provider_ID is now handled by the backend from the authenticated user

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await apiClient.post("/advertisements", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Advertisement created!");
      setAds((prev) => [res.data.ad, ...prev]);

      // reset form
      setTitle("");
      setDuration("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create ad");
    }
  };

  const onSelectImage = (e) => {
    const file = e.target.files?.[0];
    console.log("Selected file:", file);
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  // Handle title change with validation
  const handleTitleChange = (value) => {
    // Allow empty values for clearing the field
    if (value === "") {
      setTitle("");
      return;
    }
    
    // Validate title before setting (only letters and spaces)
    if (validateTitle(value)) {
      setTitle(value);
    } else {
      toast.error("Title can only contain letters and spaces");
    }
  };

  // Check if form is valid (all required fields filled)
  const isFormValid = () => {
    const valid = title.trim() !== "" && 
                  duration !== "" && 
                  imageFile !== null;
    
    console.log("Form validation:", {
      title: title.trim() !== "",
      duration: duration !== "",
      imageFile: imageFile !== null,
      overall: valid
    });
    
    return valid;
  };

  // Function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle payment button click
  const handleProceedToPayment = (ad) => {
    // Navigate to payment page with ad details
    navigate("/payment/advertisement", { 
      state: { 
        adId: ad._id,
        title: ad.title,
        amount: getPrice(ad.duration),
        duration: ad.duration
      } 
    });
  };

  // Get price based on duration
  const getPrice = (duration) => {
    switch (duration) {
      case 15:
        return "3000";
      case 30:
        return "5000";
      case 60:
        return "9000";
      default:
        return "0";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white shadow-md rounded-2xl space-y-5"
      >
        <h2 className="text-2xl font-bold text-[#1E40AF]">Create Advertisement</h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 text-black shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 text-black shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 text-black shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
          >
            <option value="" disabled>Choose Duration</option>
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Ad Image
          </label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={onSelectImage}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 h-32 w-32 object-cover rounded-lg border"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid()}
          className={`w-full py-2 px-4 font-medium rounded-xl shadow transition ${
            isFormValid()
              ? "bg-[#1E40AF] text-white hover:bg-[#F97316] cursor-pointer"
              : "bg-[#A3BFFA] text-gray-100 cursor-not-allowed"
          }`}
        >
          Submit Advertisement
        </button>
      </form>

      {/* Ad Listing */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-[#1E40AF] mb-4">
          Your Advertisements ({ads.length})
        </h3>
        {ads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No advertisements yet.</p>
            <p className="text-sm text-gray-400 mt-2">Create your first advertisement above!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="p-4 rounded-2xl border bg-white shadow hover:shadow-md transition"
              >
                {ad.imageUrl && (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800">{ad.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(ad.status)}`}>
                    {ad.status?.charAt(0).toUpperCase() + ad.status?.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 font-semibold">
                  Rs {getPrice(ad.duration)}
                </p>
                <p className="text-sm text-gray-500">Duration: {ad.duration} days</p>
                {ad.description && (
                  <p className="text-sm text-gray-500 mt-1">{ad.description}</p>
                )}
                
                {/* Payment Button - Shows only for approved ads that haven't been paid */}
                {ad.status === "approved" && ad.paymentStatus !== "paid" && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleProceedToPayment(ad)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      💳 Proceed to Payment - Rs {getPrice(ad.duration)}
                    </button>
                  </div>
                )}
                
                {/* Payment Status Display */}
                {ad.paymentStatus === "paid" && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 flex items-center">
                      ✅ Payment Completed
                    </p>
                  </div>
                )}
                
                {/* Rejection Reason Display */}
                {ad.status === "rejected" && ad.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{ad.rejectionReason}</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(ad.created_at).toLocaleDateString()}
                </p>
                
                {/* Approval Date Display */}
                {ad.status === "approved" && ad.approved_at && (
                  <p className="text-xs text-green-600 mt-1">
                    Approved: {new Date(ad.approved_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdFrontend;