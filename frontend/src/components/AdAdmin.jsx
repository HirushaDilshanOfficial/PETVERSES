import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const AdAdmin = () => {
  const [pendingAds, setPendingAds] = useState([]);
  const [approvedAds, setApprovedAds] = useState([]);
  const [rejectedAds, setRejectedAds] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    adId: null,
    reason: ""
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    adId: null,
    adTitle: ""
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";


  const fetchPendingAds = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/advertisements/pending`);
      setPendingAds(res.data);
    } catch (err) {
      console.error("Error fetching pending ads:", err);
    }
  };

  const fetchApprovedAds = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/advertisements/approved`);
      setApprovedAds(res.data);
    } catch (err) {
      console.error("Error fetching approved ads:", err);
    }
  };

  const fetchRejectedAds = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/advertisements/rejected`);
      setRejectedAds(res.data);
    } catch (err) {
      console.error("Error fetching rejected ads:", err);
    }
  };

  const getSelectedMonthPublishedAds = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return approvedAds.filter(ad => {
      const approvedDate = new Date(ad.approved_at);
      return approvedDate >= startDate && 
             approvedDate < endDate && 
             ad.paymentStatus === 'paid';
    });
  };

  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  const getImageBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg");
        resolve(dataURL);
      };
      img.onerror = function () {
        reject(new Error("Failed to load image at " + url));
      };
      img.src = url;
    });
  };

  const generatePublishedAdsPDFReport = async () => {
    try {
      const doc = new jsPDF();
      
      const publishedAds = getSelectedMonthPublishedAds();
      const currentDate = new Date().toLocaleDateString();
      
      const [year, month] = selectedMonth.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, 1);
      const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const logoBase64 = await getImageBase64("/images/lol.jpeg");

      const addHeader = (doc, pageNumber = 1) => {
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, pageWidth, 40, 'F');

        try {
          doc.addImage(logoBase64, 'JPEG', 15, 8, 25, 25);
        } catch (error) {
          console.warn('Could not add logo:', error.message);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PETVERSE", 45, 18);

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Published Advertisements Report", 45, 26);

        doc.setFontSize(8);
        doc.text("New Kandy Road, Malabe • Tel: 0912345673", 45, 32);
        doc.text("www.petverse.com • mailtopetverse@gmail.com", 45, 36);

        const currentDateObj = new Date();
        const dateString = `Generated on: ${currentDateObj.toLocaleDateString()} at ${currentDateObj.toLocaleTimeString()}`;
        doc.setFontSize(8);
        const dateWidth = doc.getTextWidth(dateString);
        doc.text(dateString, pageWidth - dateWidth - 15, 32);

        const pageText = `Page ${pageNumber}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - pageTextWidth - 15, 36);
      };

      const addFooter = (doc) => {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont("helvetica", "normal");
        const footerText = "©️ 2025 PETVERSE. All rights reserved.";
        const footerWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
      };

      addHeader(doc);
      addFooter(doc);
      
      doc.setFontSize(16);
      doc.setTextColor(249, 115, 22);
      doc.text(`Published Advertisements Report - ${monthName}`, 20, 55);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      doc.text(`Report Generated: ${currentDate}`, 20, 65);
      doc.text(`Total Published Ads in ${monthName}: ${publishedAds.length}`, 20, 72);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 78, 190, 78);

      let yPosition = 88;
      let currentPageNumber = 1;
      let tableStartY = yPosition - 8; // Store the table start position
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      doc.setFillColor(30, 64, 175);
      doc.rect(20, tableStartY, 170, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      
      doc.text('#', 23, yPosition);
      doc.text('Title', 35, yPosition);
      doc.text('Provider', 70, yPosition);
      doc.text('Duration', 105, yPosition);
      doc.text('Revenue', 130, yPosition);
      doc.text('Published Date', 155, yPosition);
      
      yPosition += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      publishedAds.forEach((ad, index) => {
        if (yPosition > 250) {
          doc.addPage();
          currentPageNumber++;
          
          addHeader(doc, currentPageNumber);
          addFooter(doc);
          
          yPosition = 50;
          
          doc.setFillColor(30, 64, 175);
          doc.rect(20, yPosition - 8, 170, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont(undefined, 'bold');
          doc.setFontSize(11);
          
          doc.text('#', 23, yPosition);
          doc.text('Title', 35, yPosition);
          doc.text('Provider', 70, yPosition);
          doc.text('Duration', 105, yPosition);
          doc.text('Revenue', 130, yPosition);
          doc.text('Published Date', 155, yPosition);
          
          yPosition += 15;
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
        }
        
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, yPosition - 8, 170, 10, 'F');
        }
        
        const title = (ad.title || 'N/A').substring(0, 15) + (ad.title && ad.title.length > 15 ? '...' : '');
        const provider = (ad.serviceProvider?.fullName || "Unknown").substring(0, 12) + (ad.serviceProvider?.fullName && ad.serviceProvider.fullName.length > 12 ? '...' : '');
        const duration = `${ad.duration || 'N/A'} days`;
        const prices = { 15: 3000, 30: 5000, 60: 9000 };
        const revenue = `Rs ${(prices[ad.duration] || 0).toLocaleString()}`;
        const publishedDate = ad.approved_at ? new Date(ad.approved_at).toLocaleDateString() : 'N/A';
        
        doc.text((index + 1).toString(), 23, yPosition);
        doc.text(title, 35, yPosition);
        doc.text(provider, 70, yPosition);
        doc.text(duration, 105, yPosition);
        doc.text(revenue, 130, yPosition);
        doc.text(publishedDate, 155, yPosition);
        
        yPosition += 12;
      });
      
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, tableStartY, 170, yPosition - tableStartY);
      
      yPosition += 25;
      
      if (yPosition > 220) {
        doc.addPage();
        currentPageNumber++;
        
        addHeader(doc, currentPageNumber);
        addFooter(doc);
        
        yPosition = 50;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.setFont(undefined, 'bold');
      doc.text("Monthly Summary", 20, yPosition);
      
      doc.setDrawColor(30, 64, 175);
      doc.line(20, yPosition + 3, 80, yPosition + 3);
      yPosition += 18;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      doc.text("Total published advertisements:", 25, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(`${publishedAds.length}`, 140, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 12;
      
      const totalRevenue = publishedAds.reduce((sum, ad) => {
        const prices = { 15: 3000, 30: 5000, 60: 9000 };
        return sum + (prices[ad.duration] || 0);
      }, 0);
      
      doc.text("Total revenue generated:", 25, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(`Rs ${totalRevenue.toLocaleString()}`, 140, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 12;
      
      doc.text("Most popular duration:", 25, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(`${getMostCommonDuration(publishedAds)}`, 140, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 20;
      
      if (yPosition > 220) {
      doc.addPage();
      currentPageNumber++;
      
      addHeader(doc, currentPageNumber);
      addFooter(doc);
      
      yPosition = 50;
    }
    yPosition += 30; 

    if (yPosition > 230) {
      doc.addPage();
      currentPageNumber++;
      
      addHeader(doc, currentPageNumber);
      addFooter(doc);
      
      yPosition = 50;
    }  // <-- ADD THIS CLOSING BRACE

    doc.setDrawColor(0, 0, 0);
    doc.line(25, yPosition, 120, yPosition);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Manager Signature", 25, yPosition + 12);

    doc.line(140, yPosition, 190, yPosition);
    doc.text("Date", 140, yPosition + 12);

    doc.save(`PETVERSE_Published_Ads_Report_${monthName.replace(' ', '_')}.pdf`);

    console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please check the console for details.');
    }
    };
    
  const getMostCommonDuration = (ads) => {
    if (ads.length === 0) return 'N/A';
    
    const durations = ads.map(ad => ad.duration).filter(duration => duration);
    if (durations.length === 0) return 'N/A';
    
    const frequency = {};
    durations.forEach(duration => {
      frequency[duration] = (frequency[duration] || 0) + 1;
    });
    
    const mostCommon = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b, '15');
    return `${mostCommon} days`;
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/advertisements/${id}/approve`);
      fetchPendingAds();
      fetchApprovedAds();
    } catch (err) {
      console.error("Error approving ad:", err);
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/advertisements/${rejectionModal.adId}/reject`,
        { reason: rejectionModal.reason }
      );
      fetchPendingAds();
      fetchRejectedAds();
      setRejectionModal({ isOpen: false, adId: null, reason: "" });
    } catch (err) {
      console.error("Error rejecting ad:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/advertisements/${deleteModal.adId}`);
      fetchApprovedAds();
      setDeleteModal({ isOpen: false, adId: null, adTitle: "" });
    } catch (err) {
      console.error("Error deleting ad:", err);
    }
  };

  const openRejectionModal = (adId) => {
    setRejectionModal({ isOpen: true, adId, reason: "" });
  };

  const closeRejectionModal = () => {
    setRejectionModal({ isOpen: false, adId: null, reason: "" });
  };

  const openDeleteModal = (adId, adTitle) => {
    setDeleteModal({ isOpen: true, adId, adTitle });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, adId: null, adTitle: "" });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const paymentStatusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800"
    };

    const statusText = paymentStatus === "paid" ? "Published" : "Payment Pending";

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusStyles[paymentStatus] || "bg-gray-100 text-gray-800"}`}>
        {statusText}
      </span>
    );
  };

  useEffect(() => {
    fetchPendingAds();
    fetchApprovedAds();
    fetchRejectedAds();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Advertisement Management</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
              Select Month:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={generatePublishedAdsPDFReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generate Published Ads Report</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending ({pendingAds.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "approved"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Approved ({approvedAds.length})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "rejected"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Rejected ({rejectedAds.length})
          </button>
        </nav>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Advertisements</h2>
          {pendingAds.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No pending advertisements for review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advertisement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingAds.map((ad) => (
                    <tr key={ad._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {ad.imageUrl && (
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{ad.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{ad.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Duration: {ad.duration} days</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {ad.serviceProvider?.fullName || "Unknown Provider"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ad.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentStatusBadge(ad.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ad.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(ad._id)}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectionModal(ad._id)}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "approved" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Approved Advertisements</h2>
          {approvedAds.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No approved advertisements yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advertisement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvedAds.map((ad) => (
                    <tr key={ad._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {ad.imageUrl && (
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{ad.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{ad.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Duration: {ad.duration} days</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {ad.serviceProvider?.fullName || "Unknown Provider"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ad.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentStatusBadge(ad.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ad.approved_at ? new Date(ad.approved_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ad.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDeleteModal(ad._id, ad.title)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "rejected" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Rejected Advertisements</h2>
          {rejectedAds.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No rejected advertisements yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advertisement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rejection Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rejectedAds.map((ad) => (
                    <tr key={ad._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {ad.imageUrl && (
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{ad.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{ad.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Duration: {ad.duration} days</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {ad.serviceProvider?.fullName || "Unknown Provider"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ad.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentStatusBadge(ad.paymentStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={ad.rejectionReason}>
                          {ad.rejectionReason || "No reason provided"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ad.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Advertisement</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this advertisement:
              </p>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-400 bg-gray-100 text-black rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={closeRejectionModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionModal.reason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Advertisement</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete the advertisement "{deleteModal.adTitle}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdAdmin;