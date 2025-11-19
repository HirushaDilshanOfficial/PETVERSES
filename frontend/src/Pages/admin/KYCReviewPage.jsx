import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getIdToken } from '../../utils/authUtils';

// Simple KYC Review Page for beginners
function KYCReviewPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  
  // State for KYC requests and UI
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State for notifications
  const [notifications, setNotifications] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Fetch pending KYC requests
  const fetchPendingRequests = async (page = 1) => {
    try {
      if (authLoading) return; // Wait for auth to load
      // Check if user is authenticated and is an admin
      if (!currentUser || currentUser.role !== 'admin') return;
      
      setLoading(true);
      setError(null);
      
      // Get Firebase ID token for authentication
      const token = await getIdToken();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', 10);
      queryParams.append('role', 'serviceProvider');
      
      // For pending requests, we want unverified or rejected providers
      if (filterStatus === 'pending') {
        queryParams.append('verified', 'false');
      } else if (filterStatus === 'approved') {
        queryParams.append('verified', 'true');
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/users?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPendingRequests(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setError('Failed to fetch pending KYC requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load pending KYC requests on component mount
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    // Check if user is authenticated and is an admin
    if (currentUser && currentUser.role === 'admin') {
      fetchPendingRequests(currentPage);
    }
  }, [currentUser, filterStatus, currentPage, authLoading, searchTerm]);

  // Handle search term change with validation
  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Allow only letters and numbers
    if (/^[a-zA-Z0-9]*$/.test(value) || value === '') {
      setSearchTerm(value);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Filter service providers based on search and status
  const filteredRequests = pendingRequests.filter(request => {
    const matchesSearch = 
      (request.fullName && request.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.email && request.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.nicNumber && request.nicNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by verification status
    let matchesStatus = true;
    if (filterStatus === 'pending') {
      // Show both unverified and rejected providers in pending list
      matchesStatus = !request.verification?.isVerified || request.verification?.isRejected;
    } else if (filterStatus === 'approved') {
      matchesStatus = request.verification?.isVerified && !request.verification?.isRejected;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Approve service provider
  const approveRequest = async (userId) => {
    try {
      const token = await getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVerified: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve service provider');
      }
      
      // Refresh service providers
      fetchPendingRequests(currentPage);
      
      showNotification('Service provider approved successfully!');
      
    } catch (err) {
      console.error('Error approving service provider:', err);
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  // Show reject modal with reason input
  const showRejectModalWithReason = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Reject service provider
  const rejectRequest = async () => {
    if (!rejectionReason.trim()) {
      showNotification('Please provide a rejection reason', 'error');
      return;
    }

    try {
      const token = await getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/auth/users/${selectedRequest._id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVerified: false,
          isRejected: true,
          rejectionReason: rejectionReason
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject service provider');
      }
      
      // Refresh service providers
      fetchPendingRequests(currentPage);
      
      // Close modal
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      
      showNotification('Service provider rejected successfully!');
      
    } catch (err) {
      console.error('Error rejecting service provider:', err);
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  // View service provider details
  const viewRequest = async (request) => {
    try {
      // Fetch the most up-to-date user information
      const token = await getIdToken();
      const response = await fetch(`${API_BASE_URL}/auth/users/${request._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedRequest(data.user);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      showNotification('Failed to fetch user details. Please try again.', 'error');
      // Fallback to using the existing request data
      setSelectedRequest(request);
      setShowViewModal(true);
    }
  };

  // Get verification status text and styling
  const getVerificationStatus = (verification) => {
    if (verification?.isVerified) {
      return { text: 'Verified', className: 'bg-green-100 text-green-800' };
    } else if (verification?.isRejected) {
      return { text: 'Rejected', className: 'bg-red-100 text-red-800' };
    } else {
      return { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // Function to show notification
  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    const newNotification = { id, message, type };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 3000);
  };

  // Export KYC data to PDF
  const exportToPDF = async () => {
    try {
      // Import jsPDF and autoTable dynamically to avoid loading issues
      const jsPDF = (await import('jspdf')).jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Create new PDF document in landscape mode for better data display
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Helper function to convert image to base64
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
      
      // Load logo image from public folder
      let logoBase64 = null;
      try {
        logoBase64 = await getImageBase64("/images/lol.jpeg");
      } catch (imageError) {
        console.warn('Could not load logo image:', imageError);
        // Continue without image if loading fails
      }
      
      // Header function
      const addHeader = (doc, pageNumber = 1) => {
        // Header background
        doc.setFillColor(30, 64, 175); // Blue background
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Add logo if available
        if (logoBase64) {
          doc.addImage(logoBase64, 'JPEG', 15, 8, 25, 25); // x, y, width, height
        }
        
        // Company name and title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PETVERSE", 45, 18);

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("KYC Review Report", 45, 26);

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
      
      // Add filter information below the header
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      let filterText = 'Filters: ';
      if (filterStatus === 'pending') {
        filterText += 'Pending Verification';
      } else if (filterStatus === 'approved') {
        filterText += 'Verified Providers';
      }
      doc.text(filterText, pageWidth / 2, 50, null, null, 'center');
      
      // Add summary statistics with better visual presentation
      const totalRequests = pendingRequests.length;
      const pendingRequestsCount = pendingRequests.filter(r => !r.verification?.isVerified && !r.verification?.isRejected).length;
      const verifiedRequests = pendingRequests.filter(r => r.verification?.isVerified && !r.verification?.isRejected).length;
      const rejectedRequests = pendingRequests.filter(r => r.verification?.isRejected).length;
      
      // Add a line separator
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(20, 55, pageWidth - 20, 55);
      
      // Add summary boxes
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      
      // Background boxes for statistics
      doc.setFillColor(30, 64, 175);
      doc.roundedRect(20, 60, 65, 25, 2, 2, 'F');
      doc.text(`Total: ${totalRequests}`, 52.5, 75, null, null, 'center');
      
      doc.setFillColor(255, 193, 7);
      doc.roundedRect(87, 60, 65, 25, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text(`Pending: ${pendingRequestsCount}`, 119.5, 75, null, null, 'center');
      
      doc.setFillColor(40, 167, 69);
      doc.roundedRect(154, 60, 65, 25, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Verified: ${verifiedRequests}`, 186.5, 75, null, null, 'center');
      
      doc.setFillColor(220, 53, 69);
      doc.roundedRect(221, 60, 65, 25, 2, 2, 'F');
      doc.text(`Rejected: ${rejectedRequests}`, 253.5, 75, null, null, 'center');
      
      // Prepare table data with better formatting
      const tableData = filteredRequests.map(request => [
        request.fullName || 'N/A',
        request.email || 'N/A',
        request.phoneNumber || 'N/A',
        new Date(request.createdAt).toLocaleDateString() || 'N/A',
        request.verification?.isVerified ? 'Verified' : 
        request.verification?.isRejected ? 'Rejected' : 'Pending'
      ]);
      
      // Add table with enhanced styling
      autoTable(doc, {
        head: [['Name', 'Email', 'Phone', 'Submitted Date', 'Status']],
        body: tableData,
        startY: 92,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [30, 64, 175], // Blue color from PETVERSE theme
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        pageBreak: 'auto',
        margin: { top: 50, bottom: 30 }, // Adjusted margins
        didDrawPage: function(data) {
          // Add header and footer to each page
          if (data.pageNumber > 1) {
            addHeader(doc, data.pageNumber);
          }
          addFooter(doc);
        }
      });
      
      // Save the PDF with metadata
      const date = new Date().toLocaleDateString();
      const fileName = `petverse-kyc-${date.replace(/\//g, '-')}.pdf`;
      doc.setProperties({
        title: 'PETVERSE KYC Review Report',
        subject: 'KYC Review Report',
        author: 'PETVERSE Admin System',
        keywords: 'kyc, verification, service providers, pet, petverse'
      });
      
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showNotification('Failed to export PDF. Please try again.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading KYC review...</p>
        </div>
      </div>
    );
  }

  // Show a message if user is not authenticated or not an admin
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
    <div className="p-6">
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-2" />
            )}
            <span>{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">KYC Review</h1>
        <p className="text-gray-600 mt-2">Review and approve service provider documents</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service providers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={() => fetchPendingRequests(currentPage)}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filter Section */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email (letters and numbers only)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export PDF
              </button>
              
              {/* Status Filter */}
              <div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="pending">Pending Verification</option>
                  <option value="approved">Verified Providers</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Providers Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Provider Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No service providers found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const statusInfo = getVerificationStatus(request.verification);
                    return (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.fullName}</div>
                            <div className="text-sm text-gray-500">{request.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>{request.phoneNumber}</div>
                          <div className="text-sm text-gray-500">{request.address}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewRequest(request)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View
                            </button>
                            {/* Show actions only for pending providers (unverified, not rejected) */}
                            {!request.verification?.isVerified && !request.verification?.isRejected && (
                              <>
                                <button
                                  onClick={() => approveRequest(request._id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    showRejectModalWithReason(request);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                  Reject
                                </button>
                              </>
                            )}
                            {/* Show only approve button for rejected providers */}
                            {request.verification?.isRejected && (
                              <button
                                onClick={() => approveRequest(request._id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                              >
                                <CheckIcon className="h-4 w-4" />
                                Re-Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Provider Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Provider Documents</h3>
            
            {/* Provider Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Provider Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Name:</strong> {selectedRequest.fullName}</p>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>Phone:</strong> {selectedRequest.phoneNumber}</p>
                <p><strong>Address:</strong> {selectedRequest.address}</p>
                <p><strong>NIC Number:</strong> {selectedRequest.nicNumber}</p>
                <p><strong>Registered:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Document Preview */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Uploaded Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* NIC Front Photo */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">NIC Front</p>
                  {selectedRequest.documents?.nicFrontPhoto ? (
                    <img 
                      src={selectedRequest.documents.nicFrontPhoto} 
                      alt="NIC Front" 
                      className="border border-gray-300 rounded-lg w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-40 flex items-center justify-center">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* NIC Back Photo */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">NIC Back</p>
                  {selectedRequest.documents?.nicBackPhoto ? (
                    <img 
                      src={selectedRequest.documents.nicBackPhoto} 
                      alt="NIC Back" 
                      className="border border-gray-300 rounded-lg w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-40 flex items-center justify-center">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Face Photo */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Face Photo</p>
                  {selectedRequest.documents?.facePhoto ? (
                    <img 
                      src={selectedRequest.documents.facePhoto} 
                      alt="Face Photo" 
                      className="border border-gray-300 rounded-lg w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-40 flex items-center justify-center">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Business Documents */}
              {selectedRequest.documents?.businessDocuments && selectedRequest.documents.businessDocuments.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-gray-900 mb-2">Business Documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRequest.documents.businessDocuments.map((doc, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                        {doc.fileUrl ? (
                          <img 
                            src={doc.fileUrl} 
                            alt={doc.fileName} 
                            className="mt-2 w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verification Status */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Verification Status</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    selectedRequest.verification?.isVerified ? 'bg-green-100 text-green-800' :
                    selectedRequest.verification?.isRejected ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedRequest.verification?.isVerified ? 'Verified' : 
                     selectedRequest.verification?.isRejected ? 'Rejected' : 'Pending'}
                  </span>
                </p>
                {selectedRequest.verification?.verifiedAt && (
                  <p className="mt-2"><strong>Verified At:</strong> {new Date(selectedRequest.verification.verifiedAt).toLocaleString()}</p>
                )}
                {selectedRequest.verification?.verifiedBy && (
                  <p className="mt-1"><strong>Verified By:</strong> {selectedRequest.verification.verifiedBy.fullName}</p>
                )}
                {selectedRequest.verification?.rejectionReason && (
                  <p className="mt-1"><strong>Rejection Reason:</strong> {selectedRequest.verification.rejectionReason}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {/* Show actions only for pending providers (unverified, not rejected) */}
              {!selectedRequest.verification?.isVerified && !selectedRequest.verification?.isRejected && (
                <>
                  <button
                    onClick={() => {
                      approveRequest(selectedRequest._id);
                      setShowViewModal(false);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <CheckIcon className="h-5 w-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      showRejectModalWithReason(selectedRequest);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    Reject
                  </button>
                </>
              )}
              {/* Show only approve button for rejected providers */}
              {selectedRequest.verification?.isRejected && (
                <button
                  onClick={() => {
                    approveRequest(selectedRequest._id);
                    setShowViewModal(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  Re-Approve
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Provider Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Service Provider</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Provider: {selectedRequest.fullName}</p>
              <p className="text-sm text-gray-600 mb-4">Email: {selectedRequest.email}</p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                rows="4"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                }}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={rejectRequest}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
              >
                Reject Provider
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KYCReviewPage;
