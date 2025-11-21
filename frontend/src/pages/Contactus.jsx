import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import Header from "../components/Header";
const Contactus = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateName = (name) => {
    // Only allow letters and spaces
    return /^[a-zA-Z\s]*$/.test(name);
  };

  const validateEmail = (email) => {
    // Basic email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply validation based on field type
    if (name === "name" && !validateName(value)) {
      return;
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    // Validate name
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!validateName(form.name)) {
      newErrors.name = "Name can only contain letters and spaces";
    }
    
    // Validate email
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Validate message
    if (!form.message.trim()) {
      newErrors.message = "Message is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setSubmitting(true);
      // Use environment variable for API URL
      const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";
      await axios.post(`${API_URL}/contact`, form);
      toast.success("Message sent! We'll get back to you shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setErrors({}); // Clear errors on successful submission
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Failed to send message";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (

    
    <div className="min-h-screen bg-gray-50">
      <Header/>
      
      <section className="relative ">

        
        <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[520px]">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/src/assets/images/pets-banner2.jpg"
          >
            <source src="/videos/4057313-uhd_4096_2160_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative container mx-auto max-w-4xl h-full px-4 py-8 text-center flex flex-col items-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-white">Contact Us</h1>
            <p className="mt-auto mb-8 text-white/90">
              Have a question, feedback, or partnership idea? We'd love to hear from you.
              Send us a message using the form below or reach out via the contact details provided.
            </p>
          </div>
        </div>
      </section>
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Contact Form */}
        <section className="bg-white border rounded-2xl shadow p-6 mb-10">
          <h2 className="text-xl font-semibold text-gray-900">Send us a message</h2>
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name<span className="text-red-500"> *</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className={`mt-1 px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="flex flex-col">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email<span className="text-red-500"> *</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`mt-1 px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="flex flex-col md:col-span-2">
              <label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject</label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                Message<span className="text-red-500"> *</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="Write your message here..."
                className={`mt-1 px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                  errors.message ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#1E40AF] text-white font-medium hover:bg-[#F97316] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </section>

        {/* Details + Map */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Contact details */}
          <div className="bg-white border rounded-2xl shadow p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
            <ul className="mt-4 space-y-3 text-gray-700">
              <li>
                <p className="font-medium">Address</p>
                <p className="text-sm text-gray-600">New Kandy Road, Malabe, Sri Lanka</p>
              </li>
              <li>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-gray-600">+94 71 123 4567</p>
              </li>
              <li>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-600">mailtopetverse@gmail.com</p>
              </li>
              <li>
                <p className="font-medium">Hours</p>
                <p className="text-sm text-gray-600">Mon–Fri: 9:00 AM – 6:00 PM</p>
              </li>
            </ul>
          </div>

          {/* Right: Map */}
          <div className="bg-white border rounded-2xl shadow h-80 lg:h-full overflow-hidden">
            <iframe
              title="Location Map"
              src="https://maps.google.com/maps?q=Colombo&t=&z=12&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contactus;