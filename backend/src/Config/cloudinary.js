import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

// Helper function to upload file to Cloudinary
export const uploadToCloudinary = async (file, folder = "petverse") => {
  try {
    // Handle buffer upload for multer memory storage
    let uploadSource;
    let uploadOptions = {
      folder: folder,
      resource_type: "auto", // Automatically detect file type
      quality: "auto", // Optimize quality automatically
      fetch_format: "auto", // Optimize format automatically
    };

    if (file.buffer) {
      // Convert buffer to base64 for Cloudinary
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      uploadSource = dataURI;
    } else if (file.path) {
      // Handle file path upload
      uploadSource = file.path;
    } else {
      throw new Error("Invalid file format - no buffer or path found");
    }

    console.log(`☁️ Uploading to Cloudinary folder: ${folder}`);
    console.log(`📏 File type: ${file.mimetype}, Size: ${file.size} bytes`);

    const result = await cloudinary.uploader.upload(
      uploadSource,
      uploadOptions
    );

    console.log(`✅ Upload successful: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error(
      `❌ Cloudinary upload error for ${file?.originalname || "unknown file"}:`,
      error
    );
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Helper function to upload multiple files
export const uploadMultipleToCloudinary = async (
  files,
  folder = "petverse"
) => {
  try {
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file, folder)
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Error uploading multiple files to Cloudinary:", error);
    throw new Error("Multiple file upload failed");
  }
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error("File deletion failed");
  }
};

// Helper function to upload user documents with specific folder structure
export const uploadUserDocument = async (file, userId, documentType) => {
  const folder = `petverse/users/${userId}/${documentType}`;

  try {
    const result = await uploadToCloudinary(file, folder);
    return result;
  } catch (error) {
    console.error(`Error uploading ${documentType} for user ${userId}:`, error);
    throw error;
  }
};

// Helper function to upload NIC documents
export const uploadNICDocuments = async (nicFrontFile, nicBackFile, userId) => {
  try {
    const [nicFrontResult, nicBackResult] = await Promise.all([
      uploadUserDocument(nicFrontFile, userId, "nic-documents"),
      uploadUserDocument(nicBackFile, userId, "nic-documents"),
    ]);

    return {
      nicFront: nicFrontResult,
      nicBack: nicBackResult,
    };
  } catch (error) {
    console.error("Error uploading NIC documents:", error);
    throw new Error("NIC document upload failed");
  }
};

// Helper function to upload face photo
export const uploadFacePhoto = async (facePhotoFile, userId) => {
  try {
    const result = await uploadUserDocument(
      facePhotoFile,
      userId,
      "face-photos"
    );
    return result;
  } catch (error) {
    console.error("Error uploading face photo:", error);
    throw new Error("Face photo upload failed");
  }
};

// Helper function to upload business documents
export const uploadBusinessDocuments = async (businessFiles, userId) => {
  try {
    const uploadPromises = businessFiles.map((file) =>
      uploadUserDocument(file, userId, "business-documents")
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Error uploading business documents:", error);
    throw new Error("Business documents upload failed");
  }
};

// Helper function to get optimized image URL
export const getOptimizedImageUrl = (publicId, width = 400, height = 400) => {
  return cloudinary.url(publicId, {
    width: width,
    height: height,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  });
};

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const requiredEnvVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Missing Cloudinary environment variables:", missingVars);
    return false;
  }

  console.log("✅ Cloudinary configuration validated successfully");
  return true;
};

// Validate configuration on module load
validateCloudinaryConfig();

export default cloudinary;
