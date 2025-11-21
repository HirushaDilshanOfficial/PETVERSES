import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Fixed import
import { useAuth } from "../../contexts/AuthContext";
import { getServiceProviderAnalytics } from "../../api"; // Import the API function
import { generateServiceProviderReport } from "../../utils/pdfGenerator"; // Import PDF generator
import api from "../../lib/axios"; // Import the api client

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
  LogOutIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const formatCurrency = (n) => {
  if (typeof n !== "number" || isNaN(n)) return "-";
  try {
    return (
      "Rs. " +
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n)
    );
  } catch {
    return "Rs. " + n.toFixed(2);
  }
};

const ServicePdashboard = () => {
  const { signout, user } = useAuth(); // Added user from context
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Set to false since we're not fetching data
  const [provider, setProvider] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    profileImage: "",
  });
  const [metrics, setMetrics] = useState({
    totalServices: 0,
    avgPrice: 0,
    // Updated to calculate availability based on whether services exist
    availabilityPct: 0, // Will be updated based on services count
  });
  // Add state for services data
  const [services, setServices] = useState([]);
  // Add state for total packages
  const [totalPackages, setTotalPackages] = useState(0);

  // Set provider data from user context when component mounts
  useEffect(() => {
    if (user) {
      setProvider({
        name: user.fullName || "Service Provider",
        email: user.email || "",
        phone: user.phoneNumber || "",
        location: user.address || "Sri Lanka",
        profileImage: user.profilePicture || "",
      });
    }
  }, [user]);

  // Fetch analytics data when component mounts
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await getServiceProviderAnalytics();
        if (response.success) {
          const data = response.data;
          // Calculate availability: 100% if services exist, 0% if no services
          const calculatedAvailability =
            (data.totalServices || 0) > 0 ? 100 : 0;

          setMetrics({
            totalServices: data.totalServices || 0,
            avgPrice: data.avgPrice || 0,
            availabilityPct: calculatedAvailability,
          });

          // Set total packages from backend response
          setTotalPackages(data.totalPackages || 0);

          // Set services data if available
          if (data.services) {
            setServices(data.services);
          }
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signout();
      // Navigate to home page after logout with fromLogout state
      navigate("/", { state: { fromLogout: true } });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setLoading(false);
    }
  };

  // Update the analyticsSummary to calculate availability based on services
  const analyticsSummary = useMemo(() => {
    // Calculate availability: 100% if services exist, 0% if no services
    const calculatedAvailability = metrics.totalServices > 0 ? 100 : 0;

    return [
      { label: "Total Services", value: metrics.totalServices },
      { label: "Average Price", value: formatCurrency(metrics.avgPrice) },
      { label: "Availability", value: `${calculatedAvailability}%` },
    ];
  }, [metrics]);

  const downloadReport = async () => {
    try {
      setLoading(true);

      // Fetch detailed services data for the report using apiClient
      let servicesData = [];
      try {
        const servicesResponse = await api.get("/services/my-services");

        // Handle both direct array response and object with data property
        servicesData = Array.isArray(servicesResponse.data)
          ? servicesResponse.data
          : Array.isArray(servicesResponse.data.data)
          ? servicesResponse.data.data
          : [];
      } catch (serviceError) {
        console.warn(
          "Could not fetch detailed services data for report:",
          serviceError
        );
        toast.error("Could not fetch detailed service data");
        return;
      }

      // Create summary data rows
      const summaryRows = [
        [
          "Name",
          "Email",
          "Phone",
          "Location",
          "Total Services",
          "Average Price",
          "Availability %",
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
        ],
      ];

      // Create detailed services data rows
      const serviceHeaders = [
        "Service ID",
        "Title",
        "Description",
        "Category",
        "Created At",
        "Number of Packages",
        "Average Package Price",
      ];

      const serviceRows = servicesData.map((service) => {
        // Calculate average package price
        let avgPackagePrice = 0;
        let packageCount = 0;
        if (Array.isArray(service.packages)) {
          const validPrices = service.packages
            .map((pkg) => (typeof pkg.price === "number" ? pkg.price : 0))
            .filter((price) => price > 0);
          if (validPrices.length > 0) {
            avgPackagePrice =
              validPrices.reduce((sum, price) => sum + price, 0) /
              validPrices.length;
            packageCount = validPrices.length;
          }
        }

        return [
          service._id || "N/A",
          service.title || "N/A",
          service.description || "N/A",
          service.category || "N/A",
          service.createdAt
            ? new Date(service.createdAt).toLocaleDateString()
            : "N/A",
          packageCount,
          avgPackagePrice.toFixed(2),
        ];
      });

      // Combine all data into one CSV
      const csvContent = [
        ["SERVICE PROVIDER ANALYTICS REPORT"],
        [""],
        ...summaryRows,
        [""],
        ["DETAILED SERVICES INFORMATION"],
        [""],
        serviceHeaders,
        ...serviceRows,
      ]
        .map((row) =>
          row
            .map((field) => `"${String(field).replaceAll('"', '""')}"`)
            .join(",")
        )
        .join("\n");

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `service-provider-report-${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // New function to generate PDF report
  const generatePDFReport = async () => {
    try {
      setLoading(true);

      // Fetch detailed services data for the PDF report using apiClient
      let servicesData = [];
      try {
        const servicesResponse = await api.get("/services/my-services");

        // Handle both direct array response and object with data property
        servicesData = Array.isArray(servicesResponse.data)
          ? servicesResponse.data
          : Array.isArray(servicesResponse.data.data)
          ? servicesResponse.data.data
          : [];
      } catch (serviceError) {
        console.warn(
          "Could not fetch detailed services data for PDF report:",
          serviceError
        );
        toast.error("Could not fetch detailed service data");
        return;
      }

      // Prepare provider data for PDF
      const providerData = {
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        location: provider.location,
        joinDate: user?.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "N/A",
        verificationStatus: user?.verification?.isVerified
          ? "Verified"
          : "Not Verified",
        metrics: metrics,
      };

      // Generate PDF
      await generateServiceProviderReport(providerData, servicesData);

      toast.success("PDF report generated successfully!");
    } catch (e) {
      console.error("Error generating PDF report:", e);
      toast.error("Failed to generate PDF report");
    } finally {
      setLoading(false);
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
    // Changed from min-h-screen bg-base-200 to min-h-screen bg-white
    <div className="min-h-screen bg-white">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="relative">
              <PackageIcon className="text-[#F97316] w-16 h-16 animate-bounce" />
              <div className="absolute inset-0 bg-[#F97316] opacity-30 rounded-full animate-ping"></div>
            </div>
            <p className="text-white mt-4 font-medium">Logging out...</p>
          </div>
        </div>
      )}
      <div className="flex">
        {/* Sidebar - keeping the blue background as it's part of the design */}
        <aside className="hidden md:flex w-64 min-h-screen sticky top-0 flex-col border-r bg-[#1E40AF]">
          <div className="p-4 border-b border-white/20">
            <h2 className="font-bold text-lg text-white">Provider Dashboard</h2>
            <p className="text-sm text-white/70">
              Manage your services and sales
            </p>
          </div>

          <nav className="p-2 space-y-1">
            <Link
              to="/dashboard/service-provider/appointments"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors"
            >
              <CalendarDaysIcon className="size-4" />
              <span>Appointments</span>
            </Link>
            <Link
              to="/dashboard/service-provider/advertisements"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors"
            >
              <MegaphoneIcon className="size-4" />
              <span>Advertisements</span>
            </Link>
            <Link
              to="/dashboard/service-provider/my-services"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors"
            >
              <PackageIcon className="size-4" />
              <span>Services</span>
            </Link>
            <Link
              to="/dashboard/service-provider/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#F97316] transition-colors"
            >
              <UserIcon className="size-4" />
              <span>My Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-red-600 transition-colors w-full text-left mt-auto"
            >
              <LogOutIcon className="size-4" />
              <span>Logout</span>
            </button>
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

        {/* Main - changed from flex-1 to flex-1 bg-white */}
        <main className="flex-1 bg-white">
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
                    
                  </div>
                  <div>
                    <div className="text-white text-3xl md:text-4xl font-bold leading-tight">
                      {provider.name}
                    </div>
                    <div className="text-white/80">
                      Professional Pet Care Provider
                    </div>
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
              {/* Changed from bg-base-100 to bg-white and added border */}
              <div className="lg:col-span-1">
                <div className="card bg-white border p-6 flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-base-200 border border-gray-300 mb-4">
                    <MegaphoneIcon className="size-8 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-base-content mb-2">
                    Boost Your Business
                  </h3>
                  <p className="text-base-content/70 mb-6">
                    Create eye-catching advertisements to attract more customers
                    to your services.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Link
                      to="/dashboard/service-provider/advertisements"
                      className="flex-1 px-4 py-2 text-sm md:text-base font-medium rounded-lg text-white bg-[#1E40AF] border border-[#1E40AF] border-t-4 transition-all duration-200 hover:bg-[#F97316] hover:border-[#F97316] hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="size-4" />
                      Create New Advertisement
                    </Link>
                  </div>
                </div>
              </div>

              {/* Analytics Summary - now takes 2 columns */}
              {/* Changed from bg-base-100 to bg-white and added border */}
              <div className="space-y-4 p-4 bg-white rounded-lg border lg:col-span-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Analytics Summary</h2>
                  <span className="text-sm text-gray-500">
                    {metrics.totalServices}{" "}
                    {metrics.totalServices === 1 ? "service" : "services"}{" "}
                    created
                  </span>
                </div>

                {/* Service Availability */}
                <div className="p-4 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="size-4 text-green-500" />
                    <span className="text-base-content/70">
                      Service Availability
                    </span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {metrics.totalServices > 0 ? "100" : "0"}%
                  </span>
                </div>

                {/* Package Options */}
                <div className="p-4 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageIcon className="size-4 text-blue-500" />
                    <span className="text-base-content/70">
                      Total Package Options
                    </span>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {totalPackages}
                  </span>
                </div>

                {/* Average Price */}
                <div className="p-4 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold">₨</span>
                    <span className="text-base-content/70">
                      Average Package Price
                    </span>
                  </div>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(metrics.avgPrice)}
                  </span>
                </div>

                {/* No Services Message */}
                {metrics.totalServices === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <PackageIcon className="size-12 mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">No services created yet</p>
                    <Link
                      to="/services/create/select"
                      className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#1E40AF] hover:bg-[#F97316] transition-colors inline-flex items-center gap-2"
                    >
                      <PlusIcon className="size-4" />
                      Create Your First Service
                    </Link>
                  </div>
                )}

                {/* Footer */}
                {metrics.totalServices > 0 && (
                  <>
                    <p className="text-sm text-gray-500 mt-2">
                      Download the complete analytics report to gain deeper
                      insights into your services
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={downloadReport}
                        disabled={loading}
                        className="px-4 py-2 text-sm md:text-base font-medium rounded-lg text-white bg-[#1E40AF] border border-[#1E40AF] border-t-4 transition-all duration-200 hover:bg-[#F97316] hover:border-[#F97316] hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                      >
                        <DownloadIcon className="size-4" />
                        {loading
                          ? "Generating..."
                          : "Generate Detailed CSV Report"}
                      </button>

                      <button
                        onClick={generatePDFReport}
                        disabled={loading}
                        className="px-4 py-2 text-sm md:text-base font-medium rounded-lg text-white bg-[#F97316] border border-[#F97316] border-t-4 transition-all duration-200 hover:bg-[#1E40AF] hover:border-[#1E40AF] hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                      >
                        <DownloadIcon className="size-4" />
                        {loading
                          ? "Generating..."
                          : "Generate Detailed PDF Report"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServicePdashboard;
