import multer from "multer";
import path from "path";

// Configure multer storage (memory storage for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocumentTypes = /pdf|doc|docx/;

  // Get file extension
  const extname =
    allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
    allowedDocumentTypes.test(path.extname(file.originalname).toLowerCase());

  // Get MIME type
  const mimeType =
    allowedImageTypes.test(file.mimetype) ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Only images (JPEG, JPG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX) are allowed"
      )
    );
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter: fileFilter,
});

// Middleware for service provider document upload
export const uploadServiceProviderDocs = upload.fields([
  { name: "nicFront", maxCount: 1 },
  { name: "nicBack", maxCount: 1 },
  { name: "facePhoto", maxCount: 1 },
  { name: "businessDocuments", maxCount: 5 },
]);

// Middleware for single profile picture upload
export const uploadProfilePicture = upload.single("profilePicture");

// Middleware for general single file upload
export const uploadSingleFile = upload.single("pImage");

// Middleware for multiple files upload
export const uploadMultipleFiles = upload.array("files", 10);

// Error handling middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 10MB per file.",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum 10 files allowed.",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field.",
      });
    }
  }

  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};

export default {
  uploadServiceProviderDocs,
  uploadProfilePicture,
  uploadSingleFile,
  uploadMultipleFiles,
  handleMulterError,
};
