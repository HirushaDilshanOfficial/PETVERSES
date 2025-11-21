import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getIdToken } from '../../utils/authUtils';
import { useNavigate } from 'react-router-dom';

// Navbar Component
function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signout } = useAuth();
  const navigate = useNavigate();

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const delayDebounce = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Validate search term (at least 1 character)
    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsLoading(true);
    setShowSearchResults(true);

    try {
      // In a real implementation, you would call your API here
      // For now, we'll simulate results based on first letter
      const results = [];
      const firstLetter = query.trim().charAt(0).toLowerCase();
      
      // Generate mock results based on first letter
      if (/^[a-zA-Z]$/.test(firstLetter)) {
        // Users starting with the letter
        const users = [
          { id: 1, type: 'user', name: 'Alice Johnson', email: 'alice@example.com', role: 'Pet Owner' },
          { id: 2, type: 'user', name: 'Andrew Smith', email: 'andrew@example.com', role: 'Service Provider' },
          { id: 3, type: 'user', name: 'Anna Brown', email: 'anna@example.com', role: 'Pet Owner' }
        ].filter(user => user.name.toLowerCase().startsWith(firstLetter));
        
        results.push(...users);
        
        // Products starting with the letter
        const products = [
          { id: 1, type: 'product', name: 'Acana Dog Food', category: 'Food', price: 'LKR 2500' },
          { id: 2, type: 'product', name: 'Applaws Cat Food', category: 'Food', price: 'LKR 3200' },
          { id: 3, type: 'product', name: 'Amazon Bird Toy', category: 'Toys', price: 'LKR 1200' }
        ].filter(product => product.name.toLowerCase().startsWith(firstLetter));
        
        results.push(...products);
        
        // Services starting with the letter
        const services = [
          { id: 1, type: 'service', name: 'Animal Grooming', category: 'Grooming', price: 'LKR 1500' },
          { id: 2, type: 'service', name: 'Aquarium Care', category: 'Aquarium', price: 'LKR 2000' }
        ].filter(service => service.name.toLowerCase().startsWith(firstLetter));
        
        results.push(...services);
      } else if (/^\d$/.test(firstLetter)) {
        // Orders starting with the digit
        const orders = [
          { id: 1, type: 'order', orderId: '#123456', amount: 'LKR 5000', status: 'Completed' },
          { id: 2, type: 'order', orderId: '#189023', amount: 'LKR 3200', status: 'Pending' }
        ].filter(order => order.orderId.toLowerCase().includes(firstLetter));
        
        results.push(...orders);
      }
      
      // If no specific matches but we have a query, show some generic results
      if (results.length === 0 && query.trim().length >= 1) {
        results.push(
          { id: 1, type: 'user', name: 'Sample User', email: 'sample@example.com', role: 'Pet Owner' },
          { id: 2, type: 'product', name: 'Sample Product', category: 'Category', price: 'LKR 1000' }
        );
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to search results page
      navigate(`/admin/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleResultClick = (result) => {
    setSearchTerm('');
    setShowSearchResults(false);
    
    // Navigate based on result type
    switch (result.type) {
      case 'user':
        navigate('/admin/users');
        break;
      case 'product':
        navigate('/admin/inventory');
        break;
      case 'order':
        navigate('/admin/orders');
        break;
      default:
        navigate(`/admin/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signout();
        // Navigate to home page after logout
        navigate('/');
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  };

  const goToProfile = () => {
    setShowDropdown(false);
    alert('Profile page would be opened here');
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 relative search-container">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearchSubmit} className="relative">
            <svg className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users, products, orders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="px-4 py-3 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500 mr-2"></div>
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Search Results
                    </div>
                    {searchResults.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleResultClick(result)}
                      >
                        {result.type === 'user' && (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{result.name}</p>
                              <p className="text-xs text-gray-500">{result.email} • {result.role}</p>
                            </div>
                          </div>
                        )}
                        
                        {result.type === 'product' && (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{result.name}</p>
                              <p className="text-xs text-gray-500">{result.category} • {result.price}</p>
                            </div>
                          </div>
                        )}
                        
                        {result.type === 'service' && (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{result.name}</p>
                              <p className="text-xs text-gray-500">{result.category} • {result.price}</p>
                            </div>
                          </div>
                        )}
                        
                        {result.type === 'order' && (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{result.orderId}</p>
                              <p className="text-xs text-gray-500">{result.amount} • {result.status}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-200">
                      <button 
                        className="text-xs text-orange-600 font-medium hover:text-orange-800"
                        onClick={handleSearchSubmit}
                      >
                        View all results for "{searchTerm}"
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No matches found for "{searchTerm}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Right Section - Profile Only */}
        <div className="flex items-center">
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@gmail.com</p>
              </div>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <button
                    onClick={goToProfile}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </nav>
  );
}

// Custom SVG Icons
const Icons = {
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Services: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  User: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
};

function AdminDashboard() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    activeServices: 0,
    totalRevenue: 0,
    outOfStock: 0,
    lowStock: 0
  });
  
  const [statsChange, setStatsChange] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    activeServices: 0,
    totalRevenue: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  
  console.log("AdminDashboard - currentUser:", currentUser);
  console.log("AdminDashboard - authLoading:", authLoading);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  useEffect(() => {
    // Load dashboard stats from API
    const loadDashboardStats = async () => {
      try {
        if (authLoading) return; // Wait for auth to load
        // Check if user is authenticated and is an admin
        if (!currentUser || currentUser.role !== 'admin') return;
        
        setLoading(true);
        setError(null);
        
        const token = await getIdToken();
        
        // Fetch dashboard statistics from the new endpoint
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Ensure all values are numbers
          setStats({
            totalUsers: Number(data.stats.totalUsers) || 0,
            pendingKYC: Number(data.stats.pendingKYC) || 0,
            activeServices: Number(data.stats.activeServices) || 0,
            totalRevenue: Number(data.stats.totalRevenue) || 0,
            outOfStock: Number(data.stats.outOfStock) || 0,
            lowStock: Number(data.stats.lowStock) || 0
          });
          
          setStatsChange({
            totalUsers: Number(data.statsChange.totalUsers) || 0,
            pendingKYC: Number(data.statsChange.pendingKYC) || 0,
            activeServices: Number(data.statsChange.activeServices) || 0,
            totalRevenue: Number(data.statsChange.totalRevenue) || 0
          });
        } else {
          throw new Error(data.message || 'Failed to fetch dashboard data');
        }
        
        // Fetch users for recent activities
        const usersResponse = await fetch(`${API_BASE_URL}/auth/users?limit=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users data');
        }
        
        const usersData = await usersResponse.json();
        const users = usersData.users || [];
        
        // Process recent activities from users
        const activities = users
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4)
          .map(user => {
            // Generate avatar initials
            const nameParts = user.fullName?.split(' ') || user.email?.split('@')[0]?.split('.') || [user.email?.[0] || 'U'];
            const avatar = nameParts.length > 1 
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
              : nameParts[0][0].toUpperCase();
            
            // Determine action based on user data
            let action = '';
            let color = 'from-gray-500 to-gray-600';
            
            if (user.role === 'petOwner') {
              action = 'Pet Owner - Account created';
              color = 'from-pink-500 to-rose-500';
            } else if (user.role === 'serviceProvider') {
              if (user.verification?.isVerified) {
                action = `${user.serviceCategory || 'Service Provider'} - Profile verified`;
                color = 'from-purple-500 to-violet-500';
              } else if (user.verification) {
                action = `${user.serviceCategory || 'Service Provider'} - KYC submitted`;
                color = 'from-blue-500 to-cyan-500';
              } else {
                action = `${user.serviceCategory || 'Service Provider'} - Account created`;
                color = 'from-green-500 to-emerald-500';
              }
            }
            
            return {
              name: user.fullName || user.email,
              action,
              time: getTimeAgo(user.createdAt),
              avatar,
              color,
              userId: user._id
            };
          });
        
        setRecentActivities(activities);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    loadDashboardStats();

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser, authLoading]);

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StatCard = ({ icon, title, value, change, color, loading }) => (
    <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} bg-opacity-10 mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <div className={`${color.replace('bg-', 'text-')}`}>
              {icon}
            </div>
          </div>
          
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          ) : (
            <div className="flex items-end space-x-2 mb-2">
              <p className="text-3xl font-bold text-gray-900">
                {title === 'Total Revenue' ? `$${Number(value || 0).toLocaleString()}` : Number(value || 0).toLocaleString()}
              </p>
              {change !== undefined && (
                <div className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <Icons.TrendingUp />
                  <span className="ml-1">{change >= 0 ? '+' : ''}{Number(change || 0).toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}
          
          <div className={`h-1 rounded-full ${color} bg-opacity-20 overflow-hidden`}>
            <div className={`h-full ${color} rounded-full transition-all duration-1000 ${loading ? 'w-0' : 'w-3/4'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Stock Alert Component
  const StockAlert = ({ outOfStock, lowStock, loading }) => {
    const [showOutOfStock, setShowOutOfStock] = useState(true);
    const [showLowStock, setShowLowStock] = useState(true);
    
    if (loading) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      );
    }

    // Only show if there are stock issues
    if ((outOfStock === 0 && lowStock === 0) || (!showOutOfStock && !showLowStock)) {
      return null;
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Inventory Alerts</h3>
          <button 
            onClick={() => {
              setShowOutOfStock(false);
              setShowLowStock(false);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {outOfStock > 0 && showOutOfStock && (
            <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-red-800">Out of Stock Items</h4>
                <p className="text-red-600">
                  <span className="font-bold">{outOfStock}</span> product{outOfStock !== 1 ? 's are' : ' is'} currently out of stock
                </p>
              </div>
              <button 
                onClick={() => setShowOutOfStock(false)}
                className="text-red-400 hover:text-red-600 ml-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {lowStock > 0 && showLowStock && (
            <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-yellow-800">Low Stock Items</h4>
                <p className="text-yellow-600">
                  <span className="font-bold">{lowStock}</span> product{lowStock !== 1 ? 's are' : ' is'} running low (less than 5 units)
                </p>
              </div>
              <button 
                onClick={() => setShowLowStock(false)}
                className="text-yellow-400 hover:text-yellow-600 ml-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show a message if user is not authenticated or not an admin
  if (!currentUser || currentUser.role !== 'admin') {
    console.log("AdminDashboard - Access denied:", { currentUser, role: currentUser?.role });
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
          {currentUser && <p className="text-gray-500 mt-2">Current role: {currentUser.role}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, Admin! 👋
              </h2>
              <p className="text-gray-600">
                Here's what's happening with PETVERSE today
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Live Time and Date */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(currentTime)}
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                  Export Data
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/25">
                  Quick Action
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        <StockAlert 
          outOfStock={stats.outOfStock || 0} 
          lowStock={stats.lowStock || 0} 
          loading={loading} 
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Icons.Users />}
            title="Total Users"
            value={stats.totalUsers}
            change={statsChange.totalUsers}
            color="bg-blue-500"
            loading={loading}
          />
          <StatCard
            icon={<Icons.Document />}
            title="Pending KYC"
            value={stats.pendingKYC}
            change={statsChange.pendingKYC}
            color="bg-orange-500"
            loading={loading}
          />
          <StatCard
            icon={<Icons.Services />}
            title="Active Services"
            value={stats.activeServices}
            change={statsChange.activeServices}
            color="bg-green-500"
            loading={loading}
          />
          <StatCard
            icon={<Icons.Chart />}
            title="Total Revenue"
            value={stats.totalRevenue}
            change={statsChange.totalRevenue}
            color="bg-purple-500"
            loading={loading}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {loading ? (
                    // Loading skeletons
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </div>
                      </div>
                    ))
                  ) : recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={activity.userId || index} className="flex items-center space-x-4 group">
                        <div className={`w-12 h-12 bg-gradient-to-r ${activity.color} rounded-full flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform duration-200`}>
                          {activity.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {activity.name}
                          </p>
                          <p className="text-sm text-gray-500">{activity.action}</p>
                          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                        </div>
                        <div className="w-3 h-3 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recent activities found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              </div>
              
              <div className="p-6 space-y-4">
                {[
                  {
                    label: "Review KYC Submissions",
                    color: "from-orange-500 to-amber-500",
                    urgent: stats.pendingKYC
                  },
                  {
                    label: "Add New Service Provider",
                    color: "from-blue-500 to-indigo-500"
                  },
                  {
                    label: "Generate Analytics Report",
                    color: "from-green-500 to-emerald-500"
                  },
                  {
                    label: "Manage User Permissions",
                    color: "from-purple-500 to-violet-500"
                  }
                ].map((action, index) => (
                  <button
                    key={index}
                    className={`w-full p-4 bg-gradient-to-r ${action.color} text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-left relative overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                    <div className="relative flex items-center justify-between">
                      <span className="font-semibold">{action.label}</span>
                      {action.urgent && (
                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-bold">
                          {action.urgent}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;