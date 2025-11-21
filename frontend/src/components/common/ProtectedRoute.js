import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, requiredRole, redirectTo = "/login" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login (unless it's the home page)
  if (!user) {
    // If trying to access home page, allow it
    if (location.pathname === "/") {
      return children;
    }
    // Otherwise redirect to login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If a specific role is required, check user's role
  if (requiredRole && user) {
    // Note: role in database is "petOwner" (with capital O)
    const userRole = user.role;
    const normalizedRequiredRole =
      requiredRole === "petowner" ? "petOwner" : requiredRole;

    // Check if user role is defined
    if (!userRole) {
      console.error("User role is not defined");
      return <Navigate to="/login" replace />;
    }

    if (userRole !== normalizedRequiredRole) {
      // Redirect based on user's actual role
      const roleRedirects = {
        admin: "/admin/dashboard",
        serviceProvider: "/dashboard/service-provider",
        petOwner: "/dashboard/pet-owner/profile",
      };

      const redirectPath = roleRedirects[userRole] || "/dashboard";

      return <Navigate to={redirectPath} replace />;
    }
  }

  // Allow access if all checks pass
  return children;
};

// Higher-order component for role-based access
export const withRoleAccess = (WrappedComponent, requiredRole) => {
  return function RoleProtectedComponent(props) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Specific protected route components for each role
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export const ServiceProviderRoute = ({ children }) => (
  <ProtectedRoute requiredRole="serviceProvider" redirectTo="/">
    {children}
  </ProtectedRoute>
);

export const PetOwnerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="petOwner">{children}</ProtectedRoute>
);

// Route that requires any authenticated user (no specific role)
export const AuthenticatedRoute = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

export default ProtectedRoute;
