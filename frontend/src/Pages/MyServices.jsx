// File: src/pages/MyServices.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";

// Currency formatter in Rs
const currency = (n) => {
  if (typeof n !== "number" || !isFinite(n)) return "-";
  return "Rs " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
};

const MyServices = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Get auth loading state

  // Fetch services for the logged-in user
  useEffect(() => {
    let mounted = true;

    const fetchMyServices = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          console.log("Auth still loading, waiting...");
          return;
        }
        
        if (!user) {
          console.log("No user found, redirecting to login");
          toast.error("Please log in to view your services");
          navigate("/login");
          return;
        }
        
        console.log("Current user from AuthContext:", user);
        
        // Also check Firebase Auth directly
        const auth = getAuth(app);
        const firebaseUser = auth.currentUser;
        console.log("Firebase current user:", firebaseUser);
        
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          console.log("Firebase token available:", token ? "YES" : "NO");
          console.log("Token preview:", token ? token.substring(0, 50) + "..." : "No token");
        }
        
        console.log("Making request to /services/my-services");
        
        // Use the new endpoint for user-specific services
        const res = await api.get("/services/my-services");
        if (!mounted) return;
        console.log("Services response:", res.data);
        setServices(Array.isArray(res.data) ? res.data : []);
      } catch (err) {

        console.error("Services fetch error:", err);
        console.error("Error response:", err.response?.data);
        
        // More detailed error handling
        let errorMessage = "Failed to load your services";
        
        if (err.response?.status === 401) {
          errorMessage = "Please log in to view your services";
          navigate("/login");
        } else if (err.response?.status === 403) {
          errorMessage = "Access denied. Please verify your account.";
        } else if (err.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        toast.error(errorMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMyServices();
    return () => { mounted = false; };
  }, [user, authLoading, navigate]); // Add authLoading dependency

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      toast.success("Service deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete service");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/dashboard/service-provider")}
            className="btn btn-sm bg-gray-300 text-gray-800 flex items-center gap-2 hover:bg-gray-400"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">My Services</h1>
          <Link
            to="/services/create/select"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-orange-500"
          >
            Add New Service
          </Link>
        </div>
        <div className="text-center py-20 text-base-content/70">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first service offering.</p>
          <Link
            to="/services/create/select"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Your First Service
          </Link>
        </div>
      </div>
    );
  }
//return
  return (

    // Added bg-white to make the background white
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate("/dashboard/service-provider")} // replace with your actual dashboard route
          className="btn btn-sm bg-gray-300 text-gray-800 flex items-center gap-2 hover:bg-gray-400"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">My Services</h1>
        <Link
          to="/services/create/select"
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-orange-500"
        >
          Add New Service
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          // Changed from bg-base-100 to bg-white and added border
          <div key={service._id} className="card bg-white border shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg">{service.title}</h2>
              <p className="text-sm text-base-content/70">{service.category || "-"}</p>
              <p className="text-sm text-base-content/70">{service.address || "-"}</p>
  
              {/* Package-wise prices */}
              {Array.isArray(service.packages) && service.packages.length > 0 && (
                <div className="mt-3 space-y-1">
                  {service.packages.map((pkg, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{pkg.name || `Package ${idx + 1}`}</span>
                      <span className="font-semibold">{currency(pkg.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback: single price if no packages */}
              {!Array.isArray(service.packages) && typeof service.price === "number" && (
                <p className="mt-2 font-semibold">{currency(service.price)}</p>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/services/${service._id}/edit`}
                  className="btn btn-sm btn-outline border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="btn btn-sm btn-outline btn-error"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyServices;