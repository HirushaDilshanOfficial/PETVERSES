import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Firebase Admin SDK configuration
const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Handle newlines in private key
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com",
};

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase app is already initialized 
  firebaseApp = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error.message);
  throw error;
}

// Get Firebase Auth instance
export const auth = admin.auth();

// Get Firebase Storage instance
export const storage = admin.storage();

// Get Firestore instance (if needed in future)
export const firestore = admin.firestore();

// Helper function to verify Firebase ID token
export const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    throw new Error("Invalid or expired token");
  }
};

// Helper function to create custom claims for user roles
export const setCustomUserClaims = async (uid, claims) => {
  try {
    await auth.setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error("Error setting custom claims:", error);
    throw error;
  }
};

// Helper function to get user by email
export const getUserByEmail = async (email) => {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
};

// Helper function to delete user
export const deleteUser = async (uid) => {
  try {
    await auth.deleteUser(uid);
    console.log(`Successfully deleted user ${uid}`);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export default firebaseApp;
