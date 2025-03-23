import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface BOLUploadPromptProps {
  loadId: string;
  isDeliveryComplete?: boolean;
  onUploadComplete?: () => void;
  onSkip?: () => void;
}

const BOLUploadPrompt: React.FC<BOLUploadPromptProps> = ({
  loadId,
  isDeliveryComplete = false,
  onUploadComplete,
  onSkip,
}) => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadError(null);

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, you would upload the file to your server here
      // const formData = new FormData();
      // formData.append('file', uploadedFile);
      // formData.append('loadId', loadId);
      // const response = await fetch('/api/upload-bol', { method: 'POST', body: formData });
      // if (!response.ok) throw new Error('Upload failed');

      setUploadSuccess(true);
      toast({
        title: "Upload Successful",
        description: "Bill of Lading has been uploaded successfully.",
      });

      // Store in local storage for demo purposes
      localStorage.setItem(
        `bol_${loadId}`,
        JSON.stringify({
          filename: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type,
          uploadedAt: new Date().toISOString(),
        }),
      );

      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
        }, 1500);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const handleSkip = () => {
    toast({
      title: "Upload Skipped",
      description:
        "You can upload the Bill of Lading later from the Documents section.",
      variant: "destructive",
    });

    if (onSkip) onSkip();
  };

  return (
    <Card className="w-full bg-white shadow-md dark:bg-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          {isDeliveryComplete
            ? "Upload Proof of Delivery"
            : "Upload Bill of Lading"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Upload Complete!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {uploadedFile?.name}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              {previewUrl ? (
                <div className="relative w-full max-w-md">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-full h-auto max-h-48 object-contain rounded-md"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                    {uploadedFile?.name}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm text-gray-600 dark:text-gray-400">
                    <p className="pl-1">
                      Drag and drop your file here or click buttons below to
                      select a file
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PDF, PNG, JPG or HEIC up to 10MB
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                <span className="text-sm text-red-800 dark:text-red-200">
                  {uploadError}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Select File
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={triggerCameraInput}
                disabled={isUploading}
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.heic"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!uploadSuccess && (
          <Button variant="ghost" onClick={handleSkip} disabled={isUploading}>
            Skip for now
          </Button>
        )}
        {!uploadSuccess ? (
          <Button
            onClick={handleUpload}
            disabled={!uploadedFile || isUploading}
            className={isUploading ? "opacity-80" : ""}
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        ) : (
          <Button onClick={onUploadComplete}>Continue</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BOLUploadPrompt;
