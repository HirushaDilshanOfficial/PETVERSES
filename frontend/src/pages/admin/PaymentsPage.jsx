import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getIdToken } from '../../utils/authUtils';
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

function PaymentsPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  
  // State for payments and UI
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for notifications
  const [notifications, setNotifications] = useState([]);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Fetch payments
  const fetchPayments = async () => {
    try {
      console.log('Fetching payments... Auth loading:', authLoading);
      console.log('Current user:', currentUser);
      
      if (authLoading) return; // Wait for auth to load
      
      // Check if user is authenticated and is an admin
      if (!currentUser || currentUser.role !== 'admin') {
        console.log('User not authenticated or not admin');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Get Firebase ID token for authentication
      const token = await getIdToken();
      console.log('Token obtained:', token ? 'Yes' : 'No');
      
      const response = await fetch(`${API_BASE_URL}/payments/admin/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      // Check if data has success property and payments array
      if (data.success && Array.isArray(data.payments)) {
        setPayments(data.payments);
      } else {
        // Handle case where data structure is different
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(`Failed to fetch payments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load payments on component mount
  useEffect(() => {
    console.log('PaymentsPage useEffect triggered. Auth loading:', authLoading, 'User:', currentUser);
    if (authLoading) return; // Wait for auth to load
    
    // Check if user is authenticated and is an admin
    if (currentUser && currentUser.role === 'admin') {
      fetchPayments();
    } else if (currentUser && currentUser.role !== 'admin') {
      setError('Access denied. You must be an administrator to view this page.');
      setLoading(false);
    } else if (!currentUser && !authLoading) {
      setError('Please log in as an administrator to view this page.');
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  // Filter payments based on search term and status
  const filteredPayments = payments.filter(payment => {
    // First letter matching logic
    if (searchTerm) {
      const searchTermTrimmed = searchTerm.trim();
      if (!searchTermTrimmed) {
        // If no search term, just filter by status
        return filterStatus === 'all' || payment.status === filterStatus;
      }
      
      const firstLetter = searchTermTrimmed.charAt(0).toLowerCase();
      const searchLower = searchTermTrimmed.toLowerCase();
      
      // First letter matching - check if any field starts with the first letter
      const hasFirstLetterMatch = 
        (payment.transactionID && payment.transactionID.toLowerCase().startsWith(firstLetter)) ||
        (payment.orderID && payment.orderID.toString().toLowerCase().startsWith(firstLetter)) ||
        (payment.paymentID && payment.paymentID.toLowerCase().startsWith(firstLetter)) ||
        (payment.status && payment.status.toLowerCase().startsWith(firstLetter));
      
      // Substring matching - check if any field contains the search term
      const hasSubstringMatch = 
        (payment.transactionID && payment.transactionID.toLowerCase().includes(searchLower)) ||
        (payment.orderID && payment.orderID.toString().toLowerCase().includes(searchLower)) ||
        (payment.paymentID && payment.paymentID.toLowerCase().includes(searchLower)) ||
        (payment.status && payment.status.toLowerCase().includes(searchLower));
      
      // Check if either first letter matches or substring matches
      const matchesSearch = hasFirstLetterMatch || hasSubstringMatch;
      const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    }
    
    // If no search term, just filter by status
    return filterStatus === 'all' || payment.status === filterStatus;
  });

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Function to export payments to CSV
  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = ['Payment ID', 'Transaction ID', 'Order ID', 'Amount', 'Status', 'Paid At'];
      const csvContent = [
        headers.join(','),
        ...filteredPayments.map(payment => [
          `"${payment.paymentID || 'N/A'}"`,
          `"${payment.transactionID || 'N/A'}"`,
          `"${payment.orderID ? (typeof payment.orderID === 'object' ? payment.orderID._id : payment.orderID) : 'N/A'}"`,
          `"${payment.amount ? parseFloat(payment.amount).toFixed(2) : '0.00'}"`,
          `"${payment.status || 'N/A'}"`,
          `"${payment.paidAt ? formatDate(payment.paidAt) : 'N/A'}"`
        ].join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('CSV exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showNotification('Failed to export CSV. Please try again.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
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
          {error && <p className="text-red-500 mt-2">Error: {error}</p>}
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

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-2">Manage all payments in the system</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction ID, order ID, payment ID, or status..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
            
            {/* Status Filter */}
            <div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={fetchPayments}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payments Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No payments found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id || payment.paymentID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.paymentID || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transactionID || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.orderID ? (typeof payment.orderID === 'object' ? payment.orderID._id : payment.orderID) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Rs. {payment.amount ? parseFloat(payment.amount).toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paidAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentsPage;