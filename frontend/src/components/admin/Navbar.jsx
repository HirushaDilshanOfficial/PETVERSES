import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SmartSearch from './SmartSearch';

// Simple Navbar Component with real authentication
function Navbar() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  
  // State for dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signout();
        // Close dropdown first
        setShowDropdown(false);
        // Navigate to home page after logout
        // Using replace: true to prevent going back to admin pages
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Failed to logout:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  };

  // Navigate to profile
  const goToProfile = () => {
    setShowDropdown(false);
    navigate('/admin/profile');
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.fullName) {
      return user.fullName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin User';
  };

  // Get user email
  const getUserEmail = () => {
    return user?.email || 'admin@petverse.com';
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Smart Search Bar */}
        <div className="flex-1 max-w-md">
          <SmartSearch />
        </div>

        {/* Right Section */}
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
                <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500">{getUserEmail()}</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 013-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

export default Navbar;