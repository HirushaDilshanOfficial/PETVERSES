import User from "../Models/User.js";
import Service from "../Models/Service.js";
import Order from "../Models/Order.js";
import Payment from "../Models/Payment.js";
import Product from "../Models/Product.js";
import Appointment from "../Models/Appointment.js";
import Advertisement from "../Models/AdvertisementModel.js";

// Get dashboard statistics for admin
export const getDashboardStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    // Get current statistics
    const totalUsers = await User.countDocuments();
    const pendingKYC = await User.countDocuments({
      role: "serviceProvider",
      "verification.isVerified": false,
      "verification.isRejected": false,
    });

    const activeServices = await Service.countDocuments({
      service_status: "approved",
    });

    // Calculate total revenue from successful payments
    const payments = await Payment.find({ status: "success" });
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Get product stock statistics
    const products = await Product.find();
    const outOfStockCount = products.filter(
      (product) => product.pQuantity === 0
    ).length;
    const lowStockCount = products.filter(
      (product) => product.pQuantity > 0 && product.pQuantity < 5
    ).length;

    // Get statistics from one week ago for percentage change calculation
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const totalUsersLastWeek = await User.countDocuments({
      createdAt: { $lt: oneWeekAgo },
    });

    const pendingKYCLastWeek = await User.countDocuments({
      role: "serviceProvider",
      "verification.isVerified": false,
      "verification.isRejected": false,
      createdAt: { $lt: oneWeekAgo },
    });

    const activeServicesLastWeek = await Service.countDocuments({
      service_status: "approved",
      createdAt: { $lt: oneWeekAgo },
    });

    // Calculate revenue from one week ago
    const paymentsLastWeek = await Payment.find({
      status: "success",
      paidAt: { $lt: oneWeekAgo },
    });
    const totalRevenueLastWeek = paymentsLastWeek.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const statsChange = {
      totalUsers: calculateChange(totalUsers, totalUsersLastWeek),
      pendingKYC: calculateChange(pendingKYC, pendingKYCLastWeek),
      activeServices: calculateChange(activeServices, activeServicesLastWeek),
      totalRevenue: calculateChange(totalRevenue, totalRevenueLastWeek),
    };

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        pendingKYC,
        activeServices,
        totalRevenue,
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
      },
      statsChange,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get analytics data for service provider dashboard
export const getServiceProviderAnalytics = async (req, res) => {
  try {
    // Check if user is a service provider
    if (req.user.role !== "serviceProvider") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Service providers only.",
      });
    }

    const providerId = req.user.userId;

    // Get services created by this provider
    const services = await Service.find({ "provider.userId": providerId });

    // Calculate total services
    const totalServices = services.length;

    // Calculate total packages
    let totalPackages = 0;
    services.forEach((service) => {
      if (Array.isArray(service.packages)) {
        totalPackages += service.packages.length;
      }
    });

    // Calculate average price from packages
    let totalPrice = 0;
    let packageCount = 0;

    services.forEach((service) => {
      if (Array.isArray(service.packages)) {
        service.packages.forEach((pkg) => {
          if (typeof pkg.price === "number") {
            totalPrice += pkg.price;
            packageCount++;
          }
        });
      }
    });

    const avgPrice = packageCount > 0 ? totalPrice / packageCount : 0;

    // Calculate availability percentage (100% if services exist, 0% if no services)
    // Updated logic: if there are services, availability is 100%, otherwise 0%
    const availabilityPct = totalServices > 0 ? 100 : 0;

    // Get appointments for this provider's services
    const serviceIds = services.map((service) => service._id.toString());
    const appointments = await Appointment.find({
      service_id: { $in: serviceIds },
    });
    const totalAppointments = appointments.length;

    // Get products (assuming this is related to the provider's services)
    const products = await Product.find();
    const totalProducts = products.length;

    // Get orders related to products (this might need adjustment based on business logic)
    const orders = await Order.find();
    const totalOrders = orders.length;

    // Get advertisements created by this provider
    const advertisements = await Advertisement.find({
      provider_ID: providerId,
    });
    const totalAdvertisements = advertisements.length;

    // Prepare simplified service data for the frontend
    const serviceDetails = services.map((service) => ({
      _id: service._id,
      title: service.title,
      description: service.description,
      category: service.category,
      service_status: service.service_status,
      createdAt: service.createdAt,
      packages: service.packages || [],
    }));

    res.status(200).json({
      success: true,
      data: {
        totalServices,
        totalPackages,
        avgPrice,
        availabilityPct,
        totalAppointments,
        totalProducts,
        totalOrders,
        totalAdvertisements,
        services: serviceDetails, // Include service details
      },
    });
  } catch (error) {
    console.error("Error fetching service provider analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
