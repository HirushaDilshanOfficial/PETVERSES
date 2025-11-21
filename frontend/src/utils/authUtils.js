// Authentication utility functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { auth } from "../config/firebase.js";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

// Create user account with Firebase Auth
export const createUserAccount = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
};

// Sign in user with email and password
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in user:", error);
    throw error;
  }
};

// Sign out current user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out user:", error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

// Update user profile (display name, photo URL)
export const updateUserProfile = async (user, profileData) => {
  try {
    await updateProfile(user, profileData);
    console.log("User profile updated successfully");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Get Firebase ID token for API requests
export const getIdToken = async () => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error getting ID token:", error);
    throw error;
  }
};

// Make authenticated API request
export const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const token = await getIdToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Authenticated request error:", error);
    throw error;
  }
};

// Register user in backend database
export const registerUserInDatabase = async (userData) => {
  try {
    const response = await makeAuthenticatedRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    return response;
  } catch (error) {
    console.error("Error registering user in database:", error);
    throw error;
  }
};

// Get user profile from backend
export const getUserProfileFromDatabase = async () => {
  try {
    const response = await makeAuthenticatedRequest("/auth/profile");
    return response;
  } catch (error) {
    console.error("Error getting user profile from database:", error);
    throw error;
  }
};

// Update user profile in backend
export const updateUserProfileInDatabase = async (profileData) => {
  try {
    const response = await makeAuthenticatedRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });

    return response;
  } catch (error) {
    console.error("Error updating user profile in database:", error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append("profilePicture", file);

    const token = await getIdToken();
    const response = await fetch(`${API_BASE_URL}/auth/profile/picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Profile picture upload failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

// Upload service provider documents
export const uploadServiceProviderDocuments = async (userId, files) => {
  try {
    const formData = new FormData();

    // Append files to FormData
    if (files.nicFront) formData.append("nicFront", files.nicFront);
    if (files.nicBack) formData.append("nicBack", files.nicBack);
    if (files.facePhoto) formData.append("facePhoto", files.facePhoto);
    if (files.businessDocuments) {
      Array.from(files.businessDocuments).forEach((file) => {
        formData.append("businessDocuments", file);
      });
    }

    const token = await getIdToken();
    const response = await fetch(
      `${API_BASE_URL}/auth/service-provider/${userId}/documents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Document upload failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading service provider documents:", error);
    throw error;
  }
};

// Parse Firebase Auth errors
export const parseFirebaseError = (error) => {
  switch (error.code) {
    case "auth/user-not-found":
      return "No user found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/requires-recent-login":
      return "Please log in again to complete this action.";
    default:
      return error.message || "An error occurred. Please try again.";
  }
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate phone number (basic validation)
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

// Validate NIC number (Sri Lankan format - basic validation)
export const isValidNIC = (nic) => {
  // Old format: 9 digits followed by V or X
  // New format: 12 digits
  const oldNICRegex = /^[0-9]{9}[vVxX]$/;
  const newNICRegex = /^[0-9]{12}$/;

  return oldNICRegex.test(nic) || newNICRegex.test(nic);
};
