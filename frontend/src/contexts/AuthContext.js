import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import apiClient from "../lib/axios"; // Import the apiClient instance
import toast from "react-hot-toast";
// Firebase imports
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import app from "../config/firebase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function to check if user is a pet owner
export const isPetOwner = (user) => {
  return user && user.role === "petOwner"; // Note: role is "petOwner" with capital O
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Initialize Firebase auth
  const auth = getAuth(app);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Sign in user with email and password
  const signin = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // Set token in axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;
      // Also set token in apiClient instance
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

      // Fetch user data from backend
      const res = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      console.log("AuthContext - signin response:", res.data);

      // Check if service provider is verified
      const user = res.data.user;
      if (user.role === "serviceProvider" && !user.verification?.isVerified) {
        // If service provider is not verified, throw an error
        throw new Error(
          "Your account is pending verification. Please wait for admin approval."
        );
      }

      // Log user role for debugging
      console.log("User role:", user.role);

      // Set user data
      setUser(user || null);
      console.log("AuthContext - setUser called with:", user || null);
      return res.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out user
  const signout = async () => {
    try {
      await firebaseSignOut(auth);
      delete axios.defaults.headers.common["Authorization"];
      delete apiClient.defaults.headers.common["Authorization"];
      setUser(null);
      // Clear any stored tokens or user data
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    } catch (err) {
      console.error("Error signing out:", err);
      throw err;
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to send reset email";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch logged-in user info from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if user is signed in with Firebase
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Get Firebase ID token
          const idToken = await currentUser.getIdToken();

          // Set token in axios default headers
          axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;
          // Also set token in apiClient instance
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${idToken}`;

          // Fetch user data from backend
          const res = await axios.get(`${API_BASE_URL}/auth/me`, {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          console.log("AuthContext - fetchUser response:", res.data);

          // Check if service provider is verified
          const user = res.data.user;
          if (
            user.role === "serviceProvider" &&
            !user.verification?.isVerified
          ) {
            // If service provider is not verified, sign them out
            console.log("Service provider not verified, signing out");
            await signout();
            setUser(null);
            return;
          }

          // Log user role for debugging
          console.log("User role:", user?.role);

          setUser(user || null);
          console.log("AuthContext - setUser called with:", user || null);
        } else {
          setUser(null);
          console.log("AuthContext - setUser called with: null");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
        console.log("AuthContext - setUser called with: null (error)");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        signin,
        signout,
        forgotPassword, // Add forgotPassword to the context value
        clearError,
        isPetOwner: (user) => isPetOwner(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
