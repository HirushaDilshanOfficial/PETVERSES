import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import app from '../../config/firebase';


// Custom SVG Icons
const User = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Mail = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const Phone = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MapPin = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Plus = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const Edit2 = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const Trash2 = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const Save = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3-7-7" />
  </svg>
);

const X = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Check = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertCircle = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Loader = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// Additional Icons for Sidebar
const Heart = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const Calendar = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FileText = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Settings = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Mobile Menu Toggle
const Menu = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Sidebar Component
const Sidebar = ({ currentSection, onSectionChange, user, onLogout }) => {
  const menuItems = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'pets', label: 'My Pets', icon: Heart },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'medical', label: 'Medical Records', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="bg-blue-900 text-white w-64 min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 p-2 rounded-lg">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">PetVerse</h2>
            <p className="text-blue-200 text-sm">Pet Owner Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.id === 'appointments') {
                      onSectionChange(item.id);
                      fetchAppointments();
                    } else {
                      onSectionChange(item.id);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-orange-500 text-white shadow-lg' 
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info and Logout at Bottom */}
      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-800 p-2 rounded-full">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Pet Owner'}</p>
            <p className="text-xs text-blue-200 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const PetOwnerProfile = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Current section state for sidebar navigation
  const [currentSection, setCurrentSection] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptForm, setApptForm] = useState({
    pet_name: '',
    pet_type: '',
    pet_breed: '',
    date: '',
    time: '',
    status: 'Pending',
    points_awarded: 0,
    note: ''
  });

  // Search state for appointments
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');

  // Handle appointment search input with validation (only letters and numbers)
  const handleAppointmentSearchChange = (e) => {
    const value = e.target.value;
    // Allow only letters and numbers (no special characters)
    if (/^[a-zA-Z0-9]*$/.test(value) || value === '') {
      setAppointmentSearchTerm(value);
    }
  };

  // Profile state
  const [profile, setProfile] = useState({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  loyaltyPoints: user?.loyaltyPoints ?? 0
});

  const [originalProfile, setOriginalProfile] = useState({...profile});
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  

  // Set profile data from user context when component mounts
  useEffect(() => {
  if (user) {
    const userProfile = {
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phoneNumber || '',
      address: user.address || '',
      loyaltyPoints: typeof user.loyaltyPoints === 'number' ? user.loyaltyPoints : 0
    };
      setProfile(userProfile);
      setOriginalProfile(userProfile);
    }
  }, [user]);

  // Filter appointments based on search term (by pet name or appointment ID)
  const filteredAppointments = useMemo(() => {
    if (!appointmentSearchTerm) {
      return appointments;
    }
    
    const searchTerm = appointmentSearchTerm.toLowerCase().trim();
    return appointments.filter(appt => {
      // Search by pet name
      const matchesPetName = appt.pet_name && appt.pet_name.toLowerCase().includes(searchTerm);
      
      // Search by appointment ID
      const appointmentId = appt.appointment_id || appt._id || '';
      const matchesAppointmentId = appointmentId.toLowerCase().includes(searchTerm);
      
      return matchesPetName || matchesAppointmentId;
    });
  }, [appointments, appointmentSearchTerm]);

  // Refresh profile from backend to get up-to-date loyaltyPoints (e.g., after appointment payments)
  useEffect(() => {
    const fetchProfileFromBackend = async () => {
      try {
        if (!user) return;
        const auth = getAuth(app);
        const token = await auth.currentUser?.getIdToken?.();
        const resProfile = await fetch('http://localhost:5003/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (resProfile.ok) {
          const json = await resProfile.json();
          const u = json?.user || {};
          setProfile(prev => ({
            ...prev,
            fullName: u.fullName || prev.fullName,
            email: u.email || prev.email,
            phone: u.phoneNumber || prev.phone,
            address: u.address || prev.address,
            loyaltyPoints: typeof u.loyaltyPoints === 'number' ? u.loyaltyPoints : (prev.loyaltyPoints ?? 0)
          }));
          setOriginalProfile(prev => ({
            ...prev,
            fullName: u.fullName || prev.fullName,
            email: u.email || prev.email,
            phone: u.phoneNumber || prev.phone,
            address: u.address || prev.address,
            loyaltyPoints: typeof u.loyaltyPoints === 'number' ? u.loyaltyPoints : (prev.loyaltyPoints ?? 0)
          }));
        }
      } catch (e) {
        // ignore refresh errors
      }
    };
    fetchProfileFromBackend();
  }, [user]);

  // Auto-open appointments tab if navigated with state
  useEffect(() => {
    if (location.state?.openAppointments) {
      setCurrentSection('appointments');
      fetchAppointments();
      // Clean the state to prevent reopening on back
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Pets state (start empty for new users)
  const [pets, setPets] = useState([]);

  const [newPet, setNewPet] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    weight: '',
    vaccinated: false,
    notes: ''
  });

  const [editingPet, setEditingPet] = useState(null);
  const [petErrors, setPetErrors] = useState({});
  const [isPetLoading, setIsPetLoading] = useState(false);

  const petTypes = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Reptile', 'Other'];
  const petBreedOptions = {
    Dog: ['Labrador', 'German Shepherd', 'Golden Retriever', 'Bulldog', 'Poodle', 'Other'],
    Cat: ['Persian', 'Siamese', 'Maine Coon', 'Bengal', 'Sphynx', 'Other'],
    Bird: ['Parrot', 'Canary', 'Finch', 'Cockatiel', 'Lovebird', 'Other'],
    Fish: ['Goldfish', 'Betta', 'Guppy', 'Tetra', 'Cichlid', 'Other'],
    Rabbit: ['Holland Lop', 'Netherland Dwarf', 'Lionhead', 'Flemish Giant', 'Other'],
    Hamster: ['Syrian', 'Dwarf Campbell', 'Winter White', 'Roborovski', 'Chinese', 'Other'],
    'Guinea Pig': ['American', 'Abyssinian', 'Peruvian', 'Teddy', 'Texel', 'Other'],
    Reptile: ['Iguana', 'Bearded Dragon', 'Leopard Gecko', 'Corn Snake', 'Tortoise', 'Other'],
    Other: ['Other']
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Only allow numbers, max 10 digits
    const cleanPhone = phone.replace(/\D/g, '');
    return /^\d*$/.test(cleanPhone) && cleanPhone.length <= 10;
  };

  // Add new validation function for full name
  const validateFullName = (name) => {
    // Only allow letters and spaces
    return /^[a-zA-Z\s]*$/.test(name);
  };

  // Profile handlers
  const handleProfileChange = (field, value) => {
    // Add validation for specific fields
    if (field === 'fullName' && !validateFullName(value)) return;
    if (field === 'phone') {
      // Only allow numbers and limit to 10 digits
      const cleanPhone = value.replace(/\D/g, '');
      if (cleanPhone.length > 10) return;
      value = cleanPhone;
    }
    
    setProfile(prev => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProfileSave = async () => {
    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setIsProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOriginalProfile({...profile});
      setIsProfileEditing(false);
      setProfileErrors({});
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setProfile({...originalProfile});
    setIsProfileEditing(false);
    setProfileErrors({});
    setProfileMessage({ type: '', text: '' });
  };

  // Pet handlers
  const handleNewPetChange = (field, value) => {
    setNewPet(prev => ({ ...prev, [field]: value }));
    if (petErrors[field]) {
      setPetErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddPet = async () => {
    const errors = validatePet(newPet);
    if (Object.keys(errors).length > 0) {
      setPetErrors(errors);
      return;
    }

    setIsPetLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const petToAdd = {
        ...newPet,
        id: Date.now()
      };
      
      setPets(prev => [...prev, petToAdd]);
      setNewPet({
        name: '',
        type: '',
        breed: '',
        age: '',
        weight: '',
        vaccinated: false,
        notes: ''
      });
      setPetErrors({});
    } catch (error) {
      console.error('Failed to add pet');
    } finally {
      setIsPetLoading(false);
    }
  };

  const handleEditPet = (pet) => {
    setEditingPet({...pet});
  };

  const handleUpdatePet = async () => {
    const errors = validatePet(editingPet);
    if (Object.keys(errors).length > 0) {
      setPetErrors(errors);
      return;
    }

    setIsPetLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPets(prev => prev.map(pet => 
        pet.id === editingPet.id ? editingPet : pet
      ));
      setEditingPet(null);
      setPetErrors({});
    } catch (error) {
      console.error('Failed to update pet');
    } finally {
      setIsPetLoading(false);
    }
  };

  const handleRemovePet = async (petId) => {
    if (window.confirm('Are you sure you want to remove this pet?')) {
      setIsPetLoading(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setPets(prev => prev.filter(pet => pet.id !== petId));
      } catch (error) {
        console.error('Failed to remove pet');
      } finally {
        setIsPetLoading(false);
      }
    }
  };

  const InputField = ({ 
    label, 
    type = 'text', 
    value, 
    onChange, 
    error, 
    icon: Icon, 
    placeholder = '', 
    required = false,
    disabled = false
  }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
        />
      </div>
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  const SelectField = ({ 
    label, 
    value, 
    onChange, 
    options, 
    error, 
    placeholder = 'Select an option', 
    required = false,
    disabled = false
  }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  const Button = ({ 
    variant = 'primary', 
    size = 'md', 
    onClick, 
    disabled = false, 
    loading = false, 
    children, 
    icon: Icon,
    className = ''
  }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-3 text-sm min-h-[48px]',
      lg: 'px-6 py-4 text-base min-h-[52px]'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${
          disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin mr-2" />
        ) : Icon ? (
          <Icon className="w-4 h-4 mr-2" />
        ) : null}
        {children}
      </button>
    );
  };

  const validateProfile = () => {
    const errors = {};
    
    if (!profile.fullName.trim()) errors.fullName = 'Full name is required';
    else if (!validateFullName(profile.fullName)) errors.fullName = 'Full name can only contain letters';
    
    if (!profile.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(profile.email)) errors.email = 'Please enter a valid email address';
    
    if (!profile.phone.trim()) errors.phone = 'Phone number is required';
    else if (!validatePhone(profile.phone)) errors.phone = 'Phone number can only contain numbers and maximum 10 digits';
    
    if (!profile.address.trim()) errors.address = 'Address is required';

    return errors;
  };

  const validatePet = (pet) => {
    const errors = {};
    
    if (!pet.name.trim()) errors.name = 'Pet name is required';
    if (!pet.type) errors.type = 'Pet type is required';
    if (!pet.breed.trim()) errors.breed = 'Breed is required';
    if (!pet.age.trim()) errors.age = 'Age is required';
    else if (isNaN(pet.age)) errors.age = 'Age must be a number';

    return errors;
  };

  // Add logout handler
  const handleLogout = async () => {
    try {
      await signout();
      navigate('/'); // Redirect to home page
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const fetchAppointments = async () => {
    try {
      setAppointmentsError('');
      setIsAppointmentsLoading(true);
      const ownerId = user?.firebaseUid || user?._id;
      if (!ownerId) {
        throw new Error('User not loaded');
      }

      let loadedAppointments = [];
      // Fix the URL to use the correct API endpoint
      let res = await fetch(`http://localhost:5003/api/appointments/owner/${ownerId}`);
      if (!res.ok) {
        // Fallback to all and filter client-side if route unavailable
        if (res.status === 404) {
          // Fix the URL to use the correct API endpoint
          const allRes = await fetch('http://localhost:5003/api/appointments');
          if (!allRes.ok) throw new Error(`Failed to load appointments (${allRes.status})`);
          const all = await allRes.json();
          const filtered = Array.isArray(all) ? all.filter(a => (a.user_id === ownerId)) : [];
          loadedAppointments = filtered;
          setAppointments(filtered);
        } else {
          throw new Error(`Failed to load appointments (${res.status})`);
        }
      } else {
        const data = await res.json();
        loadedAppointments = Array.isArray(data) ? data : [];
        setAppointments(loadedAppointments);
      }

      // After fetching appointments, refresh user profile to get up-to-date loyaltyPoints (e.g., after payments or redemptions)
      let updatedFromServer = false;
      try {
        const auth = getAuth(app);
        const token = await auth.currentUser?.getIdToken?.();
        const resProfile = await fetch('http://localhost:5003/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (resProfile.ok) {
          const json = await resProfile.json();
          const u = json?.user || {};
          if (typeof u.loyaltyPoints === 'number') {
            updatedFromServer = true;
            setProfile(prev => ({
              ...prev,
              loyaltyPoints: u.loyaltyPoints
            }));
          }
        }
      } catch (e) {
        // best-effort; ignore
      }

      // Fallback: only derive points from appointments if server did not return a value
      if (!updatedFromServer) {
        try {
          const derivedPoints = loadedAppointments.reduce((sum, a) => sum + (Number(a.points_awarded) || 0), 0);
          setProfile(prev => ({
            ...prev,
            // Use derived points only when we don't already have a numeric value
            loyaltyPoints: typeof prev.loyaltyPoints === 'number' ? prev.loyaltyPoints : derivedPoints
          }));
        } catch {}
      }
    } catch (error) {
      console.error('Appointments fetch error:', error);
      setAppointmentsError(error.message || 'Failed to load appointments');
    } finally {
      setIsAppointmentsLoading(false);
    }
  };

  const openApptModal = (appt) => {
    setSelectedAppointment(appt);
    setApptForm({
      pet_name: appt.pet_name || '',
      pet_type: appt.pet_type || '',
      pet_breed: appt.pet_breed || '',
      date: appt.date ? new Date(appt.date).toISOString().slice(0,10) : '',
      time: appt.time || '',
      status: appt.status || 'Pending',
      points_awarded: appt.points_awarded ?? 0,
      note: appt.note || ''
    });
    setIsApptModalOpen(true);
  };

  const closeApptModal = () => {
    setIsApptModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleApptChange = (field, value) => {
    // Special validation for pet_name field to only allow letters and spaces
    if (field === "pet_name") {
      // Allow only letters and spaces
      if (/^[a-zA-Z\s]*$/.test(value)) {
        setApptForm(prev => ({ ...prev, [field]: value }));
      }
      // If the value contains invalid characters, we don't update the state
      // This prevents typing special characters
    } else {
      setApptForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const saveAppt = async () => {
    if (!selectedAppointment?._id) return;
    try {
      // Fix the URL to use the correct API endpoint
      const res = await fetch(`http://localhost:5003/api/appointments/${selectedAppointment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_name: apptForm.pet_name,
          pet_type: apptForm.pet_type,
          pet_breed: apptForm.pet_breed,
          date: apptForm.date ? new Date(apptForm.date) : undefined,
          time: apptForm.time,
          note: apptForm.note
        })
      });
      if (!res.ok) throw new Error('Failed to update appointment');
      const updated = await res.json();
      setAppointments(prev => prev.map(a => (a._id === updated._id ? updated : a)));
      closeApptModal();
    } catch (e) {
      alert('Failed to update appointment');
    }
  };

  const deleteAppt = async () => {
    if (!selectedAppointment?._id) return;
    try {
      // Fix the URL to use the correct API endpoint
      const res = await fetch(`http://localhost:5003/api/appointments/${selectedAppointment._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete appointment');
      setAppointments(prev => prev.filter(a => a._id !== selectedAppointment._id));
      closeApptModal();
    } catch (e) {
      alert('Failed to delete appointment');
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar 
          currentSection={currentSection} 
          onSectionChange={setCurrentSection}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed left-0 top-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          currentSection={currentSection} 
          onSectionChange={(section) => {
            setCurrentSection(section);
            setIsMobileMenuOpen(false);
          }}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Page Title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-xl font-semibold text-gray-800 ml-4 lg:ml-0">
                {currentSection === 'profile' && 'Profile Management'}
                {currentSection === 'pets' && 'Pet Management'}
                {currentSection === 'appointments' && 'Appointments'}
                {currentSection === 'medical' && 'Medical Records'}
                {currentSection === 'settings' && 'Settings'}
              </h1>
            </div>

            {/* Search Bar - Hidden on mobile for space */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <svg className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search pets, appointments..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* User Profile Dropdown */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* User Avatar with real data */}
              <div className="flex items-center space-x-2">
                <div className="bg-orange-500 text-white p-2 rounded-full">
                  <User className="h-5 w-5" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Pet Owner'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {currentSection === 'profile' && (
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Profile Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                    <div className="flex space-x-2">
                      {!isProfileEditing && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsProfileEditing(true)}
                          icon={Edit2}
                        >
                          Edit Profile
                        </Button>
                      )}
                      {/* Add Logout Button */}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>

                  {profileMessage.text && (
                    <div className={`flex items-center space-x-2 p-4 rounded-lg mb-6 transition-all duration-300 ${
                      profileMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {profileMessage.type === 'success' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <span>{profileMessage.text}</span>
                    </div>
                  )}
                  {/* ✅ Loyalty Points Section */}
<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex items-center">
  <Heart className="h-6 w-6 text-orange-500 mr-3" />
  <div>
    <p className="text-sm text-gray-600">Loyalty Points</p>
    <p className="text-lg font-bold text-gray-900">{profile.loyaltyPoints} Points</p>
  </div>
</div>

                  <div className="space-y-4">
                    <InputField
                      label="Full Name"
                      value={profile.fullName}
                      onChange={(value) => handleProfileChange('fullName', value)}
                      error={profileErrors.fullName}
                      icon={User}
                      disabled={!isProfileEditing}
                      required
                    />

                    <InputField
                      label="Email Address"
                      type="email"
                      value={profile.email}
                      onChange={(value) => handleProfileChange('email', value)}
                      error={profileErrors.email}
                      icon={Mail}
                      disabled={!isProfileEditing}
                      required
                    />

                    <InputField
                      label="Phone Number"
                      type="tel"
                      value={profile.phone}
                      onChange={(value) => handleProfileChange('phone', value)}
                      error={profileErrors.phone}
                      icon={Phone}
                      placeholder="Enter up to 10 digits"
                      disabled={!isProfileEditing}
                      required
                    />

                    <InputField
                      label="Address"
                      value={profile.address}
                      onChange={(value) => handleProfileChange('address', value)}
                      error={profileErrors.address}
                      icon={MapPin}
                      disabled={!isProfileEditing}
                      required
                    />

                    
                  </div>

                  {isProfileEditing && (
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                      <Button
                        onClick={handleProfileSave}
                        loading={isProfileLoading}
                        icon={Save}
                        className="flex-1"
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleProfileCancel}
                        icon={X}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* Empty section to maintain grid layout */}
                <div></div>
              </div>
            </div>
          )}

          {/* Other sections placeholders */}
          {currentSection === 'pets' && (
            <div className="max-w-6xl mx-auto px-4 py-8">
              {/* Pet List Section Header with Add Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Pets</h2>
                <Button
                  onClick={() => setIsAddPetModalOpen(true)}
                  icon={Plus}
                >
                  Add New Pet
                </Button>
              </div>

              {/* Pet List Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                {pets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pets added yet. Click "Add New Pet" to add your first pet!</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pets.map((pet) => (
                      <div key={pet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg text-gray-800">{pet.name}</h3>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditPet(pet)}
                              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemovePet(pet.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-medium">{pet.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Breed:</span>
                            <span className="font-medium">{pet.breed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Age:</span>
                            <span className="font-medium">{pet.age} years</span>
                          </div>
                          {pet.weight && (
                            <div className="flex justify-between">
                              <span>Weight:</span>
                              <span className="font-medium">{pet.weight}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Vaccinated:</span>
                            <span className={`font-medium ${pet.vaccinated ? 'text-green-600' : 'text-red-600'}`}>
                              {pet.vaccinated ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {pet.notes && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs italic text-gray-500">{pet.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentSection === 'appointments' && (
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Appointments</h3>
                  </div>
                  <button
                    onClick={() => fetchAppointments()}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                {/* Search Bar for Appointments */}
                <div className="mb-4">
                  <div className="relative">
                    <svg className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by pet name or appointment ID..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={appointmentSearchTerm}
                      onChange={handleAppointmentSearchChange}
                    />
                  </div>
                </div>

                {isAppointmentsLoading && (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <Loader className="w-5 h-5 animate-spin mr-2" /> Loading appointments...
                  </div>
                )}

                {!isAppointmentsLoading && appointmentsError && (
                  <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
                    {appointmentsError}
                  </div>
                )}

                {!isAppointmentsLoading && !appointmentsError && (
                  filteredAppointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No appointments found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAppointments.map((appt) => (
                            <tr key={appt._id || appt.appointment_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[200px]">{appt.appointment_id || appt._id}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div className="font-medium text-gray-900">{appt.pet_name}</div>
                                <div className="text-xs text-gray-500">{appt.pet_type} • {appt.pet_breed}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{appt.date ? new Date(appt.date).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{appt.time}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  appt.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                  appt.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                  appt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                  appt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {appt.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {(() => {
                                  const pointsMap = { Basic: 5, Premium: 10, Luxury: 15 };
                                  const potential = pointsMap[appt.package] || 0;
                                  const awarded = Number(appt.points_awarded) || 0;
                                  const isPaid = appt.paymentStatus === 'paid';

                                  if (isPaid) {
                                    // After payment, show awarded (fallback to potential if missing)
                                    return awarded || potential || 0;
                                  }

                                  if (appt.status === 'Approved') {
                                    // On approval but before payment, show potential points as pending
                                    return (
                                      <span className="text-gray-500">{potential} (pending)</span>
                                    );
                                  }

                                  // For other statuses, show a dash to avoid misleading 0
                                  return <span className="text-gray-400">-</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {appt.paymentStatus === 'paid' ? (
                                  <span className="px-3 py-1 rounded bg-green-100 text-green-700">Payment successful</span>
                                ) : (
                                  appt.status === 'Approved' && (
                                    <button
                                      onClick={() => {
                                        // Navigate to appointment payment page
                                        console.log("Appointment data:", appt); // Debug log
                                        navigate(`/payment/appointment/${appt._id}`, {
                                          state: {
                                            appointmentId: appt._id,
                                            amount: appt.packagePrice || 1500, // Use packagePrice instead of price
                                            service: appt.service_name || 'Pet Service',
                                            userEmail: user?.email || '',
                                            packagePrice: appt.packagePrice || 0 // Pass package price
                                          }
                                        });
                                      }}
                                      className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                                    >
                                      Pay Now
                                    </button>
                                  )
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                <button
                                  onClick={() => openApptModal(appt)}
                                  className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {currentSection === 'medical' && (
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Medical Records</h3>
                <p className="text-gray-600">View and manage pet medical history...</p>
              </div>
            </div>
          )}

          {currentSection === 'settings' && (
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Settings</h3>
                <p className="text-gray-600">Manage account settings and preferences...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Pet Modal */}
      {isAddPetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Add New Pet</h3>
                <button
                  onClick={() => setIsAddPetModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <InputField
                  label="Pet Name"
                  value={newPet.name}
                  onChange={(value) => handleNewPetChange('name', value)}
                  error={petErrors.name}
                  placeholder="Enter pet name"
                  required
                />

                <SelectField
                  label="Pet Type"
                  value={newPet.type}
                  onChange={(value) => handleNewPetChange('type', value)}
                  options={petTypes}
                  error={petErrors.type}
                  placeholder="Select pet type"
                  required
                />

                <InputField
                  label="Breed"
                  value={newPet.breed}
                  onChange={(value) => handleNewPetChange('breed', value)}
                  error={petErrors.breed}
                  placeholder="Enter breed"
                  required
                />

                <InputField
                  label="Age (years)"
                  type="number"
                  value={newPet.age}
                  onChange={(value) => handleNewPetChange('age', value)}
                  error={petErrors.age}
                  placeholder="Age in years"
                  required
                />

                <InputField
                  label="Weight (optional)"
                  value={newPet.weight}
                  onChange={(value) => handleNewPetChange('weight', value)}
                  placeholder="e.g., 25 lbs, 5 kg"
                />

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vaccinated"
                    checked={newPet.vaccinated}
                    onChange={(e) => handleNewPetChange('vaccinated', e.target.checked)}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="vaccinated" className="text-sm text-gray-700">
                    Vaccinations up to date
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={newPet.notes}
                    onChange={(e) => handleNewPetChange('notes', e.target.value)}
                    placeholder="Any additional information about your pet..."
                    rows="3"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleAddPet}
                  loading={isPetLoading}
                  icon={Plus}
                  className="flex-1"
                >
                  Add Pet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsAddPetModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    {/* Appointment View/Update Modal */}
    {isApptModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected' ? 'View Appointment' : 'Edit Appointment'}
            </h3>
            <button onClick={closeApptModal} className="p-2 rounded hover:bg-gray-100">✕</button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name</label>
              <input 
                value={apptForm.pet_name} 
                onChange={(e)=>handleApptChange('pet_name', e.target.value)} 
                className="w-full border rounded px-3 py-2"
                readOnly={selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Type</label>
              <select 
                value={apptForm.pet_type} 
                onChange={(e)=>handleApptChange('pet_type', e.target.value)} 
                className="w-full border rounded px-3 py-2"
                disabled={selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected'}
              >
                <option value="">Select type</option>
                {petTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <select 
                value={apptForm.pet_breed} 
                onChange={(e)=>handleApptChange('pet_breed', e.target.value)} 
                className="w-full border rounded px-3 py-2"
                disabled={selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected'}
              >
                <option value="">Select breed</option>
                {(petBreedOptions[apptForm.pet_type] || petBreedOptions.Other).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                value={apptForm.date} 
                onChange={(e)=>handleApptChange('date', e.target.value)} 
                className="w-full border rounded px-3 py-2"
                readOnly={selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input 
                type="time" 
                value={apptForm.time} 
                onChange={(e)=>handleApptChange('time', e.target.value)} 
                className="w-full border rounded px-3 py-2"
                readOnly={selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <input 
                value={apptForm.status} 
                readOnly 
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600" 
              />
            </div>
            {/* Points Awarded - readonly */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points Awarded</label>
              <input 
                type="number" 
                value={apptForm.points_awarded} 
                readOnly 
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea 
                rows={3} 
                value={apptForm.note} 
                onChange={(e)=>handleApptChange('note', e.target.value)} 
                className="w-full border rounded px-3 py-2"
                readOnly={selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected'}
              />
            </div>
          </div>
          <div className="p-4 border-t flex items-center justify-between">
            {selectedAppointment?.paymentStatus === 'paid' || selectedAppointment?.status === 'Rejected' ? (
              <div></div>
            ) : (
              <button 
                onClick={deleteAppt} 
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <div className="space-x-2">
              <button 
                onClick={closeApptModal} 
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Close
              </button>
              {selectedAppointment?.paymentStatus !== 'paid' && selectedAppointment?.status !== 'Rejected' && (
                <button 
                  onClick={saveAppt} 
                  className="px-4 py-2 rounded bg-[#1E40AF] text-white hover:bg-[#153A8D]"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Edit Pet Modal */}
      {editingPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Pet Information</h3>
                <button
                  onClick={() => setEditingPet(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <InputField
                  label="Pet Name"
                  value={editingPet.name}
                  onChange={(value) => setEditingPet({...editingPet, name: value})}
                  error={petErrors.name}
                  required
                />

                <SelectField
                  label="Pet Type"
                  value={editingPet.type}
                  onChange={(value) => setEditingPet({...editingPet, type: value})}
                  options={petTypes}
                  error={petErrors.type}
                  required
                />

                <InputField
                  label="Breed"
                  value={editingPet.breed}
                  onChange={(value) => setEditingPet({...editingPet, breed: value})}
                  error={petErrors.breed}
                  required
                />

                <InputField
                  label="Age (years)"
                  type="number"
                  value={editingPet.age}
                  onChange={(value) => setEditingPet({...editingPet, age: value})}
                  error={petErrors.age}
                  required
                />

                <InputField
                  label="Weight (optional)"
                  value={editingPet.weight}
                  onChange={(value) => setEditingPet({...editingPet, weight: value})}
                />

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="edit-vaccinated"
                    checked={editingPet.vaccinated}
                    onChange={(e) => setEditingPet({...editingPet, vaccinated: e.target.checked})}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="edit-vaccinated" className="text-sm text-gray-700">
                    Vaccinations up to date
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={editingPet.notes}
                    onChange={(e) => setEditingPet({...editingPet, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleUpdatePet}
                  loading={isPetLoading}
                  icon={Save}
                  className="flex-1"
                >
                  Update Pet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setEditingPet(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetOwnerProfile;