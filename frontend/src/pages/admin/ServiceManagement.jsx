import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Add search term state
  const [formData, setFormData] = useState({
    userID: '',
    title: '',
    description: '',
    price: '',
    images: []
  });

  // Fetch services from API
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/services');
      const data = await response.json();
      setServices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new service
  const handleCreateService = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        }),
      });
      
      if (response.ok) {
        await fetchServices();
        setShowModal(false);
        resetForm();
        alert('Service created successfully!');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error creating service');
    }
  };

  // Update service
  const handleUpdateService = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/services/${editingService._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        }),
      });
      
      if (response.ok) {
        await fetchServices();
        setShowModal(false);
        setEditingService(null);
        resetForm();
        alert('Service updated successfully!');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Error updating service');
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/services/${serviceId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await fetchServices();
          alert('Service deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting service');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      userID: '',
      title: '',
      description: '',
      price: '',
      images: []
    });
  };

  // Open edit modal
  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      userID: service.userID,
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      images: service.images || []
    });
    setShowModal(true);
  };

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('PETVERSE - Services Report', 20, 20);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Table data
    const tableData = services.map(service => [
      service.title,
      service.userID,
      service.description.substring(0, 50) + '...',
      `$${service.price}`,
      new Date(service.createdAt).toLocaleDateString()
    ]);
    
    // Add table
    doc.autoTable({
      head: [['Title', 'User ID', 'Description', 'Price', 'Created Date']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255
      }
    });
    
    // Summary
    const totalServices = services.length;
    const totalRevenue = services.reduce((sum, service) => sum + service.price, 0);
    const avgPrice = totalRevenue / totalServices || 0;
    
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('Summary:', 20, finalY);
    doc.text(`Total Services: ${totalServices}`, 20, finalY + 10);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, finalY + 20);
    doc.text(`Average Price: $${avgPrice.toFixed(2)}`, 20, finalY + 30);
    
    doc.save('petverse-services-report.pdf');
  };

  // Filter services based on search term
  const filteredServices = services.filter(service => {
    // First letter matching logic
    if (searchTerm) {
      const searchTermTrimmed = searchTerm.trim();
      if (!searchTermTrimmed) return true;
      
      const firstLetter = searchTermTrimmed.charAt(0).toLowerCase();
      const searchLower = searchTermTrimmed.toLowerCase();
      
      // First letter matching - check if any field starts with the first letter
      const hasFirstLetterMatch = 
        (service.title && service.title.toLowerCase().startsWith(firstLetter)) ||
        (service.userID && service.userID.toLowerCase().startsWith(firstLetter)) ||
        (service.description && service.description.toLowerCase().startsWith(firstLetter)) ||
        (service.category && service.category.toLowerCase().startsWith(firstLetter));
      
      // Substring matching - check if any field contains the search term
      const hasSubstringMatch = 
        (service.title && service.title.toLowerCase().includes(searchLower)) ||
        (service.userID && service.userID.toLowerCase().includes(searchLower)) ||
        (service.description && service.description.toLowerCase().includes(searchLower)) ||
        (service.category && service.category.toLowerCase().includes(searchLower));
      
      // Return true if either first letter matches or substring matches
      return hasFirstLetterMatch || hasSubstringMatch;
    }
    return true; // Show all services if no search term
  });

  // Chart data
  const chartData = {
    labels: services.slice(0, 10).map(service => service.title.substring(0, 15) + '...'),
    datasets: [
      {
        label: 'Service Prices',
        data: services.slice(0, 10).map(service => service.price),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
          '#06B6D4',
          '#84CC16',
          '#F97316',
          '#6366F1'
        ],
        borderWidth: 1
      }
    ]
  };

  const doughnutData = {
    labels: ['Low Price ($0-50)', 'Medium Price ($51-100)', 'High Price ($100+)'],
    datasets: [
      {
        data: [
          services.filter(s => s.price <= 50).length,
          services.filter(s => s.price > 50 && s.price <= 100).length,
          services.filter(s => s.price > 100).length
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 2
      }
    ]
  };

  if (loading) {
    return <div className="p-6">Loading services...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-2">Manage all pet services in the system</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Allow any text input for flexible search
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
            <button
              onClick={generatePDF}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download PDF
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingService(null);
                setShowModal(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Service Prices (Top 10)</h3>
            <Bar data={chartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Price Distribution</h3>
            <div className="w-80 mx-auto">
              <Doughnut data={doughnutData} options={{ responsive: true }} />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Services</h3>
          <p className="text-2xl font-bold text-blue-600">{services.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">
            ${services.reduce((sum, service) => sum + service.price, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Average Price</h3>
          <p className="text-2xl font-bold text-purple-600">
            ${(services.reduce((sum, service) => sum + service.price, 0) / services.length || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Highest Price</h3>
          <p className="text-2xl font-bold text-red-600">
            ${Math.max(...services.map(s => s.price), 0)}
          </p>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Services</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No services found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{service.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.userID}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {service.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-green-600">
                        ${service.price}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(service.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(service)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  name="userID"
                  value={formData.userID}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter service title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter service description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter price"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingService(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={editingService ? handleUpdateService : handleCreateService}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                {editingService ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceManagement;