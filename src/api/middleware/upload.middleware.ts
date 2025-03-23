import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { logger } from "../utils/logger";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "temp-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define file size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter function to validate file types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Accept only PDF, JPG, JPEG, and PNG files
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF, JPG, and PNG files are allowed."),
    );
  }
};

// Create multer upload instance
export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

// Error handling middleware for multer errors
export const handleUploadErrors = (
  err: any,
  req: Request,
  res: any,
  next: any,
) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    logger.error("Multer error:", err);
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // An unknown error occurred
    logger.error("Upload error:", err);
    return res.status(500).json({ error: err.message });
  }
  next();
};
