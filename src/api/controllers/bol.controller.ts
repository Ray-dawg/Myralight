import { Request, Response } from "express";
import { SupabaseService } from "../services/supabase.service";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { WebSocketService } from "../services/websocket.service";

const supabaseService = new SupabaseService();

/**
 * Controller for handling Bill of Lading (BOL) operations
 */
export const bolController = {
  /**
   * Upload a BOL document for a specific load
   */
  uploadBol: async (req: Request, res: Response) => {
    try {
      const { loadId } = req.params;
      const user = (req as any).user;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate load exists and user has permission
      const load = await supabaseService.getLoadById(loadId);
      if (!load) {
        return res.status(404).json({ error: "Load not found" });
      }

      // Check if user is authorized to upload for this load
      // This would typically check if the user is the assigned driver or has admin rights
      const isAuthorized = await checkUserAuthorization(user.id, loadId);
      if (!isAuthorized) {
        return res
          .status(403)
          .json({ error: "Not authorized to upload BOL for this load" });
      }

      // Generate a unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = `bol/${loadId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await supabaseService.supabase.storage
          .from("documents")
          .upload(filePath, fs.readFileSync(file.path), {
            contentType: file.mimetype,
            cacheControl: "3600",
          });

      if (uploadError) {
        logger.error("Supabase storage upload error:", uploadError);
        return res
          .status(500)
          .json({ error: "Failed to upload file to storage" });
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabaseService.supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || "";

      // Create a record in the documents table
      const { data: document, error: documentError } =
        await supabaseService.supabase
          .from("documents")
          .insert([
            {
              load_id: loadId,
              user_id: user.id,
              document_type: "BOL",
              file_name: file.originalname,
              file_path: filePath,
              file_type: file.mimetype,
              file_size: file.size,
              public_url: publicUrl,
              status: "UPLOADED",
            },
          ])
          .select()
          .single();

      if (documentError) {
        logger.error("Database insert error:", documentError);
        return res
          .status(500)
          .json({ error: "Failed to create document record" });
      }

      // Update the load status to indicate BOL has been uploaded
      const { error: updateError } = await supabaseService.supabase
        .from("loads")
        .update({ bol_status: "UPLOADED", updatedAt: new Date().toISOString() })
        .eq("id", loadId);

      if (updateError) {
        logger.error("Load update error:", updateError);
        // Don't return error here, as the document was successfully uploaded
      }

      // Clean up the temporary file
      fs.unlinkSync(file.path);

      // Notify relevant parties via WebSocket
      WebSocketService.getInstance().sendMessage("document:uploaded", {
        loadId,
        document,
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({
        message: "BOL uploaded successfully",
        document,
      });
    } catch (error) {
      logger.error("BOL upload error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  /**
   * Get all BOL documents for a specific load
   */
  getBolsByLoadId: async (req: Request, res: Response) => {
    try {
      const { loadId } = req.params;
      const user = (req as any).user;

      // Validate load exists and user has permission to view it
      const hasAccess = await checkUserAccessToLoad(user.id, loadId);
      if (!hasAccess) {
        return res
          .status(403)
          .json({ error: "Not authorized to view documents for this load" });
      }

      // Get all BOL documents for the load
      const { data: documents, error } = await supabaseService.supabase
        .from("documents")
        .select("*")
        .eq("load_id", loadId)
        .eq("document_type", "BOL")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Database query error:", error);
        return res.status(500).json({ error: "Failed to retrieve documents" });
      }

      return res.status(200).json(documents);
    } catch (error) {
      logger.error("Get BOLs error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  /**
   * Get a specific BOL document by its ID
   */
  getBolById: async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const user = (req as any).user;

      // Get the document
      const { data: document, error } = await supabaseService.supabase
        .from("documents")
        .select("*, loads(*)")
        .eq("id", documentId)
        .eq("document_type", "BOL")
        .single();

      if (error || !document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check if user has permission to view this document
      const hasAccess = await checkUserAccessToLoad(user.id, document.load_id);
      if (!hasAccess) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this document" });
      }

      return res.status(200).json(document);
    } catch (error) {
      logger.error("Get BOL by ID error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  /**
   * Delete a BOL document
   */
  deleteBol: async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const user = (req as any).user;

      // Get the document to check permissions and get the file path
      const { data: document, error: fetchError } =
        await supabaseService.supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

      if (fetchError || !document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check if user has permission to delete this document
      // Typically only admins or the original uploader should be able to delete
      const canDelete = await checkUserDeletePermission(user.id, document);
      if (!canDelete) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this document" });
      }

      // Delete the file from storage
      const { error: storageError } = await supabaseService.supabase.storage
        .from("documents")
        .remove([document.file_path]);

      if (storageError) {
        logger.error("Storage delete error:", storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete the document record from the database
      const { error: dbError } = await supabaseService.supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (dbError) {
        logger.error("Database delete error:", dbError);
        return res
          .status(500)
          .json({ error: "Failed to delete document record" });
      }

      // If this was the only BOL for the load, update the load status
      const { data: remainingDocs, error: countError } =
        await supabaseService.supabase
          .from("documents")
          .select("id")
          .eq("load_id", document.load_id)
          .eq("document_type", "BOL");

      if (!countError && (!remainingDocs || remainingDocs.length === 0)) {
        // No BOLs left, update load status
        await supabaseService.supabase
          .from("loads")
          .update({
            bol_status: "PENDING",
            updatedAt: new Date().toISOString(),
          })
          .eq("id", document.load_id);
      }

      return res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
      logger.error("Delete BOL error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

/**
 * Check if a user is authorized to upload a BOL for a specific load
 * @param userId The ID of the user attempting the upload
 * @param loadId The ID of the load
 * @returns Boolean indicating if the user is authorized
 */
async function checkUserAuthorization(
  userId: string,
  loadId: string,
): Promise<boolean> {
  try {
    // Check if user is the assigned driver for this load
    const { data: assignment, error } = await supabaseService.supabase
      .from("load_assignments")
      .select("*")
      .eq("load_id", loadId)
      .eq("driver_id", userId)
      .single();

    if (!error && assignment) {
      return true;
    }

    // Check if user is an admin or has special permissions
    const { data: userRole, error: roleError } = await supabaseService.supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (
      !roleError &&
      userRole &&
      ["admin", "super_admin"].includes(userRole.role)
    ) {
      return true;
    }

    // Check if user is from the carrier company assigned to this load
    const { data: load, error: loadError } = await supabaseService.supabase
      .from("loads")
      .select("carrier_id")
      .eq("id", loadId)
      .single();

    if (!loadError && load) {
      const { data: carrierUser, error: carrierError } =
        await supabaseService.supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .eq("company_id", load.carrier_id)
          .single();

      if (!carrierError && carrierUser) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error("Authorization check error:", error);
    return false;
  }
}

/**
 * Check if a user has access to view documents for a specific load
 * @param userId The ID of the user attempting to access
 * @param loadId The ID of the load
 * @returns Boolean indicating if the user has access
 */
async function checkUserAccessToLoad(
  userId: string,
  loadId: string,
): Promise<boolean> {
  try {
    // Check if user is an admin or has special permissions
    const { data: userRole, error: roleError } = await supabaseService.supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (
      !roleError &&
      userRole &&
      ["admin", "super_admin"].includes(userRole.role)
    ) {
      return true;
    }

    // Get the load to check shipper and carrier IDs
    const { data: load, error: loadError } = await supabaseService.supabase
      .from("loads")
      .select("shipper_id, carrier_id")
      .eq("id", loadId)
      .single();

    if (loadError || !load) {
      return false;
    }

    // Check if user is from the shipper or carrier company
    const { data: user, error: userError } = await supabaseService.supabase
      .from("users")
      .select("company_id, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return false;
    }

    // Allow access if user is from the shipper or carrier company
    if (
      user.company_id === load.shipper_id ||
      user.company_id === load.carrier_id
    ) {
      return true;
    }

    // Check if user is the assigned driver
    const { data: assignment, error: assignmentError } =
      await supabaseService.supabase
        .from("load_assignments")
        .select("*")
        .eq("load_id", loadId)
        .eq("driver_id", userId)
        .single();

    if (!assignmentError && assignment) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Access check error:", error);
    return false;
  }
}

/**
 * Check if a user has permission to delete a document
 * @param userId The ID of the user attempting to delete
 * @param document The document to be deleted
 * @returns Boolean indicating if the user can delete
 */
async function checkUserDeletePermission(
  userId: string,
  document: any,
): Promise<boolean> {
  try {
    // Allow the original uploader to delete
    if (document.user_id === userId) {
      return true;
    }

    // Check if user is an admin
    const { data: userRole, error: roleError } = await supabaseService.supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (
      !roleError &&
      userRole &&
      ["admin", "super_admin"].includes(userRole.role)
    ) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Delete permission check error:", error);
    return false;
  }
}
