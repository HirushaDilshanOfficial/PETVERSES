import React from "react";
import { Routes, Route } from "react-router-dom";
import ProductPage from "./pages/productPage.jsx";

import CartPage from "./Pages/CartPage.jsx";
import { CartProvider } from "./contexts/CartContext";
import CheckoutPage from "./Pages/CheckoutPage.jsx";
import OtpVerificationPage from "./Pages/OtpVerificationPage.jsx";
import BankTransferPage from "./Pages/BankTransferPage.jsx";
import PaymentSuccess from "./components/PaymentSuccess.jsx";
import PaymentPage from "./components/PaymentPage.jsx";
import AdPaymentPage from "./components/AdPaymentPage.jsx"; // Add AdPaymentPage import
import FaqPage from "./Pages/FaqPage.jsx";
import FaqAdmin from "./Pages/FaqAdmin.jsx";
import PolicyPage from "./Pages/PolicyPage.jsx"; // Add PolicyPage import
import TermsAndConditionsPage from "./Pages/TermsAndConditions.jsx"; // Add TermsAndConditions import
import Aboutus from "./Pages/Aboutus.jsx"; // Add Aboutus import
import GamePage from "./Pages/GamePage.jsx";

// Import Home component
import Home from "./Pages/Home.jsx";
// Import auth components
import Login from "./pages/auth/Login.js";
import AdminLogin from "./pages/auth/AdminLogin.js";
import RoleSelection from "./pages/auth/RoleSelection.js";
import PetOwnerSignup from "./pages/auth/PetOwnerSignup.js";
import ServiceProviderSignup from "./pages/auth/ServiceProviderSignup.js";
import ForgotPassword from "./pages/auth/ForgotPassword.js";
// Import additional components
import ServiceDetailPage from "./Pages/ServiceDetailPage";
import ServicesPage from "./pages/ServicesPage.jsx";
import Contactus from "./Pages/Contactus";
// Import dashboard components
import PetOwnerProfile from "./pages/dashboards/PetOwnerProfile.jsx";
import ServiceProviderDashboard from "./Pages/dashboards/ServiceProviderDashboard.js";
import ServiceProviderAdvertisements from "./pages/dashboards/ServiceProviderAdvertisements.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdAdmin from "./components/AdAdmin.jsx"; // Import AdAdmin component
import AnnouncementManagement from "./components/admin/AnnouncementManagement.jsx"; // Add this import
import AdminLayout from "./layouts/AdminLayout.jsx";
// Import Admin sub-pages
import UserManagementPage from "./pages/admin/UserManagementPage.jsx";
import KYCReviewPage from "./Pages/admin/KYCReviewPage.jsx";
import InventoryPage from "./Pages/admin/InventoryPage.jsx";
import PaymentsPage from "./Pages/admin/PaymentsPage.jsx";
import SearchResultsPage from "./Pages/admin/SearchResultsPage.jsx";
import AnalysisPage from "./Pages/admin/AnalysisPage.jsx";
import ProfilePage from "./pages/admin/ProfilePage.jsx";
//import GeographicAnalysisPage from "./Pages/admin/GeographicAnalysisPage.jsx";
// Import DashboardRedirect component
import DashboardRedirect from "./components/common/DashboardRedirect.jsx";
// Import Protected Routes
import ProtectedRoute, {
  AdminRoute,
  ServiceProviderRoute,
  PetOwnerRoute,
} from "./components/common/ProtectedRoute";
// Service-related components from App.jsx
import ServicePage from "./pages/ServicePage";
import CreatePage from "./pages/CreateService";
import SelectServiceCategory from "./pages/SelectServiceCategory";
import ServicePdashboard from "./Pages/ServicePdashboard";
import MyServices from "./pages/MyServices";
import EditService from "./pages/EditService";
import ServiceReviewPage, {
  ProductReviewPage,
} from "./Pages/ServiceReviewPage";
// Import provider profile component
import ServiceProviderProfile from "./Pages/provideProfile.jsx";
import ServiceProviderAppointments from "./Pages/ServiceProviderAppointments.jsx";
import GrPackages from "./Pages/grpackages.jsx"; // Added import for GrPackages

