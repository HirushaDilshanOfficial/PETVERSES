import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [pendingAds, setPendingAds] = useState([]);
  const [approvedAds, setApprovedAds] = useState([]);
  const [rejectedAds, setRejectedAds] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    adId: null,
    reason: ""
  });

  const fetchPendingAds = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/advertisements/pending`);
      setPendingAds(res.data);
    } catch (err) {
      console.error("Error fetching pending ads:", err);
    }
  };

  const fetchApprovedAds = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/advertisements/approved`);
      setApprovedAds(res.data);
    } catch (err) {
      console.error("Error fetching approved ads:", err);
    }
  };

  const fetchRejectedAds = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/advertisements/rejected`);
      setRejectedAds(res.data);
    } catch (err) {
      console.error("Error fetching rejected ads:", err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/advertisements/${id}/approve`);
      fetchPendingAds();
      fetchApprovedAds();
    } catch (err) {
      console.error("Error approving ad:", err);
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/advertisements/${rejectionModal.adId}/reject`,
        { reason: rejectionModal.reason }
      );
      fetchPendingAds();
      fetchRejectedAds();
      setRejectionModal({ isOpen: false, adId: null, reason: "" });
    } catch (err) {
      console.error("Error rejecting ad:", err);
    }
  };

  const openRejectionModal = (adId) => {
    setRejectionModal({ isOpen: true, adId, reason: "" });
  };

  const closeRejectionModal = () => {
    setRejectionModal({ isOpen: false, adId: null, reason: "" });
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

  useEffect(() => {
    fetchPendingAds();
    fetchApprovedAds();
    fetchRejectedAds();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Advertisement Management</h1>

      {/* Tab Navigation */}
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

      {/* Pending Ads Tab */}
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

      {/* Approved Ads Tab */}
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
                      Approved Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ad.approved_at ? new Date(ad.approved_at).toLocaleDateString() : "N/A"}
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

      {/* Rejected Ads Tab */}
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

      {/* Rejection Modal */}
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
    </div>
  );
};

export default AdminDashboard;