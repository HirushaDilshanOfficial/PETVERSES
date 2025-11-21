import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getIdToken } from '../../utils/authUtils';

// Simple Inventory Management Page with Real API Integration
function InventoryPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  
  // State for products and UI
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Predefined categories
  const [categories, setCategories] = useState([
    'Food',
    'Toys',
    'Grooming',
    'Health',
    'Clothing',
    'Beds',
    'Carriers',
    'Training',
    'Treats'
  ]);
  
  // Form data for new product
  const [newProduct, setNewProduct] = useState({
    productID: '',
    pName: '',
    pDescription: '',
    pCategory: '',
    pPrice: '',
    pQuantity: '',
    pImage: '',
    status: 'Active'
  });
  
  // Form data for new category
  const [newCategory, setNewCategory] = useState('');
  
  // Form errors
  const [formErrors, setFormErrors] = useState({});
  
  // Image file state
  const [imageFile, setImageFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  // State for notifications
  const [notifications, setNotifications] = useState([]);
  
  // Function to show notification
  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    const newNotification = { id, message, type };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 3000);
  };
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Helper function to convert image to base64
  const getImageBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Important for same-origin images
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg");
        resolve(dataURL);
      };
      img.onerror = function () {
        reject(new Error("Failed to load image at " + url));
      };
      img.src = url;
    });
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      if (authLoading) return; // Wait for auth to load
      // Check if user is authenticated and is an admin
      if (!currentUser || currentUser.role !== 'admin') return;
      
      setLoading(true);
      setError(null);
      
      // Get Firebase ID token for authentication
      const token = await getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    // Check if user is authenticated and is an admin
    if (currentUser && currentUser.role === 'admin') {
      fetchProducts();
    }
  }, [currentUser, authLoading]);

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory) {
      if (product.pCategory !== selectedCategory) {
        return false;
      }
    }
    
    // First letter matching logic
    if (searchTerm) {
      const searchTermTrimmed = searchTerm.trim();
      if (!searchTermTrimmed) {
        return true; // If no search term but category filter applied
      }
      
      const firstLetter = searchTermTrimmed.charAt(0).toLowerCase();
      const searchLower = searchTermTrimmed.toLowerCase();
      
      // First letter matching - check if any field starts with the first letter
      const hasFirstLetterMatch = 
        (product.pName && product.pName.toLowerCase().startsWith(firstLetter)) ||
        (product.productID && product.productID.toLowerCase().startsWith(firstLetter)) ||
        (product.pCategory && product.pCategory.toLowerCase().startsWith(firstLetter));
      
      // Substring matching - check if any field contains the search term
      const hasSubstringMatch = 
        (product.pName && product.pName.toLowerCase().includes(searchLower)) ||
        (product.productID && product.productID.toLowerCase().includes(searchLower)) ||
        (product.pCategory && product.pCategory.toLowerCase().includes(searchLower));
      
      // Return true if either first letter matches or substring matches
      return hasFirstLetterMatch || hasSubstringMatch;
    }
    return true; // Show all products if no search term
  });

  // Check if product has low stock (less than 5)
  const isLowStock = (quantity) => quantity < 5;

  // Handle form input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Apply specific validation based on field name
    switch (name) {
      case 'pPrice':
        // Prevent entering negative values or minus sign
        // Allow only positive numbers and decimal points, limit to 7 digits
        if (value === '' || /^[0-9]{0,7}(\.[0-9]{0,2})?$/.test(value)) {
          // Additional check to ensure value doesn't start with minus
          if (!value.startsWith('-')) {
            // Prevent invalid formats like multiple decimal points
            const decimalPoints = (value.match(/\./g) || []).length;
            if (decimalPoints <= 1) {
              // If value is not empty, check if it's a valid positive number
              if (value === '' || (parseFloat(value) > 0) || value === '0' || value === '0.' || value.startsWith('0.')) {
                setNewProduct({
                  ...newProduct,
                  [name]: value
                });
              }
            }
          }
        }
        break;
      case 'pQuantity':
        // Prevent minus sign and decimal points, limit to 6 digits
        // Allow only positive integers up to 6 digits, and prevent leading zeros
        if (value === '' || /^[1-9][0-9]{0,5}$/.test(value) || value === '0') {
          // Additional check to ensure value doesn't start with minus or leading zero (except for "0" itself)
          if (!value.startsWith('-') && (value === '0' || !value.startsWith('0'))) {
            setNewProduct({
              ...newProduct,
              [name]: value
            });
          }
        }
        break;
      case 'productID':
        // Allow only letters and numbers, with length restrictions (3-6 characters)
        // More permissive during typing but still restrict characters
        if (value === '' || /^[a-zA-Z0-9]*$/.test(value)) {
          // Only enforce length restrictions if the value is not empty
          if (value === '' || (value.length >= 1 && value.length <= 6)) {
            setNewProduct({
              ...newProduct,
              [name]: value
            });
          }
        }
        break;
      case 'pName':
        // Allow letters, numbers, and spaces
        if (/^[a-zA-Z0-9\s]*$/.test(value) || value === '') {
          setNewProduct({
            ...newProduct,
            [name]: value
          });
        }
        break;
      case 'pCategory':
        // Allow only letters and digits (no special characters)
        if (/^[a-zA-Z0-9\s]*$/.test(value) || value === '') {
          setNewProduct({
            ...newProduct,
            [name]: value
          });
        }
        break;
      default:
        setNewProduct({
          ...newProduct,
          [name]: value
        });
    }
  };
  
  // Handle search term change with validation
  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Allow letters, numbers, and spaces for complete word search
    if (/^[a-zA-Z0-9\s]*$/.test(value) || value === '') {
      setSearchTerm(value);
    }
  };
  
  // Handle adding a new category
  const handleAddCategory = (newCategory) => {
    if (newCategory && newCategory.trim() !== '') {
      const trimmedCategory = newCategory.trim();
      if (!categories.includes(trimmedCategory)) {
        setCategories(prev => [...prev, trimmedCategory]);
      }
      return trimmedCategory;
    }
    return null;
  };
  
  // Handle opening the add category modal
  const openAddCategoryModal = () => {
    setNewCategory('');
    setShowAddCategoryModal(true);
  };
  
  // Handle saving a new category
  const saveNewCategory = () => {
    // Validate category name (only letters, digits, and spaces)
    if (!newCategory || newCategory.trim() === '') {
      showNotification('Category name is required', 'error');
      return;
    }
    
    if (!/^[a-zA-Z0-9\s]+$/.test(newCategory.trim())) {
      showNotification('Category name can only contain letters, digits, and spaces', 'error');
      return;
    }
    
    const addedCategory = handleAddCategory(newCategory);
    if (addedCategory) {
      setNewProduct({...newProduct, pCategory: addedCategory});
      setShowAddCategoryModal(false);
      setNewCategory('');
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!newProduct.productID.trim()) {
      errors.productID = 'Product ID is required';
    } else if (newProduct.productID.length < 3 || newProduct.productID.length > 6) {
      errors.productID = 'Product ID must be between 3 and 6 characters';
    }
    
    if (!newProduct.pName.trim()) {
      errors.pName = 'Product name is required';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(newProduct.pName)) {
      errors.pName = 'Product name can only contain letters, numbers, and spaces';
    } else if (newProduct.pName.length > 50) {
      errors.pName = 'Product name cannot exceed 50 characters';
    }
    
    if (!newProduct.pCategory) {
      errors.pCategory = 'Category is required';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(newProduct.pCategory)) {
      errors.pCategory = 'Category can only contain letters, digits, and spaces';
    }
    
    if (!newProduct.pPrice || newProduct.pPrice === '' || parseFloat(newProduct.pPrice) <= 0 || isNaN(parseFloat(newProduct.pPrice))) {
      errors.pPrice = 'Price must be greater than 0';
    } else {
      // Check if price has more than 7 digits before decimal point
      const priceParts = newProduct.pPrice.toString().split('.');
      if (priceParts[0].length > 7) {
        errors.pPrice = 'Price cannot have more than 7 digits before the decimal point';
      }
      // Check if price has more than 2 decimal places
      if (priceParts[1] && priceParts[1].length > 2) {
        errors.pPrice = 'Price cannot have more than 2 decimal places';
      }
      // Check for proper decimal formatting
      if (newProduct.pPrice.toString().endsWith('.')) {
        errors.pPrice = 'Price must have exactly 2 decimal places';
      }
    }
    
    if (!newProduct.pQuantity || newProduct.pQuantity === '' || parseInt(newProduct.pQuantity) < 0 || isNaN(parseInt(newProduct.pQuantity))) {
      errors.pQuantity = 'Quantity must be 0 or greater';
    } else if (newProduct.pQuantity.toString().length > 6) {
      errors.pQuantity = 'Quantity cannot exceed 999999';
    } else if (newProduct.pQuantity.toString().startsWith('0') && newProduct.pQuantity.toString() !== '0') {
      errors.pQuantity = 'Quantity cannot start with zero';
    }
    
    // Check for duplicate product ID
    const isDuplicate = products.some(product => 
      product.productID === newProduct.productID && 
      (!selectedProduct || product._id !== selectedProduct._id)
    );
    
    if (isDuplicate) {
      errors.productID = 'A product with this ID already exists';
    }
    
    // For add product form, check if image is required
    if (!selectedProduct && !imageFile) {
      errors.pImage = 'Product image is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle adding a new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const token = await getIdToken();
      
      // Prepare form data
      const formData = new FormData();
      formData.append('productID', newProduct.productID);
      formData.append('pName', newProduct.pName);
      formData.append('pDescription', newProduct.pDescription);
      formData.append('pCategory', newProduct.pCategory);
      formData.append('pPrice', newProduct.pPrice);
      formData.append('pQuantity', newProduct.pQuantity);
      formData.append('status', newProduct.status);
      
      // Add image (now required)
      if (imageFile) {
        formData.append('pImage', imageFile);
      }
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }
      
      // Reset form
      setNewProduct({
        productID: '',
        pName: '',
        pDescription: '',
        pCategory: '',
        pPrice: '',
        pQuantity: '',
        pImage: '',
        status: 'Active'
      });
      setImageFile(null);
      setShowAddModal(false);
      
      // Refresh products list
      fetchProducts();
      
      showNotification('Product added successfully!');
    } catch (err) {
      console.error('Error adding product:', err);
      showNotification(`Error: ${err.message}`, 'error');
    }
  };
  
  // Handle editing a product
  const handleEditProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const token = await getIdToken();
      
      // Prepare form data
      const formData = new FormData();
      formData.append('productID', newProduct.productID);
      formData.append('pName', newProduct.pName);
      formData.append('pDescription', newProduct.pDescription);
      formData.append('pCategory', newProduct.pCategory);
      formData.append('pPrice', newProduct.pPrice);
      formData.append('pQuantity', newProduct.pQuantity);
      formData.append('status', newProduct.status);
      
      // Add image if available
      if (editImageFile) {
        formData.append('pImage', editImageFile);
      }
      
      const response = await fetch(`${API_BASE_URL}/products/${selectedProduct.productID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }
      
      // Reset form
      setNewProduct({
        productID: '',
        pName: '',
        pDescription: '',
        pCategory: '',
        pPrice: '',
        pQuantity: '',
        pImage: '',
        status: 'Active'
      });
      setEditImageFile(null);
      setShowEditModal(false);
      setSelectedProduct(null);
      
      // Refresh products list
      fetchProducts();
      
      showNotification('Product updated successfully!');
    } catch (err) {
      console.error('Error updating product:', err);
      showNotification(`Error: ${err.message}`, 'error');
    }
  };
  
  // Handle deleting a product
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = await getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
      
      // Refresh products list
      fetchProducts();
      
      showNotification('Product deleted successfully!');
    } catch (err) {
      console.error('Error deleting product:', err);
      showNotification(`Error: ${err.message}`, 'error');
    }
  };
  
  // Open edit modal with product data
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setNewProduct({
      productID: product.productID || '',
      pName: product.pName || '',
      pDescription: product.pDescription || '',
      pCategory: product.pCategory || '',
      pPrice: product.pPrice || '',
      pQuantity: product.pQuantity || '',
      pImage: product.pImage || '',
      status: product.status || 'Active'
    });
    setShowEditModal(true);
  };
  
  // Export inventory data to PDF
  const exportToPDF = async () => {
    try {
      // Import jsPDF and autoTable dynamically to avoid loading issues
      const jsPDF = (await import('jspdf')).jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Create new PDF document in landscape mode for better data display
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Load logo image from public folder
      let logoBase64 = null;
      try {
        logoBase64 = await getImageBase64("/images/lol.jpeg");
      } catch (imageError) {
        console.warn('Could not load logo image:', imageError);
        // Continue without image if loading fails
      }
      
      // Header function
      const addHeader = (doc, pageNumber = 1) => {
        // Header background
        doc.setFillColor(30, 64, 175); // Blue background
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Add logo if available
        if (logoBase64) {
          doc.addImage(logoBase64, 'JPEG', 15, 8, 25, 25); // x, y, width, height
        }
        
        // Company name and title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PETVERSE", 45, 18);

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Inventory Report", 45, 26);

        // Contact info
        doc.setFontSize(8);
        doc.text("New Kandy Road, Malabe • Tel: 0912345673", 45, 32);
        doc.text("www.petverse.com • hello@petverse.com", 45, 36);

        // Generated date (right aligned)
        const currentDate = new Date();
        const dateString = `Generated on: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;
        doc.setFontSize(8);
        const dateWidth = doc.getTextWidth(dateString);
        doc.text(dateString, pageWidth - dateWidth - 15, 32);

        // Page number (right aligned)
        const pageText = `Page ${pageNumber}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - pageTextWidth - 15, 36);
      };

      // Footer function
      const addFooter = (doc) => {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont("helvetica", "normal");
        const footerText = "©️ 2025 PETVERSE. All rights reserved.";
        const footerWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
      };

      // Add header and footer to first page
      addHeader(doc);
      addFooter(doc);
      
      // Add summary statistics with better visual presentation
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => isLowStock(p.pQuantity)).length;
      const outOfStockProducts = products.filter(p => p.pQuantity === 0).length;
      const activeProducts = products.filter(p => p.status === 'Active').length;
      
      // Add a line separator
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(20, 45, pageWidth - 20, 45);
      
      // Add summary boxes
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      
      // Background boxes for statistics
      doc.setFillColor(30, 64, 175);
      doc.roundedRect(20, 50, 65, 25, 2, 2, 'F');
      doc.text(`Total: ${totalProducts}`, 52.5, 65, null, null, 'center');
      
      doc.setFillColor(255, 193, 7);
      doc.roundedRect(87, 50, 65, 25, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text(`Low Stock: ${lowStockProducts}`, 119.5, 65, null, null, 'center');
      
      doc.setFillColor(220, 53, 69);
      doc.roundedRect(154, 50, 65, 25, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Out of Stock: ${outOfStockProducts}`, 186.5, 65, null, null, 'center');
      
      doc.setFillColor(40, 167, 69);
      doc.roundedRect(221, 50, 65, 25, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Active: ${activeProducts}`, 253.5, 65, null, null, 'center');
      
      // Prepare table data with better formatting
      const tableData = filteredProducts.map(product => [
        product.productID || 'N/A',
        product.pName || 'N/A',
        product.pCategory || 'N/A',
        `$${product.pPrice ? parseFloat(product.pPrice).toFixed(2) : '0.00'}`,
        product.pQuantity?.toString() || '0',
        product.status || 'N/A'
      ]);
      
      // Add table with enhanced styling
      autoTable(doc, {
        head: [['Product ID', 'Name', 'Category', 'Price', 'Quantity', 'Status']],
        body: tableData,
        startY: 82, // Adjusted to account for new header layout
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [30, 64, 175], // Blue color from PETVERSE theme
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        pageBreak: 'auto',
        margin: { top: 50, bottom: 30 }, // Adjusted margins
        didDrawPage: function(data) {
          // Add header and footer to each page
          if (data.pageNumber > 1) {
            addHeader(doc, data.pageNumber);
          }
          addFooter(doc);
        }
      });
      
      // Save the PDF with metadata
      const date = new Date().toLocaleDateString();
      const fileName = `petverse-inventory-${date.replace(/\//g, '-')}.pdf`;
      doc.setProperties({
        title: 'PETVERSE Inventory Report',
        subject: 'Inventory Report',
        author: 'PETVERSE Admin System',
        keywords: 'inventory, products, stock, pet, petverse'
      });
      
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showNotification('Failed to export PDF. Please try again.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Show a message if user is not authenticated or not an admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-orange-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-orange-500 text-lg font-medium">Access denied</p>
          <p className="text-gray-600 mt-2">You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-2" />
            )}
            <span>{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Manage your product inventory</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={fetchProducts}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Actions Section */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Box */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product ID, name, or category (letters and numbers only)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export PDF
              </button>
              <button
                onClick={() => {
                  setNewProduct({
                    productID: '',
                    pName: '',
                    pDescription: '',
                    pCategory: '',
                    pPrice: '',
                    pQuantity: '',
                    pImage: '',
                    status: 'Active'
                  });
                  setImageFile(null);
                  setFormErrors({});
                  setShowAddModal(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No products found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.pImage ? (
                              <img className="h-10 w-10 rounded-md object-cover" src={product.pImage} alt={product.pName} />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.pName}</div>
                            <div className="text-sm text-gray-500">{product.productID}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.pCategory}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${product.pPrice ? parseFloat(product.pPrice).toFixed(2) : '0.00'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isLowStock(product.pQuantity) ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                          {product.pQuantity}
                          {isLowStock(product.pQuantity) && product.pQuantity > 0 && (
                            <div className="flex items-center mt-1">
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-xs text-yellow-600">Low stock</span>
                            </div>
                          )}
                          {product.pQuantity === 0 && (
                            <div className="flex items-center mt-1">
                              <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-xs text-red-600">Out of stock</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Product"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.productID, product.pName)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Product"
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
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h3>
            
            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                {/* Product ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product ID *
                  </label>
                  <input
                    type="text"
                    name="productID"
                    value={newProduct.productID}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.productID ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="Enter product ID (3-6 characters, letters/numbers only)"
                    maxLength="6"
                  />
                  {formErrors.productID && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.productID}</p>
                  )}
                </div>
                
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="pName"
                    value={newProduct.pName}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.pName ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="Enter product name (max 50 characters)"
                    maxLength="50"
                  />
                  {formErrors.pName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pName}</p>
                  )}
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="pDescription"
                    value={newProduct.pDescription}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Enter product description"
                    rows="3"
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="pCategory"
                      value={newProduct.pCategory}
                      onChange={handleInputChange}
                      className={`flex-1 border ${formErrors.pCategory ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={openAddCategoryModal}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded-lg"
                      title="Add new category"
                    >
                      +
                    </button>
                  </div>
                  {formErrors.pCategory && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pCategory}</p>
                  )}
                </div>
                
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="text"
                    name="pPrice"
                    value={newProduct.pPrice}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.pPrice ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  {formErrors.pPrice && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pPrice}</p>
                  )}
                </div>
                
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="text"
                    name="pQuantity"
                    value={newProduct.pQuantity}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.pQuantity ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="0"
                    inputMode="numeric"
                  />
                  {formErrors.pQuantity && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pQuantity}</p>
                  )}
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newProduct.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className={`w-full border ${formErrors.pImage ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                  />
                  {formErrors.pImage && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pImage}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Product</h3>
            
            <form onSubmit={handleEditProduct}>
              <div className="space-y-4">
                {/* Product ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product ID *
                  </label>
                  <input
                    type="text"
                    name="productID"
                    value={newProduct.productID}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.productID ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="Enter product ID (3-6 characters, letters/numbers only)"
                    maxLength="6"
                  />
                  {formErrors.productID && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.productID}</p>
                  )}
                </div>
                
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="pName"
                    value={newProduct.pName}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.pName ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="Enter product name (max 50 characters)"
                    maxLength="50"
                  />
                  {formErrors.pName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pName}</p>
                  )}
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="pDescription"
                    value={newProduct.pDescription}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Enter product description"
                    rows="3"
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="pCategory"
                    value={newProduct.pCategory}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.pCategory ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {formErrors.pCategory && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pCategory}</p>
                  )}
                </div>
                
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="text"
                    name="pPrice"
                    value={newProduct.pPrice}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.pPrice ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  {formErrors.pPrice && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pPrice}</p>
                  )}
                </div>
                
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="text"
                    name="pQuantity"
                    value={newProduct.pQuantity}
                    onChange={handleInputChange}
                    className={`w-full border ${formErrors.pQuantity ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2`}
                    placeholder="0"
                    inputMode="numeric"
                  />
                  {formErrors.pQuantity && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pQuantity}</p>
                  )}
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newProduct.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImageFile(e.target.files[0])}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                  {selectedProduct.pImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Current Image:</p>
                      <img 
                        src={selectedProduct.pImage} 
                        alt="Current product" 
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg"
                >
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => {
                  // Allow only letters, digits, and spaces
                  if (/^[a-zA-Z0-9\s]*$/.test(e.target.value) || e.target.value === '') {
                    setNewCategory(e.target.value);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg p-2"
                placeholder="Enter category name (letters, digits, spaces only)"
              />
              <p className="mt-1 text-sm text-gray-500">Only letters, digits, and spaces are allowed</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={saveNewCategory}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg"
              >
                Add Category
              </button>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;