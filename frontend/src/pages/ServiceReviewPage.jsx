import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";
import { useParams, Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

const ServiceReviewPage = () => {
  const { id } = useParams(); // Extract service ID from route parameters
  
  // Show loading state while we're getting the service ID
  if (!id) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service reviews...</p>
        </div>
      </div>
    );
  }
  
  // Pass the service ID to the feedback section component
  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to={`/service/${id}`} className="btn btn-ghost">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Service
          </Link>
        </div>

        <div className="card bg-base-100 border shadow-sm">
          <div className="card-body">
            <h1 className="card-title text-2xl">Service Reviews</h1>
            <p className="text-base-content/70">Share your experience with this service</p>
            <div className="mt-6">
              <FeedbackSection serviceID={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product review page component
const ProductReviewPage = () => {
  const { id } = useParams(); // Extract product ID from route parameters
  
  // Debug logging
  console.log("Product ID from route params:", id);
  console.log("Product ID type:", typeof id);
  console.log("Product ID length:", id ? id.length : 0);
  
  // Show loading state while we're getting the product ID
  if (!id) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product reviews...</p>
        </div>
      </div>
    );
  }
  
  // Pass the product ID to the feedback section component
  // The id here should be a valid MongoDB ObjectId
  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to={`/products/${id}`} className="btn btn-ghost">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Product
          </Link>
        </div>

        <div className="card bg-base-100 border shadow-sm">
          <div className="card-body">
            <h1 className="card-title text-2xl">Product Reviews</h1>
            <p className="text-base-content/70">Share your experience with this product</p>
            <div className="mt-6">
              <FeedbackSection productID={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedbackSection = ({ serviceID, productID }) => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editFeedback, setEditFeedback] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Debug logging
  console.log("FeedbackSection received props:", { serviceID, productID });
  
  // Derived values
  const avgRating = useMemo(() => {
    if (!feedbacks?.length) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + (Number(f?.rating) || 0), 0);
    return sum / feedbacks.length;
  }, [feedbacks]);

  const formatDate = (d) => {
    try {
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return "Just now";
      return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "Just now";
    }
  };

  // Fetch feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!serviceID && !productID) return;
      setLoading(true);
      try {
        const params = serviceID ? { serviceID } : { productID };
        if (ratingFilter) {
          params.rating = ratingFilter;
        }
        
        const res = await axios.get(`${API_BASE_URL}/ratings`, { params });
        setFeedbacks(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load feedbacks");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [serviceID, productID, ratingFilter]);

  // Submit new feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to submit feedback");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating (1-5)");
      return;
    }
    if (!feedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }
    if (!serviceID && !productID) {
      toast.error("Missing service or product ID");
      return;
    }

    try {
      let payload;
      let config = {
        withCredentials: true,
        headers: {}
      };
      
      // Get Firebase ID token for authentication
      const auth = getAuth(app);
      const firebaseUser = auth.currentUser;
      
      // Enhanced check for authentication
      if (!firebaseUser) {
        toast.error("Authentication error. Please login again.");
        return;
      }
      
      // Get fresh ID token
      const token = await firebaseUser.getIdToken(true); // Force refresh token
      
      config.headers.Authorization = `Bearer ${token}`;
      
      if (imageFile) {
        // multipart for file upload
        payload = new FormData();
        // Append text fields first, then the file field
        payload.append("rating", rating);
        payload.append("feedback", feedback.trim());
        if (serviceID) {
          payload.append("serviceID", serviceID);
        } else if (productID) {
          payload.append("productID", productID);
        }
        // Append the file field last
        payload.append("image", imageFile);
        // Don't set Content-Type header explicitly for FormData, let browser set it with proper boundary
      } else {
        // JSON body
        payload = {
          rating,
          feedback: feedback.trim(),
        };
        if (serviceID) {
          payload.serviceID = serviceID;
        } else if (productID) {
          payload.productID = productID;
        }
        config.headers["Content-Type"] = "application/json";
      }

      const res = await axios.post(`${API_BASE_URL}/ratings`, payload, config);

      setFeedbacks((prev) => [res.data, ...prev]);
      toast.success("Feedback added!");
      setShowForm(false);
      setRating(0);
      setHoverRating(0);
      setFeedback("");
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      console.error("Feedback submission error:", err);
      console.error("Error response:", err.response);
      const msg = err.response?.data?.message || err.message || "Failed to submit feedback";
      toast.error(msg);
    }
  };

  const onSelectImage = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const onSelectEditImage = (e) => {
    const file = e.target.files?.[0];
    setEditImageFile(file || null);
    setEditImagePreview(file ? URL.createObjectURL(file) : "");
  };

  // Stars for summary display
  const SummaryStars = ({ value = 0 }) => {
    const full = Math.round(value);
    return (
      <div className="flex items-center gap-1" aria-label={`Average rating ${value.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`text-xl ${i <= full ? "text-yellow-400" : "text-gray-300"}`}>★</span>
        ))}
      </div>
    );
  };

  // Stars for interactive input
  const InputStars = () => {
    const current = hoverRating || rating;
    return (
      <div className="flex gap-2 mt-2" role="radiogroup" aria-label="Select rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onFocus={() => setHoverRating(star)}
            onBlur={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            aria-checked={rating === star}
            role="radio"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className={`text-3xl transition-transform duration-150 transform hover:scale-110 bg-transparent p-0 border-0 rounded-none outline-none focus:outline-none focus:ring-0 appearance-none ${
              star <= current ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Stars for editing input
  const EditStars = () => {
    const current = editHoverRating || editRating;
    return (
      <div className="flex gap-2 mt-1" role="radiogroup" aria-label="Edit rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setEditHoverRating(star)}
            onMouseLeave={() => setEditHoverRating(0)}
            onFocus={() => setEditHoverRating(star)}
            onBlur={() => setEditHoverRating(0)}
            onClick={() => setEditRating(star)}
            aria-checked={editRating === star}
            role="radio"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className={`text-2xl transition-transform duration-150 transform hover:scale-110 bg-transparent p-0 border-0 rounded-none outline-none focus:outline-none focus:ring-0 appearance-none ${
              star <= current ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Delete feedback
  const handleDelete = async (id) => {
    // Find the feedback being deleted
    const feedbackToDelete = feedbacks.find(fb => fb._id === id);
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please login to delete feedback");
      return;
    }
    
    // Check if the current user owns this feedback
    const feedbackUserId = feedbackToDelete?.userID?._id || feedbackToDelete?.userID;
    const currentUserId = user?._id;
    
    if (feedbackUserId?.toString() !== currentUserId?.toString()) {
      toast.error("You can only delete your own feedback");
      return;
    }
    
    const proceed = window.confirm("Delete this feedback?");
    if (!proceed) return;
    
    try {
      // Get Firebase ID token for authentication
      const auth = getAuth(app);
      const firebaseUser = auth.currentUser;
      
      // Enhanced check for authentication
      if (!firebaseUser) {
        toast.error("Authentication error. Please login again.");
        return;
      }
      
      // Get fresh ID token
      const token = await firebaseUser.getIdToken(true); // Force refresh token
      
      await axios.delete(`${API_BASE_URL}/ratings/${id}`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      toast.success("Feedback deleted");
      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      console.error("Feedback deletion error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to delete feedback";
      toast.error(msg);
    }
  };

  // Start editing a feedback
  const startEdit = (fb) => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please login to edit feedback");
      return;
    }
    
    // Check if the current user owns this feedback
    const feedbackUserId = fb?.userID?._id || fb?.userID;
    const currentUserId = user?._id;
    
    if (feedbackUserId?.toString() !== currentUserId?.toString()) {
      toast.error("You can only edit your own feedback");
      return;
    }
    
    setEditingId(fb._id);
    setEditRating(Number(fb.rating) || 0);
    setEditFeedback(fb.feedback || "");
    setEditHoverRating(0);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditFeedback("");
    setEditHoverRating(0);
    setEditImageFile(null);
    setEditImagePreview("");
  };

  // Submit edited feedback
  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    
    if (!user) {
      toast.error("Please login to edit feedback");
      return;
    }
    
    if (editRating < 1 || editRating > 5) {
      toast.error("Please select a rating (1-5)");
      return;
    }
    if (!editFeedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }
    try {
      let payload;
      let config = {
        withCredentials: true,
        headers: {}
      };
      
      // Get Firebase ID token for authentication
      const auth = getAuth(app);
      const firebaseUser = auth.currentUser;
      
      // Enhanced check for authentication
      if (!firebaseUser) {
        toast.error("Authentication error. Please login again.");
        return;
      }
      
      // Get fresh ID token
      const token = await firebaseUser.getIdToken(true); // Force refresh token
      config.headers.Authorization = `Bearer ${token}`;
      
      if (editImageFile) {
        payload = new FormData();
        payload.append("rating", editRating);
        payload.append("feedback", editFeedback.trim());
        payload.append("image", editImageFile);
        // Don't set Content-Type header explicitly for FormData, let browser set it with proper boundary
      } else {
        payload = {
          rating: editRating,
          feedback: editFeedback.trim(),
        };
        config.headers["Content-Type"] = "application/json";
      }

      const res = await axios.put(`${API_BASE_URL}/ratings/${editingId}`, payload, config);
      const updated = res.data;
      setFeedbacks((prev) => prev.map((f) => (f._id === editingId ? { ...f, ...updated } : f)));
      toast.success("Feedback updated");
      cancelEdit();
    } catch (err) {
      console.error("Feedback update error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to update feedback";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card bg-base-100 border shadow-lg">
          <div className="card-body">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-[#1E40AF]">
                  {serviceID ? "Service" : "Product"} Reviews & Ratings
                </h3>
                <span className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <span className="text-base">🐾</span> {feedbacks.length} reviews
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</div>
                <SummaryStars value={avgRating} />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-3 mt-4">
              <label className="text-sm font-medium text-gray-700">
                Filter by rating:
              </label>

              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-400 text-gray-800 bg-white
                          rounded-lg text-sm font-medium cursor-pointer shadow-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500
                          hover:bg-gray-100 transition"
              >
                <option value="">All ratings</option>
                <option value="5">⭐ 5 stars</option>
                <option value="4">⭐ 4 stars</option>
                <option value="3">⭐ 3 stars</option>
                <option value="2">⭐ 2 stars</option>
                <option value="1">⭐ 1 star</option>
              </select>

              {ratingFilter && (
                <button
                  onClick={() => setRatingFilter("")}
                  className="text-xs font-medium text-gray-600 hover:text-red-500 underline ml-2 transition"
                >
                  Clear
                </button>
              )}
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Feedback list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex items-center gap-3 text-gray-500 text-sm bg-pink-50/60 border border-pink-100 rounded-xl p-4">
                <span className="text-pink-400 text-xl">🐶</span>
                Be the first to leave a review for this {serviceID ? "service" : "product"}.
              </div>
            ) : (
              <ul className="mt-2 space-y-4">
                {feedbacks.map((fb) => (
                  <li key={fb._id} className="p-4 rounded-xl border bg-gray-50 hover:bg-white hover:shadow transition">
                    <div className="flex items-start gap-3">
                      {/* Avatar/initial */}
                      <div className="h-10 w-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-semibold flex-shrink-0">
                        {(fb?.userID?._id || fb?.userID || "U").toString().slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-gray-900">{fb?.userID?.fullName || "Anonymous"}</div>
                            <div className="text-xs text-gray-400">{formatDate(fb?.createdAt)}</div>
                          </div>
                          {/* In a real implementation, you would check if the current user owns this feedback */}
                          {user && (
                            <div className="flex items-center gap-1 ml-2">
                              <button onClick={() => startEdit(fb)} className="p-2 rounded-full hover:bg-yellow-50 text-yellow-700" title="Edit" aria-label="Edit">✏️</button>
                              <button onClick={() => handleDelete(fb._id)} className="p-2 rounded-full hover:bg-red-50 text-red-600" title="Delete" aria-label="Delete">🗑️</button>
                            </div>
                          )}
                        </div>
                        {editingId === fb._id ? (
                          <form onSubmit={submitEdit} className="mt-1 space-y-2">
                            <EditStars />
                            <textarea
                              value={editFeedback}
                              onChange={(e) => setEditFeedback(e.target.value)}
                              rows="3"
                              className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                              placeholder="Update your feedback..."
                            />
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Update image (optional)</label>
                              <input type="file" accept="image/*" onChange={onSelectEditImage} />
                              {(editImagePreview || fb?.image_url) && (
                                <img src={editImagePreview || fb?.image_url} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg border" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1E40AF] text-white text-sm font-medium hover:bg-[#1E40AF]/90 transition">Save</button>
                              <button type="button" onClick={cancelEdit} className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 transition">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className={`text-base ${i <= (fb?.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                              ))}
                              <span className="text-xs text-gray-400">({fb?.rating}/5)</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">{fb?.feedback}</p>
                            {fb?.image_url && (
                              <img
                                src={fb.image_url}
                                alt="Feedback attachment"
                                className="mt-3 max-h-64 rounded-lg border object-cover"
                                loading="lazy"
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Toggle form button */}
            <div className="mt-6">
              {user ? (
                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#1E40AF] text-white font-medium hover:bg-[#1E40AF]/90 transition"
                >
                  {showForm ? "Close form" : "Write a review"}
                </button>
              ) : (
                <div className="text-center text-gray-500">
                  Please login to write a review
                </div>
              )}
            </div>

            {/* Feedback form */}
            {showForm && user && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Your rating</label>
                  <InputStars />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Your feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows="4"
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 mt-1 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="Share details about your experience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Attach an image (optional)</label>
                  <input type="file" accept="image/*" onChange={onSelectImage} />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg border" />
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">By submitting, you agree to our community guidelines.</p>
                  <button
                    type="submit"
                    disabled={!rating || !feedback.trim()}
                    className="px-5 py-2 rounded-lg bg-[#1E40AF] text-white font-medium hover:bg-[#F97316] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export both components
export { ServiceReviewPage, ProductReviewPage };
export default ServiceReviewPage;