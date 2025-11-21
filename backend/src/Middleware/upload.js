import multer from "multer";

// Store uploaded files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
