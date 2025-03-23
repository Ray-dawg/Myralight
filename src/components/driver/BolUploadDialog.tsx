import React, { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import {
  FileUp,
  X,
  Check,
  Loader2,
  Camera,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BolUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId: string;
  onSuccess?: () => void;
  documentType?: "bol" | "pod"; // Bill of Lading or Proof of Delivery
}

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Allowed file types
const ALLOWED_FILE_TYPES = [".pdf", ".jpg", ".jpeg", ".png"];

const BolUploadDialog: React.FC<BolUploadDialogProps> = ({
  open,
  onOpenChange,
  loadId,
  onSuccess,
  documentType = "bol",
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>(documentType);

  // Convex mutation to update load status after BOL upload
  const updateLoadStatus = useMutation(api.loads.updateLoadStatus);

  // Document type title and descriptions
  const getDocumentTitle = (type: string) => {
    return type === "bol" ? "Bill of Lading" : "Proof of Delivery";
  };

  const documentDescription =
    documentType === "bol"
      ? "Upload the signed Bill of Lading document from the shipper."
      : "Upload the signed Proof of Delivery document from the receiver.";

  // Validate file type and size
  const validateFile = (file: File): boolean => {
    setFileError(null);

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
      );
      return false;
    }

    // Check file type
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      setFileError(
        `File type not supported. Please upload PDF, JPG, or PNG files.`,
      );
      return false;
    }

    return true;
  };

  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        e.target.value = ""; // Reset input
      }
    }
  };

  // Handle drag and drop functionality
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.add("border-blue-400", "bg-blue-50");
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove("border-blue-400", "bg-blue-50");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove("border-blue-400", "bg-blue-50");
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  // Handle file upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${loadId}_${activeTab}_${Date.now()}.${fileExt}`;
      const filePath = `${activeTab}/${fileName}`;

      // Create upload client with progress tracking
      const { error: uploadError, data } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(
              Math.round((progress.loaded / progress.total) * 100),
            );
          },
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // 3. Update load status in Convex
      await updateLoadStatus({
        loadId,
        status: "delivered",
        documentUrl: publicUrl,
        notes: notes || undefined,
      });

      // 4. Show success message and set upload complete
      setUploadComplete(true);
      toast({
        title: "Upload Successful",
        description: `${getDocumentTitle(activeTab)} has been uploaded successfully`,
      });

      // 5. Close dialog and notify parent after a short delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle taking a photo (mobile devices)
  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment"; // Use rear camera
      fileInputRef.current.click();
    }
  };

  // Reset state when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Only reset if not in the middle of uploading
      if (!isUploading) {
        setFile(null);
        setNotes("");
        setFileError(null);
        setUploadProgress(0);
        setUploadComplete(false);
      }
    }
    onOpenChange(open);
  };

  // If upload is complete, show success state
  if (uploadComplete) {
    return (
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Upload Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your {getDocumentTitle(activeTab)} has been successfully uploaded
              and the delivery is marked as complete.
            </p>
            <Button onClick={() => handleDialogChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Delivery Documents</DialogTitle>
          <DialogDescription>
            Upload your delivery documents for verification. Supported formats:
            PDF, JPG, PNG.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bol">Bill of Lading</TabsTrigger>
            <TabsTrigger value="pod">Proof of Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="bol" className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="bol-file">Document</Label>
                  <Badge variant="outline" className="text-xs font-normal">
                    Max 10MB
                  </Badge>
                </div>

                <div
                  ref={dropAreaRef}
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="bol-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setFileError(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FileUp className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        Drag and drop or click to upload
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, JPG or PNG files
                      </p>
                    </div>
                  )}
                </div>

                {fileError && (
                  <div className="text-sm text-red-500 flex items-center mt-1">
                    <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {fileError}
                  </div>
                )}
              </div>

              {/* Mobile camera button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleTakePhoto}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any delivery notes or comments"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {isUploading && (
                <Card className="border-blue-100 bg-blue-50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                        <span className="font-medium text-blue-700">
                          Uploading document...
                        </span>
                      </div>
                      <span className="font-medium text-blue-700">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="sm:justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!file || isUploading || !!fileError}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Document"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="pod" className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="pod-file">Document</Label>
                  <Badge variant="outline" className="text-xs font-normal">
                    Max 10MB
                  </Badge>
                </div>

                <div
                  ref={dropAreaRef}
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="pod-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setFileError(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FileUp className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        Drag and drop or click to upload
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, JPG or PNG files
                      </p>
                    </div>
                  )}
                </div>

                {fileError && (
                  <div className="text-sm text-red-500 flex items-center mt-1">
                    <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {fileError}
                  </div>
                )}
              </div>

              {/* Mobile camera button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleTakePhoto}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any delivery notes or comments"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {isUploading && (
                <Card className="border-blue-100 bg-blue-50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                        <span className="font-medium text-blue-700">
                          Uploading document...
                        </span>
                      </div>
                      <span className="font-medium text-blue-700">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="sm:justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!file || isUploading || !!fileError}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Document"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BolUploadDialog;
