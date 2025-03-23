import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Calendar,
  Tag,
  Upload,
  FileSpreadsheet,
  FilePlus,
  X,
  Check,
  AlertTriangle,
  Trash2,
  Edit,
  RefreshCw,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  owner: {
    name: string;
    role: string;
  };
  uploadDate: string;
  status: "verified" | "pending" | "expired";
  tags: string[];
  size: string;
}

export default function DocumentManager() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showDateRangeDialog, setShowDateRangeDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    status: "",
    type: "",
    owner: "",
  });

  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([
    "License",
    "Driver",
    "DOT",
    "Insurance",
    "Carrier",
    "Legal",
    "Vehicle",
    "Registration",
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "DOC-001",
      name: "Commercial Driver's License",
      type: "License",
      owner: {
        name: "John Smith",
        role: "Driver",
      },
      uploadDate: "2024-02-15",
      status: "verified",
      tags: ["License", "Driver", "DOT"],
      size: "2.4 MB",
    },
    {
      id: "DOC-002",
      name: "Insurance Certificate",
      type: "Insurance",
      owner: {
        name: "FastFreight Inc",
        role: "Carrier",
      },
      uploadDate: "2024-02-14",
      status: "pending",
      tags: ["Insurance", "Carrier", "Legal"],
      size: "1.8 MB",
    },
    {
      id: "DOC-003",
      name: "Vehicle Registration",
      type: "Registration",
      owner: {
        name: "Global Shipping",
        role: "Carrier",
      },
      uploadDate: "2024-02-13",
      status: "expired",
      tags: ["Vehicle", "Registration", "DOT"],
      size: "1.2 MB",
    },
  ]);

  const getStatusBadge = (status: Document["status"]) => {
    const styles = {
      verified: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  // Filter documents based on search query and filters
  const filteredDocuments = documents.filter((doc) => {
    // Search query filter
    const matchesSearch =
      searchQuery === "" ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      filterOptions.status === "" || doc.status === filterOptions.status;

    // Type filter
    const matchesType =
      filterOptions.type === "" || doc.type === filterOptions.type;

    // Owner filter
    const matchesOwner =
      filterOptions.owner === "" ||
      doc.owner.name.toLowerCase().includes(filterOptions.owner.toLowerCase());

    // Date range filter
    const matchesDateRange = () => {
      if (dateRange.from === "" && dateRange.to === "") return true;

      const docDate = new Date(doc.uploadDate);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;

      if (fromDate && toDate) {
        return docDate >= fromDate && docDate <= toDate;
      } else if (fromDate) {
        return docDate >= fromDate;
      } else if (toDate) {
        return docDate <= toDate;
      }

      return true;
    };

    // Tags filter
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => doc.tags.includes(tag));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesOwner &&
      matchesDateRange() &&
      matchesTags
    );
  });

  const handleExport = (format: string) => {
    toast({
      title: `Exporting Documents as ${format.toUpperCase()}`,
      description: "Your document list is being prepared for download.",
    });

    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Documents have been exported as ${format.toUpperCase()}.`,
        variant: "success",
      });
    }, 1500);
  };

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("");
  const [uploadTags, setUploadTags] = useState<string[]>([]);

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
      const newDoc: Document = {
        id: `DOC-00${documents.length + 1}`,
        name: uploadFile.name,
        type: uploadType,
        owner: {
          name: "Current User",
          role: "Admin",
        },
        uploadDate: new Date().toISOString().split("T")[0],
        status: "pending",
        tags: uploadTags.length > 0 ? uploadTags : ["New"],
        size: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
      };

      setDocuments([newDoc, ...documents]);
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadType("");
      setUploadTags([]);
    }, 2000);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterApply = () => {
    setShowFilterDialog(false);

    toast({
      title: "Filters Applied",
      description: "Documents filtered according to your criteria.",
      variant: "success",
    });
  };

  const handleDateRangeApply = () => {
    setShowDateRangeDialog(false);

    toast({
      title: "Date Range Applied",
      description: `Showing documents from ${dateRange.from || "any date"} to ${dateRange.to || "any date"}.`,
      variant: "success",
    });
  };

  const handleTagsApply = () => {
    setShowTagsDialog(false);

    toast({
      title: "Tags Filter Applied",
      description:
        selectedTags.length > 0
          ? `Showing documents with tags: ${selectedTags.join(", ")}.`
          : "Showing all documents regardless of tags.",
      variant: "success",
    });
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  const handleDownloadDocument = (doc: Document) => {
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

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowEditDialog(true);
  };

  const handleDeleteDocument = (doc: Document) => {
    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
      // Remove document from the list
      setDocuments(documents.filter((d) => d.id !== doc.id));

      toast({
        title: "Document Deleted",
        description: `${doc.name} has been deleted.`,
        variant: "success",
      });
    }
  };

  const handleUpdateStatus = (
    doc: Document,
    newStatus: "verified" | "pending" | "expired",
  ) => {
    // Update document status
    const updatedDocuments = documents.map((d) => {
      if (d.id === doc.id) {
        return { ...d, status: newStatus };
      }
      return d;
    });

    setDocuments(updatedDocuments);

    toast({
      title: "Status Updated",
      description: `${doc.name} status changed to ${newStatus.toUpperCase()}.`,
      variant: "success",
    });
  };

  const handleEditSubmit = () => {
    if (!selectedDocument) return;

    // In a real app, you would update the document here
    // For now, we'll just close the dialog
    setShowEditDialog(false);

    toast({
      title: "Document Updated",
      description: `${selectedDocument.name} has been updated.`,
      variant: "success",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Document Manager</h1>
          <p className="text-gray-500 mt-1">
            Manage and track all user documents
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterDialog(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDateRangeDialog(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagsDialog(true)}
            >
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-gray-500">{doc.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditDocument(doc)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Document
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Document
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(doc, "verified")}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Verified
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(doc, "pending")}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(doc, "expired")}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Mark as Expired
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Owner</p>
                    <p className="font-medium">{doc.owner.name}</p>
                    <p className="text-gray-500">{doc.owner.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Upload Date</p>
                    <p className="font-medium">{doc.uploadDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Size</p>
                    <p className="font-medium">{doc.size}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tags</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No documents found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setFilterOptions({ status: "", type: "", owner: "" });
                  setDateRange({ from: "", to: "" });
                  setSelectedTags([]);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Documents</DialogTitle>
            <DialogDescription>
              Apply filters to narrow down your document list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Document Status</Label>
                <select
                  id="status-filter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={filterOptions.status}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-filter">Document Type</Label>
                <select
                  id="type-filter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={filterOptions.type}
                  onChange={(e) =>
                    setFilterOptions({ ...filterOptions, type: e.target.value })
                  }
                >
                  <option value="">All Types</option>
                  <option value="License">License</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Registration">Registration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-filter">Owner</Label>
                <Input
                  id="owner-filter"
                  placeholder="Filter by owner name"
                  value={filterOptions.owner}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      owner: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFilterOptions({ status: "", type: "", owner: "" });
                setShowFilterDialog(false);
              }}
            >
              Reset
            </Button>
            <Button onClick={handleFilterApply}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Range Dialog */}
      <Dialog open={showDateRangeDialog} onOpenChange={setShowDateRangeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>
              Filter documents by upload date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from">From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({ from: "", to: "" });
                setShowDateRangeDialog(false);
              }}
            >
              Reset
            </Button>
            <Button onClick={handleDateRangeApply}>Apply Date Range</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter by Tags</DialogTitle>
            <DialogDescription>
              Select tags to filter documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              {availableTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTags([...selectedTags, tag]);
                      } else {
                        setSelectedTags(selectedTags.filter((t) => t !== tag));
                      }
                    }}
                  />
                  <Label htmlFor={`tag-${tag}`}>{tag}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTags([]);
                setShowTagsDialog(false);
              }}
            >
              Reset
            </Button>
            <Button onClick={handleTagsApply}>Apply Tags</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to the system.
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
                  <option value="License">License</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Registration">Registration</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Document Tags</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`upload-tag-${tag}`}
                        checked={uploadTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUploadTags([...uploadTags, tag]);
                          } else {
                            setUploadTags(uploadTags.filter((t) => t !== tag));
                          }
                        }}
                      />
                      <Label htmlFor={`upload-tag-${tag}`}>{tag}</Label>
                    </div>
                  ))}
                </div>
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
                setUploadTags([]);
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

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update document information.</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document-name">Document Name</Label>
                  <Input
                    id="document-name"
                    value={selectedDocument.name}
                    onChange={(e) =>
                      setSelectedDocument({
                        ...selectedDocument,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-document-type">Document Type</Label>
                  <select
                    id="edit-document-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedDocument.type}
                    onChange={(e) =>
                      setSelectedDocument({
                        ...selectedDocument,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="License">License</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Registration">Registration</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Contract">Contract</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Document Tags</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-tag-${tag}`}
                          checked={selectedDocument.tags.includes(tag)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDocument({
                                ...selectedDocument,
                                tags: [...selectedDocument.tags, tag],
                              });
                            } else {
                              setSelectedDocument({
                                ...selectedDocument,
                                tags: selectedDocument.tags.filter(
                                  (t) => t !== tag,
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`edit-tag-${tag}`}>{tag}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Sheet */}
      <Sheet open={showDocumentViewer} onOpenChange={setShowDocumentViewer}>
        <SheetContent className="sm:max-w-[640px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedDocument?.name}</SheetTitle>
            <SheetDescription>
              Document ID: {selectedDocument?.id}
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="font-medium">{selectedDocument?.type}</span>
              </div>
              {selectedDocument && getStatusBadge(selectedDocument.status)}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Document Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Owner</p>
                    <p className="font-medium">
                      {selectedDocument?.owner.name}
                    </p>
                    <p className="text-gray-500">
                      {selectedDocument?.owner.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Upload Date</p>
                    <p className="font-medium">
                      {selectedDocument?.uploadDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Size</p>
                    <p className="font-medium">{selectedDocument?.size}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tags</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDocument?.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-4">Document Preview</h4>
                <div className="bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    {selectedDocument?.status === "verified" ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Check className="h-4 w-4 text-green-500" />
                        Document verified and available for viewing
                      </span>
                    ) : selectedDocument?.status === "pending" ? (
                      <span className="flex items-center gap-2 justify-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Document is pending verification
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <X className="h-4 w-4 text-red-500" />
                        Document has expired and needs to be renewed
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedDocument?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setShowDocumentViewer(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                handleDownloadDocument(selectedDocument!);
                setShowDocumentViewer(false);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
