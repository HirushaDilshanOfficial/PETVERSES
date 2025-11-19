import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getIdToken } from '../../utils/authUtils';

const SmartSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions based on search term
  const fetchSuggestions = async (term) => {
    if (!term.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      
      // Fetch suggestions from multiple sources
      const [usersResponse, productsResponse, servicesResponse, ordersResponse] = await Promise.all([
        // Users
        fetch(`${API_BASE_URL}/auth/users?search=${term}&limit=3`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        // Products
        fetch(`${API_BASE_URL}/products`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        // Services
        fetch(`${API_BASE_URL}/services`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        // Orders (limited)
        fetch(`${API_BASE_URL}/orders/admin/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      const usersData = await usersResponse.json();
      const productsData = await productsResponse.json();
      const servicesData = await servicesResponse.json();
      let ordersData = [];
      
      try {
        const ordersResult = await ordersResponse.json();
        ordersData = Array.isArray(ordersResult) ? ordersResult : [];
      } catch (e) {
        console.log('Orders data not available');
      }

      // Process suggestions
      const newSuggestions = [];
      
      // Add user suggestions
      if (usersData.users && usersData.users.length > 0) {
        usersData.users.slice(0, 2).forEach(user => {
          newSuggestions.push({
            id: user._id,
            type: 'user',
            title: user.fullName || user.email,
            subtitle: `${user.email} • ${user.role}`,
            icon: '👤',
            url: `/admin/users`
          });
        });
      }
      
      // Add product suggestions
      if (productsData.products) {
        const filteredProducts = productsData.products
          .filter(product => 
            product.pName && 
            product.pName.toLowerCase().includes(term.toLowerCase())
          )
          .slice(0, 2);
          
        filteredProducts.forEach(product => {
          newSuggestions.push({
            id: product._id,
            type: 'product',
            title: product.pName,
            subtitle: `Product • ${product.pCategory || 'Uncategorized'} • LKR ${product.pPrice || 0}`,
            icon: '📦',
            url: `/admin/inventory`
          });
        });
      }
      
      // Add service suggestions
      if (servicesData) {
        const filteredServices = Array.isArray(servicesData) 
          ? servicesData.filter(service => 
              service.title && 
              service.title.toLowerCase().includes(term.toLowerCase())
            ).slice(0, 2)
          : [];
          
        filteredServices.forEach(service => {
          newSuggestions.push({
            id: service._id,
            type: 'service',
            title: service.title,
            subtitle: `Service • ${service.category || 'Uncategorized'}`,
            icon: '✂️',
            url: `/admin/services`
          });
        });
      }
      
      // Add order suggestions
      if (ordersData.length > 0) {
        const filteredOrders = ordersData
          .filter(order => 
            order._id && 
            order._id.toLowerCase().includes(term.toLowerCase())
          )
          .slice(0, 2);
          
        filteredOrders.forEach(order => {
          newSuggestions.push({
            id: order._id,
            type: 'order',
            title: `Order #${order._id?.substring(0, 8)}`,
            subtitle: `Order • LKR ${order.totalAmount || 0} • ${order.status || 'Unknown'}`,
            icon: '🛒',
            url: `/admin/orders`
          });
        });
      }
      
      setSuggestions(newSuggestions);
      setIsOpen(newSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Allow only letters, numbers, and spaces
    if (/^[a-zA-Z0-9\s]*$/.test(value) || value === '') {
      setSearchTerm(value);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsOpen(false);
      // Navigate to search results page
      navigate(`/admin/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm('');
    setIsOpen(false);
    // Navigate to the suggestion's URL
    if (suggestion.url) {
      navigate(suggestion.url);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (searchTerm.trim()) {
          handleSearchSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, suggestions]);

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <svg 
          className="h-5 w-5 absolute left-3 top-3 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search users, products, services, orders..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setIsOpen(suggestions.length > 0)}
        />
        {loading && (
          <svg className="h-5 w-5 absolute right-3 top-3 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </form>

      {isOpen && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.id}`}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="text-lg mr-3">{suggestion.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.subtitle}
                </p>
              </div>
            </div>
          ))}
          
          {suggestions.length === 0 && !loading && (
            <div className="p-3 text-sm text-gray-500">
              No suggestions found
            </div>
          )}
          
          <div className="border-t border-gray-100 p-2 text-xs text-gray-500 text-center">
            Press Enter to search all results
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;