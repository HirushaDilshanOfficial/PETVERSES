import { Link } from "react-router";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { MapPin } from 'lucide-react';

const ServiceCard = ({ service, setServices }) => {
  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.delete(`/api/services/${id}`);
      setServices((prev) => prev.filter((s) => s._id !== id));
      toast.success("Service deleted successfully");
    } catch (error) {
      console.log("Error in handleDelete", error);
      toast.error("Failed to delete service");
    }
  };

  return (
    <div className="card bg-white shadow-md border rounded-xl overflow-hidden hover:shadow-lg transition">
      {/* Image Section */}
      {service.images && service.images.length > 0 ? (
        <figure className="w-full h-48 overflow-hidden">
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            onLoad={() => console.log('✅ Image loaded successfully:', service.images[0])}
            onError={(e) => {
              console.log('❌ Image failed to load:', service.images[0]);
              console.log('Error details:', e);
            }}
          />
        </figure>
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">No image</p>
          </div>
        </div>
      )}
      
      <div className="card-body">
        {/* Title + Category */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#F97316]">
            {service.title}
          </h2>
          {service.category && (
            <span className="px-3 py-1 text-sm rounded-full bg-gray-600 text-white">
              {service.category}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 mt-1">{service.description}</p>

        <div className="flex items-center gap-2 mt-3 p-3 bg-gray-100 rounded-lg">
          <MapPin className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">
            {service.address || "No address"}
          </span>
        </div>

        {/* Packages */}
        {Array.isArray(service.packages) && service.packages.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              AVAILABLE PACKAGES
            </h3>
            <div className="space-y-2">
              {service.packages.map((pkg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 border rounded-lg"
                >
                  <span className="text-gray-800">{pkg.name}</span>
                  <span className="font-semibold">Rs. {pkg.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Details button */}
        <div className="mt-6">
          <Link
            to={`/service/${service._id}`}
            className="w-full block text-center rounded-full bg-[#1E40AF] text-white font-medium py-3 transition hover:bg-[#F97316]"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
