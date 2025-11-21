import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom"; 

import {
  DownloadIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  PackageIcon,
  ShoppingCartIcon,
  MegaphoneIcon,
  PlusIcon,
  CheckIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const formatCurrency = (n) => {
  if (typeof n !== "number" || isNaN(n)) return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
};

const ServicePdashboard = () => {
  const [loading, setLoading] = useState(false); // Set to false since we're not fetching data
  const [provider, setProvider] = useState({
    name: "Service Provider",
    email: "provider@example.com",
    phone: "+1 (555) 123-4567",
    location: "Colombo, LK",
    profileImage: "",
  });
  const [metrics, setMetrics] = useState({
    totalServices: 5,
    avgPrice: 75.00,
    // Changed availabilityPct to be based on whether services exist
    availabilityPct: 100, // Will be 100 if services exist, 0 if no services
    appointments: 12,
    products: 8,
    orders: 6,
    advertisements: 3,
  });

  // No API calls - using static data for display only

  // Update the analyticsSummary to calculate availability based on services
  const analyticsSummary = useMemo(() => {
    // Calculate availability: 100% if services exist, 0% if no services
    const calculatedAvailability = metrics.totalServices > 0 ? 100 : 0;
    
    return [
      { label: "Total Services", value: metrics.totalServices },
      { label: "Average Price", value: formatCurrency(metrics.avgPrice) },
      { label: "Availability", value: `${calculatedAvailability}%` },
      { label: "Appointments", value: metrics.appointments },
      { label: "Products", value: metrics.products },
      { label: "Orders", value: metrics.orders },
      { label: "Advertisements", value: metrics.advertisements },
    ];
  }, [metrics]);

  const downloadReport = () => {
    try {
      const rows = [
        [
          "Name",
          "Email",
          "Phone",
          "Location",
          "Total Services",
          "Average Price",
          "Availability %",
          "Appointments",
          "Products",
          "Orders",
          "Advertisements",
        ],
        [
          provider.name,
          provider.email,
          provider.phone,
          provider.location,
          metrics.totalServices,
          metrics.avgPrice,
          // Updated to use the new logic: 100% if services exist, 0% if no services
          metrics.totalServices > 0 ? 100 : 0,
          metrics.appointments,
          metrics.products,
          metrics.orders,
          metrics.advertisements,
        ],
      ];
      const csv = rows
        .map((r) =>
          r.map((f) => `"${String(f).replaceAll('"', '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `provider-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to download report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 min-h-screen sticky top-0 flex-col border-r bg-[#1E40AF]">
          <div className="p-4 border-b border-white/20">
            <h2 className="font-bold text-lg text-white">
              Provider Dashboard
            </h2>
            <p className="text-sm text-white/70">
              Manage your services and sales
            </p>
          </div>

          <nav className="p-2 space-y-1">
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors cursor-pointer"
            >
              <CalendarDaysIcon className="size-4" />
              <span>Appointments</span>
            </div>
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors cursor-pointer"
            >
              <MegaphoneIcon className="size-4" />
              <span>Advertisements</span>
            </div>
            <Link
              to="/dashboard/service-provider/my-services"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors"
            >
              <PackageIcon className="size-4" />
              <span>Edit Services</span>
            </Link>
            <Link
              to="/dashboard/service-provider/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors"
            >
              <UserIcon className="size-4" />
              <span>My Profile</span>
            </Link>
          </nav>

          <div className="mt-auto p-4 border-t border-white/20 text-white">
            <div className="card bg-[#1E40AF] border border-white/20">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="size-4" />
                  <span className="font-semibold">Contact</span>
                </div>
                <div className="text-sm space-y-1 text-white/80">
                  <div className="flex items-center gap-2">
                    <MailIcon className="size-3" /> {provider.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="size-3" /> {provider.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="size-3" /> {provider.location}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Header with half-height background and profile avatar */}
            <div
              className="relative w-full h-64 md:h-72 rounded-xl overflow-hidden mb-10"
              style={{
                backgroundImage: "url('/dogscats3.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10 h-full px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-28 w-28 rounded-full border-4 border-white/80 bg-white/10 overflow-hidden flex items-center justify-center text-white text-3xl font-bold">
                      {provider.profileImage ? (
                        <img
                          src={provider.profileImage}
                          alt={provider.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (provider.name || 'U').charAt(0)
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                      <CheckIcon className="size-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-white text-3xl md:text-4xl font-bold leading-tight">
                      {provider.name}
                    </div>
                    <div className="text-white/80">Professional Pet Care Provider</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/services/create/select"
                    className="px-4 py-2 text-sm md:text-base font-medium rounded-lg text-white bg-[#1E40AF] border border-[#1E40AF] border-t-4 transition-all duration-200 hover:bg-[#F97316] hover:border-[#F97316] hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <PlusIcon className="size-4" />
                    Add New Service
                  </Link>
                  
                  <button
                  onClick={downloadReport}
                  className="btn btn-outline gap-2 bg-white/90 text-[#1E40AF] border-white hover:bg-[#F97316]"
                  >
                  <DownloadIcon className="size-4" />
                  Download Report
                  </button>
                </div>
              </div>
            </div>

            {/* Ads Section + Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* My Advertisements Section */}
              <div className="lg:col-span-1">
                <div className="card bg-base-100 border p-6 flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-base-200 border border-gray-300 mb-4">
                    <MegaphoneIcon className="size-8 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-base-content mb-2">
                    Boost Your Business
                  </h3>
                  <p className="text-base-content/70 mb-6">
                    Create eye-catching advertisements to attract more customers to
                    your services.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Link
                      to="/dashboard/service-provider/advertisements"
                      className="flex-1 px-4 py-2 text-sm md:text-base font-medium rounded-lg text-white bg-[#1E40AF] border border-[#1E40AF] border-t-4 transition-all duration-200 hover:bg-[#F97316] hover:border-[#F97316] hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="size-4" />
                      Create New Advertisement
                    </Link>
                    <Link
                      to="/dashboard/service-provider/advertisements"
                      className="flex-1 px-4 py-2 text-sm md:text-base font-medium rounded-lg text-[#1E40AF] bg-white border border-[#1E40AF] border-t-4 transition-all duration-200 hover:bg-[#F97316] hover:text-white hover:border-[#F97316] hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      View All Advertisements
                    </Link>
                  </div>
                </div>
              </div>

              {/* Analytics Summary - now takes 2 columns */}
              <div className="space-y-4 p-4 bg-base-100 rounded-lg border lg:col-span-2">
                {/* Header */}
                <h2 className="text-xl font-bold">Analytics Summary</h2>

                {/* Service Availability */}
                <div className="p-4 rounded-lg border flex items-center justify-between">
                  <span className="text-base-content/70">
                    Service Availability
                  </span>
                  <span className="font-semibold">
                    {metrics.totalServices > 0 ? '100' : '0'}%
                  </span>
                </div>
                {/* Package Options */}
                <div className="p-4 rounded-lg border flex items-center justify-between">
                  <span className="text-base-content/70">Package Options</span>
                  <span className="font-semibold">{metrics.products}</span>
                </div>

                {/* Average Price */}
                <div className="p-4 rounded-lg border flex items-center justify-between">
                  <span className="text-base-content/70">Average Price</span>
                  <span className="font-semibold">
                    {formatCurrency(metrics.avgPrice)}
                  </span>
                </div>

                {/* Footer */}
                <p className="text-sm text-gray-500 mt-2">
                  Download the complete analytics report to gain deeper insights
                  into your services
                </p>
                <button
                  onClick={downloadReport}
                  className="px-4 py-2 text-sm md:text-base font-medium rounded-lg text-white bg-[#1E40AF] border border-[#1E40AF] border-t-4 transition-all duration-200 hover:bg-[#F97316] hover:border-[#F97316] hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Generate Detailed Report
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServicePdashboard;