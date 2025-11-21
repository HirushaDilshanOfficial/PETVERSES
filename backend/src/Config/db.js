import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log("📍 Database: petverse_db");

    // Enhanced connection options for better reliability
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000, // Increase timeout to 10s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      // SSL/TLS options to address connection issues
      tls: true,
      tlsInsecure: true, // This bypasses SSL validation - only for development!
      // Additional options for better connection stability
      directConnection: false,
      retryWrites: true,
      readPreference: "primary",
      // Force IPv4 connection
      family: 4,
    };

    await mongoose.connect(process.env.MONGO_URI, connectionOptions);

    console.log("✅ MONGODB CONNECTED SUCCESSFULLY");
    console.log(
      `📊 Connected to database: ${mongoose.connection.db.databaseName}`
    );
  } catch (error) {
    console.error("❌ Error connecting to MONGODB:", error.message);
    console.error("Full error:", error);

    if (
      error.message.includes("IP") ||
      error.message.includes("whitelist") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.log("\n🔧 SOLUTION - IP Whitelisting Required:");
      console.log("1. Go to https://cloud.mongodb.com/");
      console.log("2. Navigate to Network Access (left sidebar)");
      console.log("3. Click 'Add IP Address'");
      console.log(
        "4. Add your current IP address or allow access from anywhere (0.0.0.0/0) for development"
      );
      console.log("5. Click 'Confirm'");
      console.log(
        "\n⚠️  For development only: You can temporarily allow access from anywhere by adding 0.0.0.0/0"
      );
      console.log("   Remember to restrict this in production for security!\n");
    }

    // Try to connect with a fallback option if the primary fails
    if (process.env.MONGO_URI_BACKUP) {
      console.log("🔄 Trying backup MongoDB connection...");
      try {
        // Define connectionOptions here as well
        const connectionOptions = {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          retryWrites: true,
          retryReads: true,
          maxPoolSize: 10,
          // SSL/TLS options to address connection issues
          tls: true,
          tlsInsecure: true, // This bypasses SSL validation - only for development!
          directConnection: false,
          retryWrites: true,
          readPreference: "primary",
          // Force IPv4 connection
          family: 4,
        };

        await mongoose.connect(process.env.MONGO_URI_BACKUP, connectionOptions);
        console.log("✅ BACKUP MONGODB CONNECTED SUCCESSFULLY");
      } catch (backupError) {
        console.error(
          "❌ Backup MongoDB connection also failed:",
          backupError.message
        );
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};