function App() {
  return (
    <CartProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/products/:id" element={<ProductDetailedPage />} />
        <Route path="/services" element={<ServicePage />} />
        <Route path="/service/:id" element={<ServiceDetailPage />} />
        <Route path="/service/:id/review" element={<ServiceReviewPage />} />
        <Route path="/product/:id/review" element={<ProductReviewPage />} />
        <Route path="/contactus" element={<Contactus />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/policy" element={<PolicyPage />} />{" "}
        {/* Add Policy route */}
        <Route path="/terms" element={<TermsAndConditionsPage />} />{" "}
        {/* Add Terms route */}
        <Route path="/about" element={<Aboutus />} /> {/* Add About route */}
        <Route path="/grooming-packages" element={<GrPackages />} />{" "}
        {/* Added route for GrPackages */}
        <Route path="/game" element={<GamePage />} /> {/* Add Game route */}
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/signup" element={<RoleSelection />} />
        <Route path="/signup/petOwner" element={<PetOwnerSignup />} />
        <Route
          path="/signup/serviceProvider"
          element={<ServiceProviderSignup />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard/pet-owner/profile"
          element={
            <PetOwnerRoute>
              <PetOwnerProfile />
            </PetOwnerRoute>
          }
        />
        <Route
          path="/dashboard/service-provider"
          element={
            <ServiceProviderRoute>
              <ServiceProviderDashboard />
            </ServiceProviderRoute>
          }
        />
        {/* Service Provider Profile Route */}
        <Route
          path="/dashboard/service-provider/profile"
          element={
            <ServiceProviderRoute>
              <ServiceProviderProfile />
            </ServiceProviderRoute>
          }
        />
        <Route
          path="/dashboard/service-provider/advertisements"
          element={
            <ServiceProviderRoute>
              <ServiceProviderAdvertisements />
            </ServiceProviderRoute>
          }
        />
        <Route
          path="/dashboard/service-provider/appointments"
          element={
            <ServiceProviderRoute>
              <ServiceProviderAppointments />
            </ServiceProviderRoute>
          }
        />
        <Route
          path="/dashboard/service-provider/services"
          element={
            <ServiceProviderRoute>
              <ServicePdashboard />
            </ServiceProviderRoute>
          }
        />
        <Route
          path="/dashboard/service-provider/my-services"
          element={
            <ServiceProviderRoute>
              <MyServices />
            </ServiceProviderRoute>
          }
        />
        {/* Admin Routes with Layout */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="kyc" element={<KYCReviewPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="analytics" element={<AnalysisPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="advertisements" element={<AdAdmin />} />
          <Route
            path="announcements"
            element={<AnnouncementManagement />}
          />{" "}
          {/* Add this route */}
          <Route path="faqs" element={<FaqAdmin />} />
          <Route path="search" element={<SearchResultsPage />} />
        </Route>
        {/* Service-related routes */}
        <Route path="/services/create" element={<CreatePage />} />
        <Route
          path="/services/create/select"
          element={<SelectServiceCategory />}
        />
        <Route path="/services/:id/edit" element={<EditService />} />
        {/* Redirect dashboard to appropriate role-based dashboard */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        {/* Cart and Checkout Routes */}
        <Route
          path="/cart"
          element={
            <PetOwnerRoute>
              <CartPage />
            </PetOwnerRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PetOwnerRoute>
              <CheckoutPage />
            </PetOwnerRoute>
          }
        />
        <Route
          path="/payment/:orderId"
          element={
            <PetOwnerRoute>
              <PaymentPage />
            </PetOwnerRoute>
          }
        />
        {/* Appointment Payment Route */}
        <Route
          path="/payment/appointment/:appointmentId"
          element={
            <PetOwnerRoute>
              <PaymentPage />
            </PetOwnerRoute>
          }
        />
        {/* Advertisement Payment Route */}
        <Route
          path="/payment/advertisement"
          element={
            <ServiceProviderRoute>
              <AdPaymentPage />
            </ServiceProviderRoute>
          }
        />
        <Route
          path="/bank-transfer/:orderId"
          element={
            <PetOwnerRoute>
              <BankTransferPage />
            </PetOwnerRoute>
          }
        />
        <Route
          path="/otp-verification"
          element={
            <PetOwnerRoute>
              <OtpVerificationPage />
            </PetOwnerRoute>
          }
        />
        <Route path="/success" element={<PaymentSuccess />} />
      </Routes>
    </CartProvider>
  );
}

export default App;
