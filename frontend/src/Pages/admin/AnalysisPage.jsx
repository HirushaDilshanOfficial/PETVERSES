import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getIdToken } from '../../utils/authUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

function AnalysisPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeServices: 0,
    totalRevenue: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // Default to 30 days
  const [notification, setNotification] = useState(null);
  const intervalRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Helper function to convert image to base64
  const getImageBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Important for same-origin images
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

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch data from backend
  const fetchData = async () => {
    try {
      const token = await getIdToken();
      
      // Fetch dashboard statistics
      const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const statsData = await statsResponse.json();
      console.log('Dashboard stats:', statsData);
      
      if (statsData.success) {
        setDashboardStats({
          totalUsers: statsData.stats.totalUsers || 0,
          activeServices: statsData.stats.activeServices || 0,
          totalRevenue: statsData.stats.totalRevenue || 0,
          // We'll still calculate totalOrders from orders data
        });
      }
      
      // Fetch payments data
      const paymentsResponse = await fetch(`${API_BASE_URL}/payments/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!paymentsResponse.ok) {
        throw new Error('Failed to fetch payments data');
      }
      
      const paymentsData = await paymentsResponse.json();
      console.log('Payments data:', paymentsData);
      setPayments(Array.isArray(paymentsData.payments) ? paymentsData.payments : []);
      
      // Fetch orders data
      const ordersResponse = await fetch(`${API_BASE_URL}/orders/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders data');
      }
      
      const ordersData = await ordersResponse.json();
      console.log('Orders data:', ordersData);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      
      // Update totalOrders in dashboard stats
      setDashboardStats(prevStats => ({
        ...prevStats,
        totalOrders: Array.isArray(ordersData) ? ordersData.length : 0
      }));
      
      // Fetch services data (we still need this for the detailed service information)
      const servicesResponse = await fetch(`${API_BASE_URL}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!servicesResponse.ok) {
        throw new Error('Failed to fetch services data');
      }
      
      const servicesData = await servicesResponse.json();
      console.log('Services data:', servicesData);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      
      // Fetch users data (we still need this for the detailed user information)
      const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users data');
      }
      
      const usersData = await usersResponse.json();
      console.log('Users data:', usersData);
      setUsers(Array.isArray(usersData.users) ? usersData.users : []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Filter data by date range
  const filterDataByDate = (data, days) => {
    if (days === 'all') return data;
    
    const now = new Date();
    let cutoffDate;
    
    switch (days) {
      case '1':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case '7':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case '30':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case '90':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case '180':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 180);
        break;
      case '365':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - parseInt(days));
    }
    
    // Set time to beginning of the day for more accurate filtering
    cutoffDate.setHours(0, 0, 0, 0);
    
    return data.filter(item => {
      // Handle different date field names
      const itemDate = new Date(item.createdAt || item.paidAt || item.date || item.created);
      return itemDate >= cutoffDate;
    });
  };

  // Process data for charts
  const processDataForCharts = () => {
    const filteredPayments = filterDataByDate(payments, dateRange);
    const filteredOrders = filterDataByDate(orders, dateRange);
    const filteredUsers = filterDataByDate(users, dateRange);
    
    // Group payments by date
    const paymentData = {};
    filteredPayments.forEach(payment => {
      // Use paidAt if available, otherwise use createdAt
      const date = new Date(payment.paidAt || payment.createdAt || payment.created).toISOString().split('T')[0];
      if (!paymentData[date]) {
        paymentData[date] = { count: 0, revenue: 0 };
      }
      paymentData[date].count += 1;
      paymentData[date].revenue += payment.amount || 0;
    });
    
    // Group orders by date
    const orderData = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.date || order.createdAt || order.created).toISOString().split('T')[0];
      if (!orderData[date]) {
        orderData[date] = { count: 0, revenue: 0 };
      }
      orderData[date].count += 1;
      orderData[date].revenue += order.totalAmount || 0;
    });
    
    // Group users by date (user growth)
    const userData = {};
    filteredUsers.forEach(user => {
      const date = new Date(user.createdAt || user.created).toISOString().split('T')[0];
      if (!userData[date]) {
        userData[date] = { count: 0 };
      }
      userData[date].count += 1;
    });
    
    // Sort dates
    const sortedPaymentDates = Object.keys(paymentData).sort();
    const sortedOrderDates = Object.keys(orderData).sort();
    const sortedUserDates = Object.keys(userData).sort();
    
    // Payment trends data
    const paymentTrendsData = {
      labels: sortedPaymentDates,
      datasets: [
        {
          label: 'Payment Count',
          data: sortedPaymentDates.map(date => paymentData[date]?.count || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
          tension: 0.4,
        },
        {
          label: 'Revenue ($)',
          data: sortedPaymentDates.map(date => paymentData[date]?.revenue || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
          tension: 0.4,
        }
      ]
    };
    
    // Order trends data
    const orderTrendsData = {
      labels: sortedOrderDates,
      datasets: [
        {
          label: 'Order Count',
          data: sortedOrderDates.map(date => orderData[date]?.count || 0),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y',
          tension: 0.4,
        },
        {
          label: 'Revenue ($)',
          data: sortedOrderDates.map(date => orderData[date]?.revenue || 0),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          yAxisID: 'y1',
          tension: 0.4,
        }
      ]
    };
    
    // User growth data
    const userGrowthData = {
      labels: sortedUserDates,
      datasets: [
        {
          label: 'New Users',
          data: sortedUserDates.map(date => userData[date]?.count || 0),
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.4,
        }
      ]
    };
    

    
    // Payment methods distribution (Bar chart) - New requirement
    const paymentMethodsBarData = {
      labels: ['Online', 'Bank Transfer', 'COD'],
      datasets: [
        {
          label: 'Number of Orders',
          data: [
            filteredOrders.filter(order => order.paymentMethod === 'online').length,
            filteredOrders.filter(order => order.paymentMethod === 'bank_transfer').length,
            filteredOrders.filter(order => order.paymentMethod === 'cod').length
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(255, 99, 132, 0.8)'
          ],
          borderColor: [
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(255, 99, 132)'
          ],
          borderWidth: 1,
        }
      ]
    };
    
    return {
      paymentTrendsData,
      orderTrendsData,
      userGrowthData,
      paymentMethodsBarData, // New bar chart data
      totalRevenue: filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      totalOrders: filteredOrders.length
    };
  };

  // Generate recent activity
  const generateRecentActivity = (services) => {
    // Sort services by creation date (newest first)
    const sortedServices = [...services].sort((a, b) => 
      new Date(b.createdAt || b.created) - new Date(a.createdAt || a.created)
    );
    
    // Take the 5 most recent services
    const recentServices = sortedServices.slice(0, 5);
    
    // Map to activity format
    return recentServices.map(service => ({
      id: service._id,
      type: 'service',
      title: service.title,
      provider: service.provider?.fullName || 'Unknown Provider',
      time: new Date(service.createdAt || service.created).toLocaleString(),
      status: service.service_status || 'pending'
    }));
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data.length) {
      showNotification('No data to export', 'error');
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(field => 
        typeof field === 'string' ? `"${field.replace(/"/g, '""')}"` : field
      ).join(',')
    ).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`${filename} exported successfully!`);
  };

  // Export to PDF with Header and Footer
  const exportToPDF = async (data, filename, title) => {
    if (!data.length) {
      showNotification('No data to export', 'error');
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let pageNumber = 1;

    // Load logo image from public folder
    let logoBase64;
    try {
      logoBase64 = await getImageBase64("/images/lol.jpeg");
    } catch (error) {
      console.error('Failed to load logo:', error);
      // Continue without logo if it fails to load
    }

    // Header function
    const addHeader = (doc) => {
      // Header background
      doc.setFillColor(30, 64, 175); // Orange background
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Add logo if available
      if (logoBase64) {
        doc.addImage(logoBase64, "JPEG", 15, 8, 25, 25);
      }

      // Company name and title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PETVERSE", 45, 18);

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(title, 45, 26);

      // Contact info
      doc.setFontSize(8);
      doc.text("New Kandy Road, Malabe • Tel: 091-2345675", 45, 32);
      doc.text("www.petverse.com • mailtopetverse@gmail.com", 45, 36);

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
    
    // Prepare table data
    const headers = Object.keys(data[0]);
    const rows = data.map(row => Object.values(row));
    
    // Check if autoTable method exists
    if (typeof doc.autoTable === 'function') {
      // Add table using the autoTable method
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 50, // Start after header
        margin: { top: 50, bottom: 25 }, // Leave space for header and footer
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
        didDrawPage: function(data) {
          // Add header and footer to each new page
          if (data.pageNumber > 1) {
            pageNumber = data.pageNumber;
            addHeader(doc);
          }
          addFooter(doc);
        }
      });
    } else {
      // Fallback for when autoTable is not available
      console.error('autoTable method not available on jsPDF instance');
      showNotification('PDF export failed: autoTable not available', 'error');
      return;
    }
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
    showNotification(`${filename} exported successfully!`);
  };

  // Export payments data
  const exportPaymentsData = (format) => {
    const filteredPayments = filterDataByDate(payments, dateRange);
    const exportData = filteredPayments.map(payment => ({
      id: payment._id,
      orderId: payment.orderID?._id || 
               (typeof payment.orderID === 'string' ? payment.orderID : 'N/A') || 
               'N/A',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'N/A',
      status: payment.status,
      paidAt: new Date(payment.paidAt || payment.createdAt || payment.created).toLocaleString()
    }));
    
    if (format === 'csv') {
      exportToCSV(exportData, 'payments');
    } else {
      exportToPDF(exportData, 'payments', 'Payments Report');
    }
  };

  // Export orders data
  const exportOrdersData = (format) => {
    const filteredOrders = filterDataByDate(orders, dateRange);
    console.log('Exporting orders data:', filteredOrders);
    const exportData = filteredOrders.map(order => ({
      id: order._id,
      userId: order.userID?._id || 
              (typeof order.userID === 'string' ? order.userID : 'N/A') || 
              'N/A',
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: new Date(order.date || order.createdAt || order.created).toLocaleString()
    }));
    
    console.log('Export data:', exportData);
    
    if (format === 'csv') {
      exportToCSV(exportData, 'orders');
    } else {
      exportToPDF(exportData, 'orders', 'Orders Report');
    }
  };

  // Export user growth data
  const exportUserGrowthData = (format) => {
    const { userGrowthData } = processDataForCharts();
    const exportData = userGrowthData.labels.map((label, index) => ({
      date: label,
      newUserCount: userGrowthData.datasets[0].data[index]
    }));
    
    if (format === 'csv') {
      exportToCSV(exportData, 'user-growth');
    } else {
      exportToPDF(exportData, 'user-growth', 'User Growth Report');
    }
  };

  // Export payment methods data
  const exportPaymentMethodsData = (format) => {
    const { paymentMethodsBarData } = processDataForCharts();
    const exportData = paymentMethodsBarData.labels.map((label, index) => ({
      paymentMethod: label,
      orderCount: paymentMethodsBarData.datasets[0].data[index]
    }));
    
    if (format === 'csv') {
      exportToCSV(exportData, 'payment-methods');
    } else {
      exportToPDF(exportData, 'payment-methods', 'Payment Methods Distribution');
    }
  };

  // Initialize data fetching
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchData();
      
      // Set up interval for real-time updates (every 30 seconds)
      intervalRef.current = setInterval(fetchData, 30000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentUser, dateRange]);

  // Process chart data
  const {
    paymentTrendsData,
    orderTrendsData,
    userGrowthData,
    paymentMethodsBarData, // New bar chart data
    totalRevenue,
    totalOrders
  } = processDataForCharts();
  
  // Calculate total services (we still need this for the display)
  const totalServices = services.length;
  
  // Generate recent activity
  const recentActivity = generateRecentActivity(services);

  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };



  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Growth'
      }
    },
  };

  const paymentMethodsBarChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Payment Methods Distribution'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track payments, orders, and service performance
              </p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row md:mt-0 md:ml-4 space-y-2 sm:space-y-0 sm:space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="1">Today</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
              <button
                onClick={() => navigate('/admin/geographic-analysis')}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Geographic View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  LKR {loading ? '...' : dashboardStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardStats.totalOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardStats.activeServices} <span className="text-sm font-normal text-gray-500">/ {totalServices}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardStats.totalUsers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Payment Trends</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportPaymentsData('csv')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportPaymentsData('pdf')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Line data={paymentTrendsData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Order Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Trends</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportOrdersData('csv')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportOrdersData('pdf')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Line data={orderTrendsData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods Distribution (Bar Chart) */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Payment Methods Distribution</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportPaymentMethodsData('csv')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportPaymentMethodsData('pdf')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Bar data={paymentMethodsBarData} options={paymentMethodsBarChartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Order Trends Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Order Trends</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => exportOrdersData('csv')}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => exportOrdersData('pdf')}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
              >
                PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const filteredOrdersData = filterDataByDate(orders, dateRange);
                    console.log('Filtered orders data:', filteredOrdersData);
                    return filteredOrdersData.length > 0 ? (
                      filteredOrdersData.slice(0, 10).map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order._id?.substring(0, 8) || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.userID?._id?.substring(0, 8) || 
                             (typeof order.userID === 'string' ? order.userID.substring(0, 8) : 'N/A') || 
                             'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${order.totalAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.paymentMethod === 'online' ? 'Online' : 
                             order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                             order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                             order.paymentMethod || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.date || order.createdAt || order.created).toLocaleString() || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    );
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Growth and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportUserGrowthData('csv')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportUserGrowthData('pdf')}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Line data={userGrowthData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Recent Service Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Service Activity</h2>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-gray-200 rounded-full w-10 h-10 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <div className="bg-blue-100 rounded-full p-2">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Provider: {activity.provider}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : activity.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2">No recent service activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default AnalysisPage;