import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar.jsx';
import Navbar from '../components/admin/Navbar.jsx';

// Main Admin Layout Component for beginners
function AdminLayout() {
  console.log("AdminLayout - Rendering");
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="ml-64">
        {/* Top Navbar */}
        <Navbar />
        
        {/* Page Content */}
        <main className="min-h-screen">
          {/* This will render the current page component */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;