import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/Models/User.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const admin = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: "https://accounts.google.com/o/oauth2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  }),
});

const auth = getAuth(admin);

async function createAdminUser() {
  try {
    console.log("🔥 Starting admin user creation...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const adminEmail = "admin@petverse.com";
    const adminPassword = "admin123"; // Firebase requires at least 6 characters

    // Check if admin already exists in database
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("❌ Admin user already exists in database");
      process.exit(1);
    }

    // Create admin user in Firebase using Admin SDK
    console.log("🔥 Creating admin user in Firebase...");
    const firebaseUser = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      emailVerified: true,
      disabled: false,
    });
    console.log("✅ Admin user created in Firebase:", firebaseUser.uid);

    // Create admin user in database
    console.log("💾 Creating admin user in database...");
    const adminData = {
      fullName: "System Administrator",
      email: adminEmail,
      phoneNumber: "+1234567890",
      firebaseUid: firebaseUser.uid,
      role: "admin",
      isActive: true,
    };

    const newAdmin = await User.createUser(adminData);
    console.log("✅ Admin user created in database:", newAdmin._id);

    console.log("🎉 Admin user created successfully!");
    console.log("📧 Email:", adminEmail);
    console.log("🔑 Password:", adminPassword);
    console.log("👤 Role: admin");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);

    if (error.code === "auth/email-already-in-use") {
      console.log("📧 Admin user already exists in Firebase");
    }
  } finally {
    // Close connections
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createAdminUser();
