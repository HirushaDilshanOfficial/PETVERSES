import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfileInDatabase } from '../utils/authUtils';
import toast from 'react-hot-toast';
import { useNavigate } from "react-router";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ServiceProviderProfile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: ''
  });

  const [errors, setErrors] = useState({
    fullName: '',
    phoneNumber: '',
    address: ''
  });

  // Validation functions
  const validateFullName = (value) => {
    if (!value.trim()) return 'Full name is required';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Full name can only contain letters and spaces';
    if (value.trim().length < 2) return 'Full name must be at least 2 characters';
    if (value.trim().length > 50) return 'Full name cannot exceed 50 characters';
    return '';
  };

  const validatePhoneNumber = (value) => {
    if (!value.trim()) return 'Phone number is required';
    if (!/^\d+$/.test(value)) return 'Phone number can only contain digits';
    if (value.length !== 10) return 'Phone number must be exactly 10 digits';
    return '';
  };

  const validateAddress = (value) => {
    if (!value.trim()) return 'Address is required';
    if (!/^[a-zA-Z0-9\s,.-]+$/.test(value)) return 'Address can only contain letters, numbers, spaces, commas, periods, and hyphens';
    if (value.trim().length < 5) return 'Address must be at least 5 characters';
    if (value.trim().length > 200) return 'Address cannot exceed 200 characters';
    return '';
  };

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = value;
    let error = '';

    // Real-time input filtering and validation
    switch (name) {
      case 'fullName':
        // Allow only letters and spaces
        filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
        // Limit to 50 characters
        if (filteredValue.length > 50) {
          filteredValue = filteredValue.slice(0, 50);
        }
        error = validateFullName(filteredValue);
        break;

      case 'phoneNumber':
        // Allow only digits and limit to 10 characters
        filteredValue = value.replace(/[^0-9]/g, '');
        if (filteredValue.length > 10) {
          filteredValue = filteredValue.slice(0, 10);
        }
        error = validatePhoneNumber(filteredValue);
        break;

      case 'address':
        // Allow only letters, numbers, spaces, commas, periods, and hyphens
        filteredValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
        // Limit to 200 characters
        if (filteredValue.length > 200) {
          filteredValue = filteredValue.slice(0, 200);
        }
        error = validateAddress(filteredValue);
        break;

      default:
        break;
    }

    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {
      fullName: validateFullName(formData.fullName),
      phoneNumber: validatePhoneNumber(formData.phoneNumber),
      address: validateAddress(formData.address)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSave = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    try {
      setLoading(true);
      
      const profileData = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim()
      };

      console.log('Sending profile data:', profileData); // Debug log
      
      // Update profile via API
      const response = await updateUserProfileInDatabase(profileData);
      
      console.log('API Response:', response); // Debug log

      if (response && response.success) {
        // Update local user data
        setUser(prev => ({
          ...prev,
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          address: formData.address.trim()
        }));
        
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        console.error('API returned unsuccessful response:', response);
        throw new Error(response?.message || 'Failed to update profile - API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || ''
      });
    }
    // Clear errors
    setErrors({
      fullName: '',
      phoneNumber: '',
      address: ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  const hasErrors = Object.values(errors).some(error => error !== '');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
        <button
          onClick={() => navigate("/dashboard/service-provider")}
          className="btn btn-sm btn-outline btn-gray flex items-center gap-2"
        >
          ← Back
        </button>
      </div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Provider Profile</h1>
          <p className="mt-2 text-gray-600">Manage your profile information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#1E40AF] to-[#F97316] px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-white bg-white/10 overflow-hidden flex items-center justify-center text-white text-2xl font-bold">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-12 w-12" />
                    )}
                  </div>
                </div>
                
                {/* User Info */}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {user.fullName || 'Service Provider'}
                  </h2>
                  <p className="text-white/80 text-lg">Service Provider</p>
                  <p className="text-white/60 text-sm">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">
                  {user.fullName?.split(' ')[0]?.toLowerCase() || 'username'}
                </span>
              </div>
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name (letters and spaces only)"
                    maxLength={50}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {formData.fullName.length}/50 characters
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">
                    {user.fullName || 'Not provided'}
                  </span>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">
                  {user.email || 'Not provided'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed from this page
              </p>
            </div>

            {/* Phone Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {formData.phoneNumber.length}/10 digits
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">
                    {user.phoneNumber || 'Not provided'}
                  </span>
                </div>
              )}
            </div>

            {/* Address Field (for service providers) */}
            {user.role === 'serviceProvider' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <div>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your address (letters, numbers, spaces, commas, periods, and hyphens only)"
                      maxLength={200}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      {formData.address.length}/200 characters
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-900">
                      {user.address || 'Not provided'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading || hasErrors}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                    loading || hasErrors
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-[#1E40AF] text-white hover:bg-[#1E40AF]/90'
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Update Profile
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}

            {/* Validation Rules Info */}
            {isEditing && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Validation Rules:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Full Name: Only letters and spaces, 2-50 characters</li>
                  <li>• Phone Number: Exactly 10 digits only</li>
                  <li>• Address: Letters, numbers, spaces, commas, periods, hyphens only, 5-200 characters</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information Card */}
        <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                user.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {user.role === 'serviceProvider' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Status
                </label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  user.verification?.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : user.verification?.isRejected
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.verification?.isVerified 
                    ? 'Verified' 
                    : user.verification?.isRejected
                    ? 'Rejected'
                    : 'Pending Verification'
                  }
                </span>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <span className="text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <span className="text-gray-900">
                {new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderProfile;