import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.js";
import toast from "react-hot-toast";

const ServiceProviderAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Get the Firebase ID token for authentication
      const { getAuth } = await import("firebase/auth");
      const app = (await import("../config/firebase")).default;
      const firebaseAuth = getAuth(app);
      const currentUser = firebaseAuth.currentUser;
      
      if (!currentUser) {
        throw new Error("Please log in to view appointments");
      }
      
      const idToken = await currentUser.getIdToken();
      
      // Use the new endpoint to get provider-specific appointments
      const response = await fetch(`${API_BASE_URL}/appointments/provider`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        credentials: "include" // Include cookies/credentials for authentication
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view appointments");
        } else if (response.status === 403) {
          throw new Error("Access denied. Please verify your account.");
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(`Failed to load appointments (${response.status})`);
      }
      
      const data = await response.json();
      console.log("Fetched appointments:", data); // Debug log
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch appointments:", e);
      toast.error(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      console.log(`Updating appointment ${id} to status: ${status}`);
      
      // Get the Firebase ID token for authentication
      const { getAuth } = await import("firebase/auth");
      const app = (await import("../config/firebase")).default;
      const firebaseAuth = getAuth(app);
      const currentUser = firebaseAuth.currentUser;
      
      if (!currentUser) {
        throw new Error("Please log in to update appointments");
      }
      
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. You are not authorized to update this appointment.");
        } else if (response.status === 404) {
          throw new Error("Appointment not found.");
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(`Failed to update appointment: ${response.status}`);
      }
      
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      toast.success(`Appointment ${status.toLowerCase()} successfully!`);
    } catch (e) {
      console.error("Update error:", e);
      toast.error(e.message || "Failed to update appointment");
    }
  };

  useEffect(() => { 
    if (user) {
      fetchAppointments(); 
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Appointments</h1>
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Please log in to view appointments.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Appointments</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="loading loading-spinner text-primary loading-lg"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No appointments found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pet Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appt.pet_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appt.service_name || "Service"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appt.date ? new Date(appt.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appt.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        appt.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        appt.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {(appt.status === 'Pending' || appt.status === 'Scheduled') ? (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => updateStatus(appt._id, 'Approved')} 
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => updateStatus(appt._id, 'Rejected')} 
                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 font-medium">{appt.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderAppointments;