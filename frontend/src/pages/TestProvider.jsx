import React from "react";
import AdFrontend from "../components/AdFrontend";
import { useAuth } from "../contexts/AuthContext";

const TestProvider = () => {
  const { user, loading } = useAuth();
  
  // Check if user is a service provider
  const isServiceProvider = user && user.role === "serviceProvider";
  const providerId = isServiceProvider ? user._id : null;

  // If user is not a service provider, show an error message
  if (user && !isServiceProvider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700">
              Only service providers can access this page. You are currently logged in as a {user.role}.
            </p>
            <p className="text-gray-600 mt-2">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user data is still loading, show a loading message
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold text-[#1E40AF] mb-4">Loading...</h1>
            <p className="text-gray-600">Please wait while we load your information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1E40AF] mb-2">
            Service Provider Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your advertisements and services from this dashboard
          </p>
        </div>

        {/* Welcome Section */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome, {user?.name || "Service Provider"}!
          </h2>
          <p className="text-gray-600">
            This is your dedicated space to manage your service offerings and promotional advertisements.
          </p>
        </div>

        {/* Advertisements Section */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#1E40AF]">
              Advertisements
            </h2>
            <span className="text-sm text-gray-500">
              Manage your ads effectively
            </span>
          </div>
          <p className="text-gray-600 mb-6">
            Create new advertisements to promote your services. View and track the status of your existing ads.
          </p>
          
          {/* Advertisement Management Component */}
          {user ? (
            <AdFrontend providerId={providerId} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Please log in as a service provider to create advertisements.</p>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Need Help?
          </h3>
          <p className="text-gray-600 mb-3">
            If you encounter any issues with creating or managing advertisements, please contact our support team.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#F97316] transition">
              Contact Support
            </button>
            <button className="px-4 py-2 border border-[#1E40AF] text-[#1E40AF] rounded-lg hover:bg-gray-50 transition">
              View Guidelines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestProvider;