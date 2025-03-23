import { supabase } from "./supabase";
import { logger } from "@/api/utils/logger";

export interface FileUploadResult {
  path: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
}

export class StorageService {
  private readonly ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async uploadFile(file: File, loadId: string): Promise<FileUploadResult> {
    try {
      // Validate file
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        throw new Error("File type not allowed");
      }
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error("File size exceeds limit");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${loadId}/${timestamp}-${file.name}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(filename, file, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(filename);

      // Generate thumbnail if image
      let thumbnailUrl;
      if (file.type.startsWith("image/")) {
        thumbnailUrl = `${publicUrl}?width=200&height=200&fit=cover`;
      }

      return {
        path: data.path,
        url: publicUrl,
        thumbnailUrl,
        mimeType: file.type,
        size: file.size,
      };
    } catch (error) {
      logger.error("Error uploading file:", error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from("chat-attachments")
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      logger.error("Error deleting file:", error);
      throw error;
    }
  }

  async getFileUrl(path: string): Promise<string> {
    const {
      data: { publicUrl },
    } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return publicUrl;
  }
}

export const storageService = new StorageService();
