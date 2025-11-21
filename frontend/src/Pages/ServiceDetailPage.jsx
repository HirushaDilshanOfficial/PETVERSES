import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeftIcon, LoaderIcon, PackageIcon, ClockIcon, UserIcon, MapPinIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";

const ServiceDetailPage = () => {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/services/${id}`);
        setService(res.data);
      } catch (error) {
        console.error("Error fetching service:", error);
        toast.error("Failed to fetch the service");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const firstImage = useMemo(() => {
    if (!service) return null;
    const imgs = service.images;
    if (!imgs) return null;
    if (Array.isArray(imgs)) return imgs[0] || null;
    if (typeof imgs === "string") return imgs;
    return imgs.url || imgs.src || null;
  }, [service]);

  const provider = useMemo(() => {
  if (!service) return { name: "Provider", address: "-" };
  const p = service.provider || {};
  return {
    name: p.fullName || "Provider",
    address: p.address || service.address || "-", 
  };
}, [service]);


  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Services
          </Link>
        </div>
        <div className="flex items-center justify-center py-20">
          <LoaderIcon className="animate-spin size-10" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Services
          </Link>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-base-content/70">Service not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 mb-2">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Services
          </Link>
        </div>

        {/* Left column: Image */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 border">
            <div className="card-body p-0">
              {firstImage ? (
                <img src={firstImage} alt={service.title} className="w-full h-[420px] object-cover rounded-t-box" />
              ) : (
                <div className="w-full h-[420px] rounded-t-box bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
                  <span className="text-base-content/50">No image available</span>
                </div>
              )}
            </div>
          </div>

          {/* Service info and buttons */}
          <div className="card bg-base-100 border">
  <div className="card-body">
    {/* Provider info */}
    <div className="flex items-center gap-2 mb-2">
      <UserIcon className="size-5" />
      <div>
        <div className="font-semibold">Service Provider</div>
        <div className="text-base-content/70 flex items-center gap-1">
          <MapPinIcon className="size-4" />
          <span className="capitalize">{service.address}</span>
        </div>
      </div>
              </div>

        
              <h1 className="card-title text-2xl leading-snug">{service.title}</h1>

           
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to={`/grooming-packages`}
                  state={{ 
                    serviceId: id, 
                    serviceName: service.title,
                    servicePackages: service.packages // Pass the packages with prices
                  }}
                  className="flex-1 px-4 py-3 rounded-lg text-white font-medium bg-blue-800 hover:bg-orange-500 hover:text-white transition transform hover:scale-105 text-center"
                >
                  Book Appointment
                </Link>
                <Link
                  to={`/service/${id}/review`}
                  className="btn btn-outline flex-1"
                >
                  Write & View Reviews
                </Link>
              </div>
  </div>
</div>
        </div>

        {/* Right column: Packages */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-base-100 border">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-1">
                <PackageIcon className="size-5" />
                <h3 className="card-title">Packages</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
  {service.packages && service.packages.length ? (
    service.packages.map((pkg, i) => (
      <div key={i} className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{pkg.name}</div>
          <div className="badge" style={{ backgroundColor: "#1E40AF", color: "white" }}>
            Rs.{pkg.price}.00
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-base-content/70">
          <ClockIcon className="size-4" />
          <span>{pkg.duration}</span>
        </div>
        <div className="mt-3">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {pkg.services && pkg.services.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>
    ))
  ) : (
    <div className="text-base-content/70">No packages available</div>
  )}
</div>


            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceDetailPage;