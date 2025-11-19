import Service from "../Models/Service.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Get all services for a specific user
export async function getAllServices(req, res) {
  try {
    // No user filtering; return all services
    const services = await Service.find({}).sort({ createdAt: -1 });

    const normalized = services.map((doc) => {
      const obj = doc.toObject();
      if (
        (obj.price === undefined || obj.price === null) &&
        Array.isArray(obj.packages) &&
        obj.packages.length
      ) {
        const prices = obj.packages
          .map((p) => (typeof p.price === "number" ? p.price : NaN))
          .filter((n) => !Number.isNaN(n));
        if (prices.length) obj.price = Math.min(...prices);
      }
      return obj;
    });

    res.status(200).json(normalized);
  } catch (error) {
    console.error("Error in getAllServices controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get services for the logged-in user (My Services)
export async function getMyServices(req, res) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    console.log("Getting services for user:", req.user.userId);

    // Try to find services using both possible fields to ensure compatibility
    const userId = req.user.userId;
    const services = await Service.find({
      $or: [{ userID: userId }, { "provider.userId": userId }],
    }).sort({ createdAt: -1 });

    console.log("Found services:", services.length);

    const normalized = services.map((doc) => {
      const obj = doc.toObject();
      if (
        (obj.price === undefined || obj.price === null) &&
        Array.isArray(obj.packages) &&
        obj.packages.length
      ) {
        const prices = obj.packages
          .map((p) => (typeof p.price === "number" ? p.price : NaN))
          .filter((n) => !Number.isNaN(n));
        if (prices.length) obj.price = Math.min(...prices);
      }
      return obj;
    });

    res.status(200).json(normalized);
  } catch (error) {
    console.error("Error in getMyServices controller", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Get service by ID
export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const obj = service.toObject();
    if (
      (obj.price === undefined || obj.price === null) &&
      Array.isArray(obj.packages) &&
      obj.packages.length
    ) {
      const prices = obj.packages
        .map((p) => (typeof p.price === "number" ? p.price : NaN))
        .filter((n) => !Number.isNaN(n));
      if (prices.length) obj.price = Math.min(...prices);
    }

    res.status(200).json(obj);
  } catch (error) {
    console.error("Error in getServiceById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// getting user inputs
// Create service
export async function createService(req, res) {
  try {
    // Configure Cloudinary here to ensure env vars are loaded
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log("=== CREATE SERVICE DEBUG ===");
    console.log("Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "NOT SET",
      api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET",
    });
    console.log("req.body:", JSON.stringify(req.body, null, 2));
    console.log("req.files:", req.files ? req.files.length : "No files");
    console.log("Content-Type:", req.headers["content-type"]);

    const { title, description, address, category, packages } = req.body;
    console.log("Destructured data:", {
      title,
      description,
      address,
      category,
      packages,
    });

    // Parse packages if it comes as JSON string from FormData
    let safePackages = [];
    if (packages) {
      try {
        console.log("Parsing packages, type:", typeof packages);
        safePackages =
          typeof packages === "string" ? JSON.parse(packages) : packages;
        safePackages = Array.isArray(safePackages) ? safePackages : [];
        console.log("Parsed packages:", safePackages);
      } catch (error) {
        console.log("Error parsing packages:", error);
        safePackages = [];
      }
    }

    if (!title || !description) {
      console.log("Validation failed: missing title or description");
      return res
        .status(400)
        .json({ message: "Title and description required" });
    }
    const uploadedImages = [];
    if (req.files && req.files.length) {
      console.log("Processing image uploads...");

      for (const file of req.files) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "services",
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary upload error:", error);
                  return reject(error);
                }
                console.log("Image uploaded successfully:", result.secure_url);
                resolve(result);
              }
            );
            stream.end(file.buffer);
          });
          uploadedImages.push(result.secure_url);
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
          // Continue with other images, don't fail the entire service creation
        }
      }
      console.log("Total images uploaded:", uploadedImages.length);
    }

    console.log("Creating service object with:", {
      title,
      description,
      address,
      category,
      images: uploadedImages,
      packages: safePackages,
    });

    const service = new Service({
      title,
      description,
      address,
      category,
      images: uploadedImages,
      packages: safePackages,
      provider: {
        userId: req.user?.userId || null, // use logged-in user ID from auth middleware
        fullName: req.user?.userData?.fullName || "",
        address: req.user?.userData?.address || "",
      },
    });

    console.log("About to save service...");
    await service.save();
    console.log("Service saved successfully!");
    res.status(201).json(service);
  } catch (err) {
    console.error("=== SERVICE CREATION ERROR ===");
    console.error("Error details:", err);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);
    if (err.name === "ValidationError") {
      console.error("Validation errors:", err.errors);
    }
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
      details: err.name === "ValidationError" ? err.errors : undefined,
    });
  }
}

// Update service
export async function updateService(req, res) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find the service and check if it belongs to the logged-in user
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if the service belongs to the logged-in user
    if (service.provider.userId.toString() !== req.user.userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only update your own services" });
    }

    const { title, description, address, category, images, packages } =
      req.body;

    const payload = { title, description, address, category, images };

    if (Array.isArray(packages)) payload.packages = packages;

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    );

    res.status(200).json(updatedService);
  } catch (err) {
    console.error("Error updating service:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Delete service
export async function deleteService(req, res) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find the service and check if it belongs to the logged-in user
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if the service belongs to the logged-in user
    if (service.provider.userId.toString() !== req.user.userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own services" });
    }

    const deletedService = await Service.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Service deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteService controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
