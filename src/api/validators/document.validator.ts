import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

enum DocumentType {
  BOL = "BOL",
  POD = "POD",
  INVOICE = "INVOICE",
  INSPECTION = "INSPECTION",
  OTHER = "OTHER",
}

/**
 * Validates document upload request parameters
 */
export const validateDocumentUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { loadId } = req.params;
    const { documentType } = req.body;

    // Validate loadId
    if (!loadId || typeof loadId !== "string" || loadId.trim() === "") {
      return res.status(400).json({ error: "Valid load ID is required" });
    }

    // Validate documentType if provided
    if (
      documentType &&
      !Object.values(DocumentType).includes(documentType as DocumentType)
    ) {
      return res.status(400).json({
        error: `Invalid document type. Must be one of: ${Object.values(
          DocumentType,
        ).join(", ")}`,
      });
    }

    // If no file was uploaded, reject the request
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file size (additional check beyond multer)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({
        error: `File too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`,
      });
    }

    // Validate file type (additional check beyond multer)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Invalid file type. Only PDF, JPG, and PNG files are allowed.",
      });
    }

    next();
  } catch (error) {
    logger.error("Document validation error:", error);
    return res.status(500).json({ error: "Validation error" });
  }
};

/**
 * Sanitizes file names to prevent path traversal and other security issues
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove any path components
  const baseName = fileName.split(/[\/\\]/).pop() || "";

  // Remove any non-alphanumeric characters except for periods, hyphens, and underscores
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "");
};
