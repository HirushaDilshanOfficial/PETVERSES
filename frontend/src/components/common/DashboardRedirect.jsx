import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Component to redirect users to their appropriate dashboard based on role
const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based redirects
  const roleRedirects = {
    admin: "/admin/dashboard",
    serviceProvider: "/dashboard/service-provider",
    petOwner: "/dashboard/pet-owner/profile", // Note: role is "petOwner" with capital O
  };

  // Get the redirect path based on user role
  const redirectPath = roleRedirects[user.role] || "/login";

  return <Navigate to={redirectPath} replace />;
};

export default DashboardRedirect;