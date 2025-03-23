import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/convex";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";

interface BolUploadPromptProps {
  loadId: string;
  loadNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BolUploadPrompt: React.FC<BolUploadPromptProps> = ({
  loadId,
  loadNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"camera" | "file">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<any>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check for cached offline uploads on coming back online
  useEffect(() => {
    if (isOnline && offlineData) {
      toast({
        title: "Back Online",
        description: "Uploading your previously saved BOL document...",
        duration: 5000,
      });

      handleUpload();
    }
  }, [isOnline, offlineData]);

  // Camera capture simulation
  const handleCameraCapture = () => {
    // In a real implementation, this would use the device camera
    // For this demo, we'll simulate a capture with a placeholder image
    const placeholderImage =
      "https://images.unsplash.com/photo-1568219656418-15c329312bf1?w=800&q=80";
    setCapturedImage(placeholderImage);
    setSelectedFile(null);
    setActiveTab("camera");
  };

  // File selection handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setCapturedImage(null);
      setActiveTab("file");
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have a document to upload
    if (!capturedImage && !selectedFile) {
      toast({
        title: "No Document Selected",
        description: "Please capture or select a BOL document to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadState("uploading");

      // If offline, store data locally
      if (!isOnline) {
        const offlineUploadData = {
          loadId,
          loadNumber,
          documentType: "bill_of_lading",
          documentData: capturedImage || selectedFile,
          notes,
          timestamp: Date.now(),
        };

        // Store in localStorage (in a real app, use IndexedDB or similar)
        localStorage.setItem(
          `bol_upload_${loadId}`,
          JSON.stringify(offlineUploadData),
        );
        setOfflineData(offlineUploadData);

        toast({
          title: "Saved Offline",
          description:
            "Your BOL document has been saved locally and will upload when you're back online.",
          duration: 5000,
        });

        setUploadState("success");
        return;
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 300);

      // In a real implementation, this would upload to your backend
      // For this demo, we'll simulate an API call with a timeout
      setTimeout(async () => {
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Create document record in Convex
        try {
          // This would be a real API call in production
          // await api.documents.createDocument({
          //   loadId,
          //   userId: user.id,
          //   type: "bill_of_lading",
          //   name: `BOL-${loadNumber}`,
          //   notes: notes,
          //   fileUrl: "https://example.com/placeholder-url", // This would be the actual uploaded file URL
          //   fileSize: selectedFile?.size || 0,
          //   mimeType: selectedFile?.type || "image/jpeg",
          // });

          // Clear any offline data
          if (offlineData) {
            localStorage.removeItem(`bol_upload_${loadId}`);
            setOfflineData(null);
          }

          setUploadState("success");

          toast({
            title: "Upload Successful",
            description: "Your BOL document has been uploaded successfully.",
            duration: 5000,
          });

          // Wait a moment before closing
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } catch (error) {
          console.error("Error creating document record:", error);
          setUploadState("error");

          toast({
            title: "Upload Error",
            description:
              "There was an error saving your document. Please try again.",
            variant: "destructive",
          });
        }
      }, 3000);
    } catch (error) {
      console.error("Error uploading BOL:", error);
      setUploadState("error");

      toast({
        title: "Upload Error",
        description:
          "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset the form
  const handleReset = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setNotes("");
    setUploadProgress(0);
    setUploadState("idle");
  };

  // Render the document preview
  const renderDocumentPreview = () => {
    if (capturedImage) {
      return (
        <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden">
          <img
            src={capturedImage}
            alt="Captured BOL"
            className="w-full h-full object-contain"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setCapturedImage(null)}
          >
            Remove
          </Button>
        </div>
      );
    }

    if (selectedFile) {
      // For PDF or other file types
      return (
        <div className="relative w-full h-64 bg-gray-100 rounded-md flex items-center justify-center">
          <div className="flex flex-col items-center p-4">
            <FileText size={48} className="text-blue-500 mb-2" />
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setSelectedFile(null)}
          >
            Remove
          </Button>
        </div>
      );
    }

    return null;
  };

  // Render upload status
  const renderUploadStatus = () => {
    switch (uploadState) {
      case "uploading":
        return (
          <div className="space-y-4 py-4">
            <p className="text-center text-sm">
              Uploading your BOL document...
            </p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-center text-xs text-gray-500">
              {uploadProgress}% complete
            </p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">
              Upload Complete!
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Your Bill of Lading has been successfully uploaded and associated
              with load #{loadNumber}.
            </p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-center">Upload Failed</h3>
            <p className="text-sm text-gray-500 text-center">
              There was an error uploading your document. Please try again.
            </p>
            <Button onClick={handleReset}>Try Again</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {!isOnline && <WifiOff className="h-5 w-5 text-orange-500 mr-2" />}
            {isOnline
              ? "Upload Bill of Lading"
              : "Offline Mode - Upload Bill of Lading"}
          </DialogTitle>
        </DialogHeader>

        {uploadState === "idle" ? (
          <>
            <Tabs
              defaultValue={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "camera" | "file")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera" disabled={!!selectedFile}>
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </TabsTrigger>
                <TabsTrigger value="file" disabled={!!capturedImage}>
                  <Upload className="h-4 w-4 mr-2" />
                  File Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="space-y-4 py-4">
                {capturedImage ? (
                  renderDocumentPreview()
                ) : (
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center justify-center h-48">
                      <Button onClick={handleCameraCapture}>
                        <Camera className="h-4 w-4 mr-2" />
                        Capture BOL Document
                      </Button>
                      <p className="text-xs text-gray-500 mt-4">
                        Position the BOL document within the frame and take a
                        clear photo
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="file" className="space-y-4 py-4">
                {selectedFile ? (
                  renderDocumentPreview()
                ) : (
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center justify-center h-48">
                      <label
                        htmlFor="bol-file-upload"
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                            <Upload className="h-6 w-6 text-blue-600" />
                          </div>
                          <Button variant="outline">Select BOL Document</Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Supported formats: PDF, JPG, PNG (max 10MB)
                          </p>
                        </div>
                        <input
                          id="bol-file-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {(capturedImage || selectedFile) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes (Optional)
                  </label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this BOL document..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {!isOnline && (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="py-4 flex items-start space-x-3">
                      <WifiOff className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          You're currently offline
                        </p>
                        <p className="text-xs text-orange-700 mt-1">
                          Your BOL document will be saved locally and uploaded
                          automatically when you reconnect.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={
                  (!capturedImage && !selectedFile) ||
                  uploadState === "uploading"
                }
              >
                Upload BOL
              </Button>
            </DialogFooter>
          </>
        ) : (
          renderUploadStatus()
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BolUploadPrompt;
