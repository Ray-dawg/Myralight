import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Eye, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  name: string;
  uploadDate: string;
  verificationDate?: string;
  expires: string;
  status: "verified" | "pending" | "rejected";
  errorMessage?: string;
}

export default function DocumentCenter() {
  const { toast } = useToast();
  const [documents] = useState<Document[]>([
    {
      id: "1",
      name: "Driver License.pdf",
      uploadDate: "2024-01-15",
      verificationDate: "2024-01-16",
      expires: "2025-01-15",
      status: "verified",
    },
    {
      id: "2",
      name: "Insurance Certificate.pdf",
      uploadDate: "2024-02-10",
      expires: "2025-02-10",
      status: "pending",
    },
    {
      id: "3",
      name: "Medical Certificate.pdf",
      uploadDate: "2024-02-01",
      expires: "2025-02-01",
      status: "rejected",
      errorMessage:
        "Document is not clearly legible. Please upload a clearer copy.",
    },
    {
      id: "4",
      name: "Vehicle Registration.pdf",
      uploadDate: "2023-03-01",
      verificationDate: "2023-03-02",
      expires: "2024-03-15",
      status: "verified",
    },
  ]);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setShowUploadDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = () => {
    if (!uploadFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!documentType) {
      toast({
        title: "Document Type Required",
        description: "Please select a document type.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      toast({
        title: "Document Uploaded",
        description: `${uploadFile.name} has been uploaded and is pending verification.`,
        variant: "success",
      });

      setIsUploading(false);
      setShowUploadDialog(false);
      setUploadFile(null);
      setDocumentType("");
    }, 2000);
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);

    toast({
      title: "Viewing Document",
      description: `Opening ${doc.name} in document viewer.`,
    });
  };

  const handleDownloadDocument = (doc: Document) => {
    toast({
      title: "Downloading Document",
      description: `${doc.name} is being prepared for download.`,
    });

    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `${doc.name} has been downloaded.`,
        variant: "success",
      });
    }, 1500);
  };

  const StatusBadge = ({ status }: { status: Document["status"] }) => {
    switch (status) {
      case "verified":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E7F6EC] text-[#0E4F2C]">
            Verified
          </div>
        );
      case "pending":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#4F46E5]">
            Pending
          </div>
        );
      case "rejected":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#B91C1C]">
            Rejected
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Documents</h1>
          <Button
            onClick={handleUpload}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {doc.status === "verified" && (
                        <>
                          Uploaded: {doc.uploadDate}
                          <br />
                          Verified: {doc.verificationDate}
                        </>
                      )}
                      {doc.status === "pending" && (
                        <>Uploaded: {doc.uploadDate}</>
                      )}
                      {doc.status === "rejected" && (
                        <div className="text-red-600">{doc.errorMessage}</div>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Expires: {doc.expires}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-yellow-100 hover:bg-yellow-200 text-black"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="ml-2">View</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-yellow-100 hover:bg-yellow-200 text-black"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        Download as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        Download as Image
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">Driver's License</SelectItem>
                  <SelectItem value="insurance">
                    Insurance Certificate
                  </SelectItem>
                  <SelectItem value="medical">Medical Certificate</SelectItem>
                  <SelectItem value="registration">
                    Vehicle Registration
                  </SelectItem>
                  <SelectItem value="dot">DOT Number</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File *</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {uploadFile && (
                <p className="text-sm text-green-600 flex items-center">
                  Selected: {uploadFile.name} (
                  {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadFile(null);
                setDocumentType("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={isUploading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Viewer</DialogTitle>
            <DialogDescription>{selectedDocument?.name}</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="py-4 space-y-6">
              <div className="flex justify-between items-center">
                <StatusBadge status={selectedDocument.status} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(selectedDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* Document Preview */}
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
                {/* In a real application, we would render the actual document here */}
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Document preview would appear here
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedDocument.name}
                  </p>
                </div>
              </div>

              {/* Document Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Uploaded Date</p>
                  <p className="font-medium">{selectedDocument.uploadDate}</p>
                </div>
                {selectedDocument.verificationDate && (
                  <div>
                    <p className="text-gray-500">Verified Date</p>
                    <p className="font-medium">
                      {selectedDocument.verificationDate}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Expiration Date</p>
                  <p className="font-medium">{selectedDocument.expires}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <StatusBadge status={selectedDocument.status} />
                </div>
              </div>

              {selectedDocument.status === "rejected" &&
                selectedDocument.errorMessage && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm">
                    <div className="flex items-start">
                      <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">
                          Rejection Reason
                        </p>
                        <p className="text-red-600 mt-1">
                          {selectedDocument.errorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
