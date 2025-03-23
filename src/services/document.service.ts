import { supabase } from "@/lib/supabase";
import { logger } from "@/api/utils/logger";

/**
 * Service for managing documents
 */
export class DocumentService {
  /**
   * Get all documents for a load
   */
  async getDocumentsByLoadId(loadId: string, documentType?: string) {
    try {
      let query = supabase.from("documents").select("*").eq("load_id", loadId);

      if (documentType) {
        query = query.eq("document_type", documentType);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Error fetching documents for load ${loadId}:`, error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocumentById(id: string) {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error fetching document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get document file from storage
   */
  async getDocumentFile(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error downloading document file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get document submissions
   */
  async getDocumentSubmissions(documentId: string) {
    try {
      const { data, error } = await supabase
        .from("document_submissions")
        .select("*, payment_processors(*), scheduled_tasks(*)")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        `Error fetching submissions for document ${documentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id: string) {
    try {
      const { data, error } = await supabase
        .from("document_submissions")
        .select("*, documents(*), payment_processors(*), scheduled_tasks(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error fetching submission ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(id: string, status: string) {
    try {
      const { data, error } = await supabase
        .from("documents")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error updating document ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Get documents pending submission
   */
  async getPendingDocuments(documentType: string = "BOL") {
    try {
      // Get documents that haven't been submitted yet
      const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .eq("document_type", documentType)
        .eq("status", "UPLOADED")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Filter out documents that already have submissions
      if (documents && documents.length > 0) {
        const documentIds = documents.map((doc) => doc.id);

        const { data: submissions, error: subError } = await supabase
          .from("document_submissions")
          .select("document_id")
          .in("document_id", documentIds);

        if (subError) throw subError;

        if (submissions && submissions.length > 0) {
          const submittedIds = new Set(
            submissions.map((sub) => sub.document_id),
          );
          return documents.filter((doc) => !submittedIds.has(doc.id));
        }
      }

      return documents || [];
    } catch (error) {
      logger.error(`Error fetching pending ${documentType} documents:`, error);
      throw error;
    }
  }

  /**
   * Get failed submissions
   */
  async getFailedSubmissions() {
    try {
      const { data, error } = await supabase
        .from("document_submissions")
        .select("*, documents(*), payment_processors(*), scheduled_tasks(*)")
        .eq("submission_status", "FAILED")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching failed submissions:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const documentService = new DocumentService();
