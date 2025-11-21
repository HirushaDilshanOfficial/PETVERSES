import React, { useEffect, useState } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await api.get("/services/admin");
      setServices(res.data);
    } catch (err) {
      toast.error("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/services/${id}/status`, { status });
      toast.success(`Service ${status}`);
      fetchServices();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Service Management</h1>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Provider</th>
            <th className="p-2 border">Location</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s._id}>
              <td className="p-2 border">{s.name}</td>
              <td className="p-2 border">{s.provider?.fullName || "Unknown"}</td>
              <td className="p-2 border">{s.location || "N/A"}</td>
              <td className="p-2 border">{s.price || "-"}</td>
              <td className="p-2 border">{s.service_status}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => updateStatus(s._id, "approved")}
                  className="px-3 py-1 bg-green-500 text-white rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(s._id, "rejected")}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminServices;
