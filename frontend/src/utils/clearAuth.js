// Utility function to clear all authentication-related data
export const clearAuthData = () => {
  try {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any Firebase Auth cache
    if (typeof indexedDB !== "undefined") {
      // Clear Firebase Auth IndexedDB
      indexedDB.deleteDatabase("firebase-auth-db");
    }

    console.log("✅ Authentication data cleared");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

// Function to force refresh the page and clear auth
export const forceAuthRefresh = () => {
  clearAuthData();
  window.location.reload();
};
