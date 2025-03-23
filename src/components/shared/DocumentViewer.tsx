import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription } from "../ui/alert";
import { FileIcon, Download, Trash, ExternalLink } from "lucide-react";
import { saveAs } from "file-saver";

interface DocumentViewerProps {
  loadId: string;
  documentType?: string;
  onDelete?: (documentId: string) => void;
  showControls?: boolean;
  maxHeight?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  loadId,
  documentType,
  onDelete,
  showControls = true,
  maxHeight = "500px",
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [loadId, documentType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("documents").select("*").eq("load_id", loadId);

      if (documentType) {
        query = query.eq("document_type", documentType);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      setDocuments(data || []);
      if (data && data.length > 0) {
        setSelectedDocument(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: any) => {
    try {
      // If we have a public URL, use it directly
      if (document.public_url) {
        saveAs(document.public_url, document.file_name);
        return;
      }

      // Otherwise, get the file from storage
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (error) throw error;

      saveAs(URL.createObjectURL(data), document.file_name);
    } catch (err: any) {
      console.error("Error downloading document:", err);
      setError("Failed to download document");
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      // Update local state
      setDocuments(documents.filter((doc) => doc.id !== documentId));

      // If the deleted document was selected, select another one
      if (selectedDocument && selectedDocument.id === documentId) {
        const remaining = documents.filter((doc) => doc.id !== documentId);
        setSelectedDocument(remaining.length > 0 ? remaining[0] : null);
      }

      // Call onDelete callback if provided
      if (onDelete) {
        onDelete(documentId);
      }
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setError("Failed to delete document");
    }
  };

  const renderDocumentPreview = () => {
    if (!selectedDocument) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No document selected</p>
        </div>
      );
    }

    const isImage = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
    ].includes(selectedDocument.file_type);

    const isPdf = selectedDocument.file_type === "application/pdf";

    if (isImage && selectedDocument.public_url) {
      return (
        <div className="flex items-center justify-center h-full overflow-auto">
          <img
            src={selectedDocument.public_url}
            alt={selectedDocument.file_name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (isPdf && selectedDocument.public_url) {
      return (
        <iframe
          src={`${selectedDocument.public_url}#toolbar=0`}
          className="w-full h-full border-0"
          title={selectedDocument.file_name}
        />
      );
    }

    // Fallback for other file types or when public_url is not available
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileIcon className="h-16 w-16 text-blue-500 mb-4" />
        <p className="text-lg font-medium">{selectedDocument.file_name}</p>
        <p className="text-sm text-gray-500 mb-4">
          {(selectedDocument.file_size / (1024 * 1024)).toFixed(2)} MB
        </p>
        <Button onClick={() => handleDownload(selectedDocument)}>
          <Download className="h-4 w-4 mr-2" />
          Download to view
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          No documents found for this load
          {documentType ? ` (${documentType})` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDocument?.document_type || "Document"} -{" "}
            {selectedDocument?.file_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border rounded-md overflow-hidden bg-gray-50"
            style={{ height: maxHeight }}
          >
            {renderDocumentPreview()}
          </div>
          {selectedDocument?.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium mb-1">Notes:</p>
              <p className="text-sm text-gray-600">{selectedDocument.notes}</p>
            </div>
          )}
        </CardContent>
        {showControls && selectedDocument && (
          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(selectedDocument)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {selectedDocument.public_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(selectedDocument.public_url, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(selectedDocument.id)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardFooter>
        )}
      </Card>

      {documents.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${selectedDocument?.id === doc.id ? "border-blue-500 bg-blue-50" : ""}`}
              onClick={() => setSelectedDocument(doc)}
            >
              <div className="flex items-center">
                <FileIcon className="h-5 w-5 text-blue-500 mr-2" />
                <div className="overflow-hidden">
                  <p className="text-xs font-medium truncate">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
