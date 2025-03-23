import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { bolController } from "../controllers/bol.controller";
import {
  uploadMiddleware,
  handleUploadErrors,
} from "../middleware/upload.middleware";
import { validateDocumentUpload } from "../validators/document.validator";

const router = express.Router();

/**
 * @route POST /api/bol/upload/:loadId
 * @desc Upload a BOL document for a specific load
 * @access Private - Authenticated drivers only
 */
router.post(
  "/upload/:loadId",
  authenticate,
  uploadMiddleware.single("bolFile"),
  handleUploadErrors,
  validateDocumentUpload,
  bolController.uploadBol,
);

/**
 * @route GET /api/bol/:loadId
 * @desc Get all BOL documents for a specific load
 * @access Private - Authenticated users with appropriate permissions
 */
router.get("/:loadId", authenticate, bolController.getBolsByLoadId);

/**
 * @route GET /api/bol/document/:documentId
 * @desc Get a specific BOL document by its ID
 * @access Private - Authenticated users with appropriate permissions
 */
router.get("/document/:documentId", authenticate, bolController.getBolById);

/**
 * @route DELETE /api/bol/:documentId
 * @desc Delete a BOL document
 * @access Private - Authenticated users with appropriate permissions
 */
router.delete("/:documentId", authenticate, bolController.deleteBol);

export default router;
