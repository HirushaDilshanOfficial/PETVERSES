import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

const AddFaq = () => {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch all FAQs
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api'}/faqs`);
      const data = await res.json();
      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (err) {
      console.error("Error fetching FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load FAQs on component mount
  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const newErrors = {};
    
    // Validate question
    if (!formData.question.trim()) {
      newErrors.question = "Question is required";
    }
    
    // Validate answer
    if (!formData.answer.trim()) {
      newErrors.answer = "Answer is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage("Please fix the validation errors");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api'}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("FAQ added successfully!");
        setFormData({ question: "", answer: "", category: "" });
        setErrors({});
        // Refresh the FAQ list
        fetchFaqs();
      } else {
        setMessage("Failed to add FAQ");
      }
    } catch (err) {
      setMessage("Error submitting FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete FAQ
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api'}/faqs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessage("FAQ deleted successfully!");
        fetchFaqs(); // Refresh the list
        setDeleteConfirm(null);
      } else {
        setMessage("Failed to delete FAQ");
      }
    } catch (err) {
      setMessage("Error deleting FAQ");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage frequently asked questions</p>
        </div>

        {/* Add FAQ Form */}
        <section className="bg-white border rounded-2xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New FAQ</h2>
          
          <div className="space-y-6">
            {/* Category */}
            <div className="flex flex-col">
              <label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                
                <option value="General">General</option>
                <option value="Pet Care Services">Pet Care Services</option>
                <option value="Account & Billing">Account & Billing</option>
                <option value="Technical Support">Technical Support</option>
              </select>
            </div>

            {/* Question */}
            <div className="flex flex-col">
              <label htmlFor="question" className="text-sm font-medium text-gray-700 mb-2">
                Question<span className="text-red-500"> *</span>
              </label>
              <input
                id="question"
                name="question"
                type="text"
                value={formData.question}
                onChange={handleChange}
                placeholder="Enter the frequently asked question"
                className={`px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                  errors.question ? "border-red-500" : "border-gray-300"
                }`}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {errors.question && <p className="mt-1 text-sm text-red-500">{errors.question}</p>}
            </div>

            {/* Answer */}
            <div className="flex flex-col">
              <label htmlFor="answer" className="text-sm font-medium text-gray-700 mb-2">
                Answer<span className="text-red-500"> *</span>
              </label>
              <textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleChange}
                rows={5}
                placeholder="Provide a detailed answer to the question"
                className={`px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-vertical ${
                  errors.answer ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.answer && <p className="mt-1 text-sm text-red-500">{errors.answer}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 rounded-lg bg-[#1E40AF] text-white font-medium hover:bg-[#F97316] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Adding FAQ..." : "Add FAQ"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setFormData({ question: "", answer: "", category: "" });
                  setErrors({});
                  setMessage("");
                }}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Clear Form
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes("successfully") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                <p className="font-medium">{message}</p>
              </div>
            )}
          </div>
        </section>

        {/* Display All FAQs */}
        <section className="bg-white border rounded-2xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">All FAQs ({faqs.length})</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading FAQs...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No FAQs found. Add your first FAQ above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{faq.question}</h3>
                        {faq.category && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {faq.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(faq.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setDeleteConfirm(faq._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete FAQ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete FAQ</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this FAQ? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        

        {/* Recent Actions */}
        <section className="mt-8 bg-white border rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Actions</h2>
          <div className="space-y-3">
            {faqs.slice(0, 3).map((faq, index) => (
              <div key={faq._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Added FAQ: "{faq.question.substring(0, 50)}..."</span>
                <span className="text-sm text-gray-500">
                  {new Date(faq.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {faqs.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent actions</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AddFaq;