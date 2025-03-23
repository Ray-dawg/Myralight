/**
 * Document types for BOL and other document handling
 */

export enum DocumentType {
  BOL = "BOL",
  POD = "POD",
  INVOICE = "INVOICE",
  INSPECTION = "INSPECTION",
  OTHER = "OTHER",
}

export enum DocumentStatus {
  PENDING = "PENDING",
  UPLOADED = "UPLOADED",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export interface Document {
  id: string;
  load_id: string;
  user_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  public_url?: string;
  status: DocumentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadResponse {
  message: string;
  document: Document;
}

export interface DocumentUploadRequest {
  loadId: string;
  documentType: DocumentType;
  notes?: string;
  // File is handled by multer middleware
}
