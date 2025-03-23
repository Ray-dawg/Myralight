import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DocumentationContent from "../shared/DocumentationContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Truck,
  FileCheck,
  HelpCircle,
  BookOpen,
  Search,
  Download,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CarrierDocumentCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("");

  // Mock documents data
  const [documents, setDocuments] = useState([
    {
      id: "DOC-001",
      name: "Insurance Certificate",
      type: "Insurance",
      uploadDate: "2024-02-15",
      status: "verified",
      size: "1.8 MB",
    },
    {
      id: "DOC-002",
      name: "DOT Operating Authority",
      type: "Legal",
      uploadDate: "2024-01-20",
      status: "verified",
      size: "1.2 MB",
    },
    {
      id: "DOC-003",
      name: "W-9 Form",
      type: "Tax",
      uploadDate: "2024-01-10",
      status: "pending",
      size: "0.5 MB",
    },
  ]);

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUpload = () => {
    setShowUploadDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadType) {
      toast({
        title: "Document Type Required",
        description: "Please select a document type.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Uploading Document",
      description: `Uploading ${uploadFile.name}...`,
    });

    // Simulate upload process
    setTimeout(() => {
      toast({
        title: "Upload Successful",
        description:
          "Your document has been uploaded and is pending verification.",
        variant: "success",
      });

      // Add a new document to the list
      const newDoc = {
        id: `DOC-00${documents.length + 1}`,
        name: uploadFile.name,
        type: uploadType,
        uploadDate: new Date().toISOString().split("T")[0],
        status: "pending",
        size: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
      };

      setDocuments([newDoc, ...documents]);
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadType("");
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      verified: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  const handleDownload = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    toast({
      title: "Downloading Document",
      description: `${doc.name} is being prepared for download.`,
    });

    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `${doc.name} has been downloaded.`,
        variant: "success",
      });
    }, 1500);
  };

  return (
    <div className="container mx-auto p-6 bg-white">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Carrier Document Center</h1>
            <p className="text-gray-500 mt-1">
              Access and manage your company documents
            </p>
          </div>
          <Button onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </TabsTrigger>
            <TabsTrigger value="guides" className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Guides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Documents</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search documents..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
                <CardDescription>
                  Manage your company's required documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <h3 className="font-medium">{doc.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{doc.type}</span>
                              <span>•</span>
                              <span>{doc.uploadDate}</span>
                              <span>•</span>
                              <span>{doc.size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(doc.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No documents found matching your search.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Documents required for your carrier account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileCheck className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">Insurance Certificate</h3>
                        <p className="text-sm text-gray-500">
                          Liability and Cargo Insurance
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      VERIFIED
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileCheck className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">DOT Operating Authority</h3>
                        <p className="text-sm text-gray-500">
                          MC Number Verification
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      VERIFIED
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileCheck className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h3 className="font-medium">W-9 Form</h3>
                        <p className="text-sm text-gray-500">
                          Tax Identification
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      PENDING
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
                <CardDescription>
                  Get help with document requirements and uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">
                        Document Requirements
                      </h3>
                      <p className="mt-2 text-gray-600">
                        As a carrier, you are required to maintain several
                        documents to operate legally and participate in our
                        platform. These include:
                      </p>
                      <ul className="mt-2 space-y-2 list-disc pl-5 text-gray-600">
                        <li>
                          <strong>Insurance Certificate</strong> - Must show at
                          least $1,000,000 in liability and $100,000 in cargo
                          coverage
                        </li>
                        <li>
                          <strong>DOT Operating Authority</strong> - Your active
                          MC number documentation
                        </li>
                        <li>
                          <strong>W-9 Form</strong> - Required for payment
                          processing
                        </li>
                        <li>
                          <strong>Vehicle Registrations</strong> - For all
                          vehicles in your fleet
                        </li>
                        <li>
                          <strong>Driver Licenses</strong> - Commercial driver's
                          licenses for all drivers
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Document Statuses</h3>
                      <p className="mt-2 text-gray-600">
                        Your documents will have one of the following statuses:
                      </p>
                      <ul className="mt-2 space-y-2 list-disc pl-5 text-gray-600">
                        <li>
                          <strong>Verified</strong> - Document has been reviewed
                          and approved
                        </li>
                        <li>
                          <strong>Pending</strong> - Document has been uploaded
                          but is awaiting verification
                        </li>
                        <li>
                          <strong>Expired</strong> - Document has expired and
                          needs to be renewed
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">
                        Uploading Documents
                      </h3>
                      <p className="mt-2 text-gray-600">
                        To upload a new document:
                      </p>
                      <ol className="mt-2 space-y-2 list-decimal pl-5 text-gray-600">
                        <li>
                          Click the "Upload Document" button at the top of the
                          page
                        </li>
                        <li>Select the file from your computer</li>
                        <li>Choose the document type from the dropdown menu</li>
                        <li>Click "Upload" to submit the document</li>
                      </ol>
                      <p className="mt-2 text-gray-600">
                        Accepted file formats: PDF, JPG, PNG (max size: 10MB)
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Need Help?</h3>
                      <p className="mt-2 text-gray-600">
                        If you need assistance with document requirements or
                        have questions about the verification process, please
                        contact our support team:
                      </p>
                      <p className="mt-2 text-gray-600">
                        <strong>Email:</strong> carrier.support@example.com
                        <br />
                        <strong>Phone:</strong> (555) 123-4567
                        <br />
                        <strong>Hours:</strong> Monday-Friday, 8am-6pm EST
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides">
            <Card>
              <CardHeader>
                <CardTitle>Carrier Documentation Guides</CardTitle>
                <CardDescription>
                  Detailed guides for document requirements and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentationContent category="user-guide" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to your carrier profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                </div>
                {uploadFile && (
                  <p className="text-sm text-green-600">
                    Selected: {uploadFile.name} (
                    {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type</Label>
                <select
                  id="document-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                >
                  <option value="">Select document type</option>
                  <option value="Insurance">Insurance Certificate</option>
                  <option value="Legal">DOT Operating Authority</option>
                  <option value="Tax">W-9 Form</option>
                  <option value="Registration">Vehicle Registration</option>
                  <option value="License">Driver's License</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadFile(null);
                setUploadType("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadSubmit}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import the Label component
import { Label } from "@/components/ui/label";
