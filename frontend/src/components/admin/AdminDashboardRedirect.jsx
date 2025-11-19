import React from 'react';
import { Navigate } from 'react-router-dom';

// Simple redirect component for old admin dashboard
function AdminDashboardRedirect() {
  return <Navigate to="/admin/dashboard" replace />;
}

export default AdminDashboardRedirect;