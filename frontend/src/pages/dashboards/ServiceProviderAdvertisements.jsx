import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import AdFrontend from "../../components/AdFrontend";

const ServiceProviderAdvertisements = () => {
  const { user } = useAuth();
  console.log("ServiceProviderAdvertisements - user:", user);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Advertisements</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your advertisements to promote your services
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {user ? (
            <AdFrontend />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading user data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderAdvertisements;