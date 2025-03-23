import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { supabase } from "@/lib/supabase";
import {
  FileUp,
  FileIcon,
  X,
  Check,
  Camera,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface DocumentUploaderProps {
  loadId: string;
  documentType: string;
  onSuccess?: (documentData: any) => void;
  onError?: (error: Error) => void;
  allowedFileTypes?: string[];
  maxSizeMB?: number;
  buttonText?: string;
  notes?: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  loadId,
  documentType,
  onSuccess,
  onError,
  allowedFileTypes = [".pdf", ".jpg", ".jpeg", ".png"],
  maxSizeMB = 10,
  buttonText = "Upload Document",
  notes = true,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [noteText, setNoteText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) {
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    const fileExtension = `.${selectedFile.name.split(".").pop()?.toLowerCase()}`;
    if (!allowedFileTypes.includes(fileExtension)) {
      setError(
        `Invalid file type. Allowed types: ${allowedFileTypes.join(", ")}`,
      );
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Generate a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${loadId}_${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${documentType.toLowerCase()}/${fileName}`;

      // Upload file to Supabase Storage with progress tracking
      const { error: uploadError, data } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // Create document record in database
      const { data: document, error: dbError } = await supabase
        .from("documents")
        .insert([
          {
            load_id: loadId,
            document_type: documentType,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            public_url: publicUrl,
            status: "UPLOADED",
            notes: noteText || null,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(true);
      if (onSuccess) onSuccess(document);

      // Reset form after successful upload
      setTimeout(() => {
        setFile(null);
        setNoteText("");
        setProgress(0);
        setSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
      if (onError)
        onError(
          err instanceof Error
            ? err
            : new Error(err.message || "Upload failed"),
        );
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      // Validate file size
      if (droppedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
        return;
      }

      // Validate file type
      const fileExtension = `.${droppedFile.name.split(".").pop()?.toLowerCase()}`;
      if (!allowedFileTypes.includes(fileExtension)) {
        setError(
          `Invalid file type. Allowed types: ${allowedFileTypes.join(", ")}`,
        );
        return;
      }

      setFile(droppedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment"; // Use rear camera
      fileInputRef.current.click();
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600 mr-2" />
          <AlertDescription className="text-green-600">
            Document uploaded successfully!
          </AlertDescription>
        </Alert>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center ${file ? "border-blue-300 bg-blue-50" : "border-gray-300"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        {!file ? (
          <div className="space-y-4">
            <FileUp className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                Drag and drop your file here, or
              </p>
              <Label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                browse to upload
              </Label>
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={allowedFileTypes.join(",")}
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: {allowedFileTypes.join(", ")} (Max {maxSizeMB}
              MB)
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              disabled={uploading}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Mobile camera button */}
      <div className="flex justify-center mb-4">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleTakePhoto}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>

      {notes && (
        <div className="mb-4">
          <Label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any additional information about this document"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            disabled={uploading}
            className="resize-none"
          />
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center mt-1 text-gray-500">
            Uploading: {progress}%
          </p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </div>
  );
};

export default DocumentUploader;
