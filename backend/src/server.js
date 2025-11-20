import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import serviceRoutes from "./Routes/serviceRoutes.js";
import authRoutes from "./Routes/authRoutes.js";
import productRoutes from "./Routes/productRoutes.js";
import cartRoutes from "./Routes/cartRoutes.js";
import orderRoutes from "./Routes/orderRoutes.js";
import paymentRoutes from "./Routes/paymentRoutes.js";
import ratingsRoutes from "./Routes/RatingsRoute.js";
import contactRoutes from "./Routes/ContactRoute.js";
import advertisementRoutes from "./Routes/AdvertisementRoute.js";
import faqRoutes from "./Routes/FaqRoute.js";
import dashboardRoutes from "./Routes/dashboardRoutes.js";
import announcementRoutes from "./Routes/announcementRoutes.js"; // Add announcement routes
import otpRoutes from "./Routes/otpRoutes.js"; // Add OTP routes
import appointmentRoutes from "./Routes/appointmentRoutes.js"; // Add appointment routes
import { connectDB } from "./Config/db.js";
import rateLimiter from "./Middleware/rateLimiter.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import nodemailer from "nodemailer";

// Get current directory path and load env FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

// Debug environment variables
console.log("Environment variables loaded:");
console.log(
  "CLOUDINARY_CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "NOT SET"
);
console.log(
  "CLOUDINARY_API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET"
);
console.log(
  "CLOUDINARY_API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET"
);

// Initialize Firebase configuration
import "./Config/firebase.js";
import "./Config/cloudinary.js";

const app = express();
const PORT = process.env.PORT || 5009; // Changed from 5008 to 5009

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3003",
      "http://localhost:3008",
      "http://localhost:3009",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json({ limit: "50mb" })); // Parse JSON bodies with larger limit for file uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Parse URL-encoded bodies
app.use(rateLimiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mySuperSecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Request logging middleware (uncomment for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Request body:", req.body);
  next();
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PETVERSE Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes (only one instance of each route)
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/advertisements", advertisementRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/announcements", announcementRoutes); // Add announcement routes
app.use("/api/otp", otpRoutes); // Add OTP routes
app.use("/api/appointments", appointmentRoutes); // Add appointment routes

// Debug logging to verify routes are registered
console.log("Registered routes:");
console.log("/api/auth:", !!authRoutes);
console.log("/api/services:", !!serviceRoutes);
console.log("/api/products:", !!productRoutes);
console.log("/api/cart:", !!cartRoutes);
console.log("/api/orders:", !!orderRoutes);
console.log("/api/payments:", !!paymentRoutes);
console.log("/api/ratings:", !!ratingsRoutes);
console.log("/api/contact:", !!contactRoutes);
console.log("/api/advertisements:", !!advertisementRoutes);
console.log("/api/faqs:", !!faqRoutes);
console.log("/api/announcements:", !!announcementRoutes); // Add announcement routes
console.log("/api/otp:", !!otpRoutes); // Add OTP routes
console.log("/api/appointments:", !!appointmentRoutes); // Add appointment routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler - This should be the last middleware
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PETVERSE Backend server started on PORT: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
});
