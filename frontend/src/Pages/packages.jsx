// src/pages/Packages.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Packages = () => {
  const [activePackage, setActivePackage] = useState(""); // Basic, Premium, Luxury
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    pet_name: "",
    pet_type: "",
    other_pet_type: "",
    pet_breed: "",
    other_pet_breed: "",
    note: "",
  });
  const [submittedData, setSubmittedData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const petBreeds = {
    Dog: ["Labrador", "German Shepherd", "Bulldog", "Beagle", "Poodle", "Other"],
    Cat: ["Siamese", "Persian", "Maine Coon", "Ragdoll", "Bengal", "Other"],
    Rabbit: ["Holland Lop", "Netherland Dwarf", "Lionhead", "Flemish Giant", "Other"],
    Bird: ["Parakeet", "Cockatiel", "Lovebird", "Canary", "Other"],
    Hamster: ["Syrian", "Dwarf Winter White", "Roborovski", "Other"],
  };

  const packages = [
    { name: "Basic", description: "Standard care for your pet while you're away." },
    { name: "Premium", description: "Extra attention, playtime, and grooming included." },
    { name: "Luxury", description: "VIP treatment with full grooming, training, and care." },
  ];

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = "Cannot select past dates";
      }
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
    } else if (formData.date) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      
      if (selectedDateTime <= now) {
        newErrors.time = "Cannot select past times";
      }
    }

    // Pet name validation - only letters
    if (!formData.pet_name.trim()) {
      newErrors.pet_name = "Pet name is required";
    } else if (!/^[a-zA-Z]+$/.test(formData.pet_name.trim())) {
      newErrors.pet_name = "Pet name can only contain letters";
    }

    if (!formData.pet_type) {
      newErrors.pet_type = "Pet type is required";
    }

    if (formData.pet_type === "Other" && !formData.other_pet_type.trim()) {
      newErrors.other_pet_type = "Please specify pet type";
    } else if (formData.pet_type === "Other" && !/^[a-zA-Z0-9\s]+$/.test(formData.other_pet_type.trim())) {
      newErrors.other_pet_type = "Pet type can only contain letters, numbers, and spaces";
    }

    if (!formData.pet_breed) {
      newErrors.pet_breed = "Pet breed is required";
    }

    if (formData.pet_breed === "Other" && !formData.other_pet_breed.trim()) {
      newErrors.other_pet_breed = "Please specify pet breed";
    } else if (formData.pet_breed === "Other" && !/^[a-zA-Z0-9\s]+$/.test(formData.other_pet_breed.trim())) {
      newErrors.other_pet_breed = "Pet breed can only contain letters, numbers, and spaces";
    }

    // Note validation - only letters and digits
    if (formData.note && !/^[a-zA-Z0-9]*$/.test(formData.note)) {
      newErrors.note = "Notes can only contain letters and digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for pet_name field to only allow letters and spaces
    if (name === "pet_name") {
      // Allow only letters and spaces
      if (/^[a-zA-Z\s]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
      // If the value contains invalid characters, we don't update the state
      // This prevents typing special characters
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // ✅ Submit appointment to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activePackage) {
      alert("Please select a package first");
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      alert("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    const appointmentData = {
      ...formData,
      package: activePackage,
      appointment_id: `APT-${Date.now()}`, // unique id for backend
      user_id: "USER-123", // replace with actual user id if available
      status: "Scheduled",
    };

    try {
      // Fix the URL to use the correct API endpoint
      const res = await fetch("http://localhost:5003/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!res.ok) {
        throw new Error("Failed to book appointment, check server connection");
      }

      const data = await res.json();
      setSubmittedData(data);

      // Reset form
      setFormData({
        date: "",
        time: "",
        pet_name: "",
        pet_type: "",
        other_pet_type: "",
        pet_breed: "",
        other_pet_breed: "",
        note: "",
      });
      setActivePackage("");
      setErrors({});
    } catch (err) {
      alert(err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Generate PDF
  const downloadPDF = () => {
    if (!submittedData) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header function
    const addHeader = (doc, pageNumber = 1) => {
      // Header background
      doc.setFillColor(30, 64, 175); // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add logo
      try {
        const img = new Image();
        img.src = "/images/lol.jpeg"; // logo in public folder
        img.onload = () => {
          doc.addImage(img, "JPEG", 15, 8, 25, 25); // x, y, width, height
        };
      } catch (error) {
        console.warn("Failed to load logo:", error);
      }
      
      // Company name and title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PETVERSE", 45, 18);

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Boarding & Daycare Appointment", 45, 26);

      // Contact info
      doc.setFontSize(8);
      doc.text("New Kandy Road, Malabe • Tel: 0912345673", 45, 32);
      doc.text("www.petverse.com • hello@petverse.com", 45, 36);

      // Generated date (right aligned)
      const currentDate = new Date();
      const dateString = `Generated on: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;
      doc.setFontSize(8);
      const dateWidth = doc.getTextWidth(dateString);
      doc.text(dateString, pageWidth - dateWidth - 15, 32);

      // Page number (right aligned)
      const pageText = `Page ${pageNumber}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth - pageTextWidth - 15, 36);
    };

    // Footer function
    const addFooter = (doc) => {
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.setFont("helvetica", "normal");
      const footerText = "©️ 2025 PETVERSE. All rights reserved.";
      const footerWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
    };

    // Add header and footer to first page
    addHeader(doc);
    addFooter(doc);

    // Appointment details
    doc.setFontSize(16);
    doc.setTextColor("#1E40AF");
    doc.text("Appointment Details", 20, 55);

    // Format date properly for display
    const formattedDate = new Date(submittedData.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create table for appointment details
    const tableColumn = ["Field", "Value"];
    const tableRows = [
      ["Package", submittedData.package],
      ["Date", formattedDate],
      ["Time", submittedData.time],
      ["Pet Name", submittedData.pet_name],
      ["Pet Type", submittedData.pet_type === "Other" ? submittedData.other_pet_type : submittedData.pet_type],
      ["Pet Breed", submittedData.pet_breed === "Other" ? submittedData.other_pet_breed : submittedData.pet_breed],
      ["Notes", submittedData.note || "N/A"]
    ];

    // Use autoTable to generate the table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: "grid",
      headStyles: { fillColor: "#1E40AF", textColor: 255 },
      alternateRowStyles: { fillColor: "#F3F4F6" },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 40 }, // Field column
        1: { cellWidth: 100 } // Value column
      }
    });

    // Footer message
    doc.setFontSize(12);
    doc.setTextColor(0);
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(
      "Thank you for choosing PETVERSE!",
      105,
      finalY,
      { align: "center" }
    );

    doc.save("boarding-appointment-details.pdf");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#1E40AF] text-center">
        Boarding & Daycare Packages
      </h1>

      {/* Package Selection */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {packages.map((pkg) => (
          <div
            key={pkg.name}
            className={`p-6 rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 ${
              activePackage === pkg.name ? "border-4 border-[#F97316]" : "border-2 border-gray-200"
            } bg-white`}
            onClick={() => setActivePackage(pkg.name)}
          >
            <h2 className="text-2xl font-bold mb-3 text-[#1E40AF]">{pkg.name}</h2>
            <p className="text-gray-700">{pkg.description}</p>
            <button
              className="mt-4 w-full bg-[#F97316] hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-full transition-all"
              onClick={() => setActivePackage(pkg.name)}
            >
              Select
            </button>
          </div>
        ))}
      </div>

      {/* Form Section */}
      {activePackage && !submittedData && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-[#f3f4f6] p-8 rounded-2xl shadow-lg mb-8"
        >
          <h2 className="text-3xl font-bold mb-4 text-[#1E40AF]">
            {activePackage} Package Booking Form
          </h2>

          {/* Date & Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={getTodayDate()}
                required
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Time *</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                min={formData.date === getTodayDate() ? getCurrentTime() : "00:00"}
                required
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Pet Name */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Pet Name *</label>
            <input
              type="text"
              name="pet_name"
              value={formData.pet_name}
              onChange={handleChange}
              required
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                errors.pet_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.pet_name && <p className="text-red-500 text-sm mt-1">{errors.pet_name}</p>}
          </div>

          {/* Pet Type & Breed */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pet Type *</label>
              <select
                name="pet_type"
                value={formData.pet_type}
                onChange={(e) =>
                  setFormData({ ...formData, pet_type: e.target.value, pet_breed: "" })
                }
                required
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                  errors.pet_type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Pet Type</option>
                {Object.keys(petBreeds).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              {errors.pet_type && <p className="text-red-500 text-sm mt-1">{errors.pet_type}</p>}
              {formData.pet_type === "Other" && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter Pet Type"
                    value={formData.other_pet_type}
                    onChange={handleChange}
                    name="other_pet_type"
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                      errors.other_pet_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.other_pet_type && <p className="text-red-500 text-sm mt-1">{errors.other_pet_type}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pet Breed *</label>
              {formData.pet_type && formData.pet_type !== "Other" ? (
                <select
                  name="pet_breed"
                  value={formData.pet_breed}
                  onChange={handleChange}
                  required
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                    errors.pet_breed ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Breed</option>
                  {petBreeds[formData.pet_type].map((breed) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
              ) : formData.pet_type === "Other" ? (
                <input
                  type="text"
                  placeholder="Enter Pet Breed"
                  value={formData.other_pet_breed}
                  onChange={handleChange}
                  name="other_pet_breed"
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                    errors.other_pet_breed ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              ) : (
                <select
                  name="pet_breed"
                  value={formData.pet_breed}
                  onChange={handleChange}
                  required
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] ${
                    errors.pet_breed ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Pet Type First</option>
                </select>
              )}
              {errors.pet_breed && <p className="text-red-500 text-sm mt-1">{errors.pet_breed}</p>}
              {errors.other_pet_breed && <p className="text-red-500 text-sm mt-1">{errors.other_pet_breed}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Any special instructions or notes..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 font-semibold rounded-xl transition-all ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#1E40AF] hover:bg-[#153A8D]'
            } text-white`}
          >
            {isSubmitting ? 'Booking Appointment...' : 'Book Appointment'}
          </button>
        </form>
      )}

      {/* Confirmation + PDF */}
      {submittedData && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-3">Appointment Scheduled Successfully!</h2>
          <p className="mb-4 text-gray-700">
            Your {submittedData.package} package appointment has been booked. You can download the
            details below.
          </p>
          <button
            onClick={downloadPDF}
            className="bg-[#F97316] hover:bg-orange-500 text-white py-2 px-6 rounded-full font-semibold transition-all"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default Packages;