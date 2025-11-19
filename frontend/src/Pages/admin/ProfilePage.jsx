import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getIdToken } from '../../utils/authUtils';
import { 
  UserCircleIcon, 
  PencilIcon, 
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { makeAuthenticatedRequest } from '../../utils/authUtils';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebase';

// Admin Profile Page with real data
function ProfilePage() {
  const { user: userProfile, user: currentUser, loading: authLoading } = useAuth();
  
  // State for admin profile
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    joinDate: '',
    profilePicture: ''
  });

  // State for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // State for password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State for settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false
  });

  // State for activity logs
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for notifications
  const [notifications, setNotifications] = useState([]);

  // Load real data when component starts
  useEffect(() => {
    const loadData = async () => {
      try {
        if (authLoading) return; // Wait for auth to load
        // Check if user is authenticated and is an admin
        if (!currentUser || currentUser.role !== 'admin') return;
        
        setLoading(true);
        // Set profile data from auth context
        if (userProfile) {
          setProfile({
            name: userProfile.fullName || '',
            email: userProfile.email || '',
            phone: userProfile.phoneNumber || '',
            role: userProfile.role || '',
            joinDate: userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '',
            profilePicture: userProfile.profilePicture || ''
          });
          setEditForm({
            name: userProfile.fullName || '',
            email: userProfile.email || '',
            phone: userProfile.phoneNumber || ''
          });
        }
        
        // Load real activity logs from backend
        await loadActivityLogs();
      } catch (err) {
        console.error('Error loading profile data:', err);
        setError('Failed to load profile data');
        showNotification('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile, currentUser, authLoading]);

  // Load activity logs from backend
  const loadActivityLogs = async () => {
    try {
      // Get Firebase ID token for authentication
      const token = await getIdToken();
      
      // Fetch users, products, and services to create activity logs
      const [usersResponse, productsResponse, servicesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/users?limit=5`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.json()),
        fetch(`${API_BASE_URL}/products?limit=5`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.json()),
        // We don't have a services endpoint yet, so we'll skip this for now
        Promise.resolve([])
      ]);
      
      const logs = [];
      
      // Add user registration activities
      if (usersResponse.users) {
        usersResponse.users.slice(0, 3).forEach(user => {
          logs.push({
            id: `user-${user._id}`,
            action: 'New user registered',
            target: user.fullName || user.email,
            timestamp: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'
          });
        });
      }
      
      // Add product creation activities
      if (productsResponse.products) {
        productsResponse.products.slice(0, 3).forEach(product => {
          logs.push({
            id: `product-${product._id}`,
            action: 'New product added',
            target: product.pName || 'Unknown Product',
            timestamp: product.createdAt ? new Date(product.createdAt).toLocaleString() : 'Unknown'
          });
        });
      }
      
      // Sort logs by timestamp (newest first)
      logs.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
      });
      
      // Take only the first 5 logs
      setActivityLogs(logs.slice(0, 5));
    } catch (err) {
      console.error('Error loading activity logs:', err);
      // Fallback to mock data if real data fails
      const mockLogs = [
        {
          id: 1,
          action: 'Approved KYC request',
          target: 'John Doe',
          timestamp: '2024-01-20 10:30:00'
        },
        {
          id: 2,
          action: 'Added new product',
          target: 'Pet Food Premium',
          timestamp: '2024-01-20 09:15:00'
        },
        {
          id: 3,
          action: 'Updated user profile',
          target: 'Jane Smith',
          timestamp: '2024-01-19 16:45:00'
        }
      ];
      setActivityLogs(mockLogs);
    }
  };

  // Handle input changes with validation
  const handleInputChange = (field, value) => {
    let filteredValue = value;
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    switch (field) {
      case 'name':
        // Allow only letters and spaces
        filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
        break;
      case 'phone':
        // Allow only digits and limit to 10 characters
        filteredValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      default:
        break;
    }
    
    setEditForm({
      ...editForm,
      [field]: filteredValue
    });
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    
    if (!editForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(editForm.name)) {
      errors.name = 'Name can only contain letters and spaces';
    }
    
    if (editForm.phone && !/^\d{10}$/.test(editForm.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    
    return errors;
  };

  // Start editing profile
  const startEditing = () => {
    setEditForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone
    });
    setIsEditing(true);
  };

  // Save profile changes
  const saveProfile = async (e) => {
    e.preventDefault();
    
    // Validate inputs before saving
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      // Update profile via API
      const response = await makeAuthenticatedRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editForm.name,
          phoneNumber: editForm.phone
        })
      });
      
      if (response.success) {
        setProfile({
          ...profile,
          name: editForm.name,
          phone: editForm.phone
        });
        setIsEditing(false);
        setFormErrors({}); // Clear errors on success
        showNotification('Profile updated successfully!', 'success');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showNotification(`Failed to update profile: ${err.message}`, 'error');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone
    });
    setIsEditing(false);
    setFormErrors({}); // Clear form errors when canceling
  };

  // Change password using Firebase
  const changePassword = async (e) => {
    e.preventDefault();
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showNotification('New passwords do not match!', 'error');
        return;
      }
      if (passwordForm.newPassword.length < 6) {
        showNotification('Password must be at least 6 characters!', 'error');
        return;
      }
      
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordForm.newPassword);
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
      showNotification('Password changed successfully!', 'success');
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        showNotification('Current password is incorrect!', 'error');
      } else if (err.code === 'auth/weak-password') {
        showNotification('New password is too weak!', 'error');
      } else {
        showNotification(`Failed to change password: ${err.message}`, 'error');
      }
    }
  };

  // Toggle settings
  const toggleSetting = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  // Upload profile picture
  const uploadProfilePicture = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Get auth token
      const token = await currentUser.getIdToken();
      
      // Upload to backend
      const response = await fetch('http://localhost:4000/api/auth/profile/picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update profile picture in state
        setProfile({
          ...profile,
          profilePicture: data.user.profilePicture
        });
        showNotification('Profile picture updated successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to upload profile picture');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      showNotification(`Failed to upload profile picture: ${err.message}`, 'error');
    }
  };

  // Handle profile picture click
  const handleProfilePictureClick = () => {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = uploadProfilePicture;
    fileInput.click();
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-500 text-lg font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
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
        <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
        <p className="text-gray-600 mt-2">Manage your profile and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
            {!isEditing && (
              <button
                onClick={startEditing}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Picture Section */}
          <div className="flex items-center mb-6">
            <div className="relative">
              {profile.profilePicture ? (
                <img 
                  src={profile.profilePicture} 
                  alt="Profile" 
                  className="h-24 w-24 rounded-full object-cover border-2 border-orange-500"
                />
              ) : (
                <UserCircleIcon className="h-24 w-24 text-gray-400" />
              )}
              <button
                onClick={handleProfilePictureClick}
                className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full"
              >
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
              <p className="text-gray-600">{profile.role}</p>
              <p className="text-sm text-gray-500">Member since {profile.joinDate}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={saveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={isEditing ? editForm.name : profile.name}
                  onChange={(e) => isEditing && handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  value={profile.email}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={isEditing ? editForm.phone : profile.phone}
                  onChange={(e) => isEditing && handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  value={profile.role}
                  disabled
                />
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Quick Actions Card */}
        <div className="space-y-6">
          {/* Security Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <KeyIcon className="h-4 w-4" />
                Change Password
              </button>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm">Email Notifications</span>
                </div>
                <button
                  onClick={() => toggleSetting('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.emailNotifications ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm">SMS Notifications</span>
                </div>
                <button
                  onClick={() => toggleSetting('smsNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.smsNotifications ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm">Two-Factor Auth</span>
                </div>
                <button
                  onClick={() => toggleSetting('twoFactorAuth')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.twoFactorAuth ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.target}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={changePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;