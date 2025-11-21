import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getIdToken } from '../../utils/authUtils';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  ShoppingBagIcon,
  ScissorsIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

const SearchResultsPage = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState({
    users: [],
    products: [],
    services: [],
    orders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Get search query from URL
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  // Fetch search results
  const fetchSearchResults = async (searchQuery) => {
    try {
      if (authLoading) return;
      if (!currentUser || currentUser.role !== 'admin') return;

      // Validate search query
      if (!searchQuery || searchQuery.trim().length < 1) {
        setSearchResults({ users: [], products: [], services: [], orders: [] });
        return;
      }

      setLoading(true);
      setError(null);

      const token = await getIdToken();

      // Fetch results from all sources
      const [usersResponse, productsResponse, servicesResponse, ordersResponse] = await Promise.all([
        // Users
        fetch(`${API_BASE_URL}/auth/users?search=${searchQuery}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => null),
        
        // Products
        fetch(`${API_BASE_URL}/products`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => null),
        
        // Services
        fetch(`${API_BASE_URL}/services`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => null),
        
        // Orders
        fetch(`${API_BASE_URL}/orders/admin/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => null)
      ]);

      const results = {
        users: [],
        products: [],
        services: [],
        orders: []
      };

      // Process users - filter by first letter or any matching text
      if (usersResponse && usersResponse.ok) {
        const usersData = await usersResponse.json();
        results.users = (usersData.users || [])
          .filter(user => {
            const firstLetter = searchQuery.trim().charAt(0).toLowerCase();
            return (
              (user.fullName && user.fullName.toLowerCase().startsWith(firstLetter)) ||
              (user.email && user.email.toLowerCase().startsWith(firstLetter)) ||
              (user.role && user.role.toLowerCase().startsWith(firstLetter)) ||
              (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (user.role && user.role.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          });
      }

      // Process products - filter by first letter or any matching text
      if (productsResponse && productsResponse.ok) {
        const productsData = await productsResponse.json();
        results.products = (productsData.products || [])
          .filter(product => {
            const firstLetter = searchQuery.trim().charAt(0).toLowerCase();
            return (
              (product.pName && product.pName.toLowerCase().startsWith(firstLetter)) ||
              (product.pCategory && product.pCategory.toLowerCase().startsWith(firstLetter)) ||
              (product.productID && product.productID.toLowerCase().startsWith(firstLetter)) ||
              (product.pName && product.pName.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (product.pCategory && product.pCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (product.productID && product.productID.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          });
      }

      // Process services - filter by first letter or any matching text
      if (servicesResponse && servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        results.services = (Array.isArray(servicesData) ? servicesData : [])
          .filter(service => {
            const firstLetter = searchQuery.trim().charAt(0).toLowerCase();
            return (
              (service.title && service.title.toLowerCase().startsWith(firstLetter)) ||
              (service.category && service.category.toLowerCase().startsWith(firstLetter)) ||
              (service.title && service.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          });
      }

      // Process orders - filter by first letter or any matching text
      if (ordersResponse && ordersResponse.ok) {
        let ordersData = [];
        try {
          const ordersResult = await ordersResponse.json();
          ordersData = Array.isArray(ordersResult) ? ordersResult : [];
        } catch (e) {
          console.log('Orders data not available');
        }
        
        results.orders = ordersData
          .filter(order => {
            const firstLetter = searchQuery.trim().charAt(0).toLowerCase();
            return (
              (order._id && order._id.toLowerCase().startsWith(firstLetter)) ||
              (order.userID && order.userID.toString().toLowerCase().startsWith(firstLetter)) ||
              (order.paymentStatus && order.paymentStatus.toLowerCase().startsWith(firstLetter)) ||
              (order.status && order.status.toLowerCase().startsWith(firstLetter)) ||
              (order._id && order._id.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (order.userID && order.userID.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
              (order.paymentStatus && order.paymentStatus.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (order.status && order.status.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          });
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Failed to fetch search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    } else {
      // If no query, show empty results
      setSearchResults({ users: [], products: [], services: [], orders: [] });
      setLoading(false);
    }
  }, [query, currentUser, authLoading]);

  // Filter results based on active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'users':
        return searchResults.users;
      case 'products':
        return searchResults.products;
      case 'services':
        return searchResults.services;
      case 'orders':
        return searchResults.orders;
      default:
        return [
          ...searchResults.users.map(item => ({ ...item, type: 'user' })),
          ...searchResults.products.map(item => ({ ...item, type: 'product' })),
          ...searchResults.services.map(item => ({ ...item, type: 'service' })),
          ...searchResults.orders.map(item => ({ ...item, type: 'order' }))
        ];
    }
  };

  const filteredResults = getFilteredResults();

  // Handle result click
  const handleResultClick = (item, type) => {
    switch (type) {
      case 'user':
        navigate(`/admin/users`);
        break;
      case 'product':
        navigate(`/admin/inventory`);
        break;
      case 'service':
        navigate(`/admin/services`);
        break;
      case 'order':
        navigate(`/admin/orders`);
        break;
      default:
        break;
    }
  };

  // Format result item for display
  const formatResultItem = (item, type) => {
    switch (type) {
      case 'user':
        return {
          icon: <UserIcon className="h-5 w-5 text-gray-500" />,
          title: item.fullName || item.email || 'Unknown User',
          subtitle: `${item.email || 'No email'} • ${item.role || 'No role'}`,
          details: `Joined: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}`
        };
      case 'product':
        return {
          icon: <ShoppingBagIcon className="h-5 w-5 text-gray-500" />,
          title: item.pName || 'Unnamed Product',
          subtitle: `${item.pCategory || 'Uncategorized'} • LKR ${item.pPrice || 0}`,
          details: `ID: ${item.productID || 'Unknown'} • Stock: ${item.pQuantity || 0}`
        };
      case 'service':
        return {
          icon: <ScissorsIcon className="h-5 w-5 text-gray-500" />,
          title: item.title || 'Unnamed Service',
          subtitle: `${item.category || 'Uncategorized'}`,
          details: `Provider: ${item.provider?.fullName || 'Unknown'}`
        };
      case 'order':
        return {
          icon: <ShoppingCartIcon className="h-5 w-5 text-gray-500" />,
          title: `Order #${item._id ? item._id.substring(0, 8) : 'Unknown'}`,
          subtitle: `LKR ${item.totalAmount || 0} • ${item.status || 'Unknown'}`,
          details: `Date: ${item.date || item.createdAt ? new Date(item.date || item.createdAt).toLocaleDateString() : 'Unknown date'}`
        };
      default:
        return {
          icon: null,
          title: 'Unknown item',
          subtitle: '',
          details: ''
        };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading search results...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Search Results</h1>
          {query ? (
            <p className="text-gray-600 mt-2">
              Search results for: <span className="font-semibold">"{query}"</span>
            </p>
          ) : (
            <p className="text-gray-600 mt-2">
              Please enter a search term to find users, products, services, or orders.
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'all'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    All Results
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium ml-2 px-2.5 py-0.5 rounded-full">
                      {searchResults.users.length + searchResults.products.length + searchResults.services.length + searchResults.orders.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'users'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Users
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium ml-2 px-2.5 py-0.5 rounded-full">
                      {searchResults.users.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'products'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Products
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium ml-2 px-2.5 py-0.5 rounded-full">
                      {searchResults.products.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'services'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Services
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium ml-2 px-2.5 py-0.5 rounded-full">
                      {searchResults.services.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'orders'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Orders
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium ml-2 px-2.5 py-0.5 rounded-full">
                      {searchResults.orders.length}
                    </span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-lg shadow">
              {filteredResults.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredResults.map((item, index) => {
                    const type = item.type || activeTab;
                    const formatted = formatResultItem(item, type);
                    
                    return (
                      <div
                        key={`${type}-${item._id || index}`}
                        className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleResultClick(item, type)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            {formatted.icon}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {formatted.title}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatted.subtitle}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatted.details}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query ? (
                <div className="p-12 text-center">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No {activeTab === 'all' ? '' : activeTab} matched your search query "{query}".
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Enter a search term</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please enter a search term in the dashboard search bar to find users, products, services, or orders.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;