import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Truck,
  Package,
  X,
  Plus,
} from "lucide-react";

interface Claim {
  id: string;
  type: "damage" | "payment" | "service" | "other";
  status: "open" | "in_review" | "resolved" | "rejected";
  title: string;
  description: string;
  amount?: number;
  submittedDate: string;
  lastUpdatedDate: string;
  priority: "high" | "medium" | "low";
  relatedShipment?: string;
  assignedTo?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    uploadedDate: string;
    fileSize: string;
    fileUrl: string;
  }>;
  resolutionSteps?: Array<{
    id: string;
    date: string;
    action: string;
    user: string;
    notes?: string;
  }>;
  resolution?: {
    date: string;
    outcome: string;
    compensationAmount?: number;
  };
}

export default function ClaimsManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    dateRange: {
      from: "",
      to: "",
    },
  });

  // New claim form state
  const [newClaim, setNewClaim] = useState({
    title: "",
    description: "",
    type: "damage",
    priority: "medium",
    amount: "",
    relatedShipment: "",
    documents: [] as File[],
  });

  const [claims, setClaims] = useState<Claim[]>([
    {
      id: "CLM-2024-001",
      type: "damage",
      status: "open",
      title: "Cargo Damage During Transit",
      description:
        "Significant damage to electronics shipment due to improper handling",
      amount: 5000,
      submittedDate: "2024-02-15",
      lastUpdatedDate: "2024-02-16",
      priority: "high",
      relatedShipment: "SHP-2024-156",
      assignedTo: "Claims Dept",
      documents: [
        {
          id: "doc1",
          name: "Damage Photos.zip",
          type: "Evidence",
          uploadedDate: "2024-02-15",
          fileSize: "15.2 MB",
          fileUrl: "https://example.com/documents/damage_photos.zip",
        },
        {
          id: "doc2",
          name: "Bill of Lading.pdf",
          type: "Shipping Document",
          uploadedDate: "2024-02-15",
          fileSize: "1.8 MB",
          fileUrl: "https://example.com/documents/bill_of_lading.pdf",
        },
      ],
      resolutionSteps: [
        {
          id: "step1",
          date: "2024-02-16",
          action: "Claim Received",
          user: "System",
          notes: "Claim has been received and is pending review.",
        },
      ],
    },
    {
      id: "CLM-2024-002",
      type: "payment",
      status: "in_review",
      title: "Late Payment Dispute",
      description: "Payment overdue by 45 days for completed delivery",
      amount: 2500,
      submittedDate: "2024-02-10",
      lastUpdatedDate: "2024-02-14",
      priority: "medium",
      relatedShipment: "SHP-2024-142",
      documents: [
        {
          id: "doc3",
          name: "Invoice.pdf",
          type: "Financial",
          uploadedDate: "2024-02-10",
          fileSize: "0.8 MB",
          fileUrl: "https://example.com/documents/invoice.pdf",
        },
      ],
      resolutionSteps: [
        {
          id: "step2",
          date: "2024-02-10",
          action: "Claim Received",
          user: "System",
          notes: "Claim has been received and is pending review.",
        },
        {
          id: "step3",
          date: "2024-02-14",
          action: "Under Review",
          user: "John Smith",
          notes: "Reviewing payment records and contacting finance department.",
        },
      ],
    },
    {
      id: "CLM-2024-003",
      type: "service",
      status: "resolved",
      title: "Delivery Delay Compensation",
      description: "24-hour delay due to weather conditions",
      amount: 800,
      submittedDate: "2024-02-05",
      lastUpdatedDate: "2024-02-12",
      priority: "low",
      relatedShipment: "SHP-2024-138",
      documents: [
        {
          id: "doc5",
          name: "Delivery Schedule.pdf",
          type: "Shipping Document",
          uploadedDate: "2024-01-28",
          fileSize: "0.9 MB",
          fileUrl: "https://example.com/documents/delivery_schedule.pdf",
        },
      ],
      resolutionSteps: [
        {
          id: "step4",
          date: "2024-02-05",
          action: "Claim Received",
          user: "System",
          notes: "Claim has been received and is pending review.",
        },
        {
          id: "step5",
          date: "2024-02-08",
          action: "Under Review",
          user: "Sarah Johnson",
          notes:
            "Reviewing delivery records and weather conditions during transit.",
        },
        {
          id: "step6",
          date: "2024-02-12",
          action: "Resolved",
          user: "Sarah Johnson",
          notes:
            "Claim approved for partial compensation due to weather-related delays.",
        },
      ],
      resolution: {
        date: "2024-02-12",
        outcome: "Approved - Partial Compensation",
        compensationAmount: 800,
      },
    },
  ]);

  const getStatusBadge = (status: Claim["status"]) => {
    const styles = {
      open: "bg-yellow-100 text-yellow-800",
      in_review: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const labels = {
      open: "Open",
      in_review: "In Review",
      resolved: "Resolved",
      rejected: "Rejected",
    };

    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: Claim["priority"]) => {
    const styles = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={styles[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </Badge>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewClaim({
        ...newClaim,
        documents: [...newClaim.documents, ...filesArray],
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setNewClaim({
      ...newClaim,
      documents: newClaim.documents.filter((_, i) => i !== index),
    });
  };

  const handleCreateClaim = () => {
    if (!newClaim.title || !newClaim.description || !newClaim.relatedShipment) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission process
    setTimeout(() => {
      const newClaimObj: Claim = {
        id: `CLM-2024-${(claims.length + 1).toString().padStart(3, "0")}`,
        title: newClaim.title,
        description: newClaim.description,
        type: newClaim.type as Claim["type"],
        status: "open",
        priority: newClaim.priority as Claim["priority"],
        amount: parseFloat(newClaim.amount) || 0,
        submittedDate: new Date().toISOString().split("T")[0],
        lastUpdatedDate: new Date().toISOString().split("T")[0],
        relatedShipment: newClaim.relatedShipment,
        documents: newClaim.documents.map((file, index) => ({
          id: `doc${claims.length + index + 1}`,
          name: file.name,
          type: file.type.includes("image")
            ? "Evidence"
            : "Supporting Document",
          uploadedDate: new Date().toISOString().split("T")[0],
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          fileUrl: URL.createObjectURL(file),
        })),
        resolutionSteps: [
          {
            id: `step${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString().split("T")[0],
            action: "Claim Received",
            user: "System",
            notes: "Claim has been received and is pending review.",
          },
        ],
      };

      setClaims([newClaimObj, ...claims]);
      setIsSubmitting(false);
      setShowNewClaimDialog(false);
      setNewClaim({
        title: "",
        description: "",
        type: "damage",
        priority: "medium",
        amount: "",
        relatedShipment: "",
        documents: [],
      });

      toast({
        title: "Claim Submitted",
        description: `Claim #${newClaimObj.id} has been submitted successfully.`,
        variant: "success",
      });
    }, 2000);
  };

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowDetailsDialog(true);
  };

  const handleExport = (format: string, claimId?: string) => {
    const exportMessage = claimId
      ? `Exporting claim #${claimId} as ${format.toUpperCase()}`
      : `Exporting all claims as ${format.toUpperCase()}`;

    toast({
      title: "Exporting Data",
      description: exportMessage,
    });

    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Data has been exported as ${format.toUpperCase()}.`,
        variant: "success",
      });
    }, 1500);
  };

  const handleDownloadDocument = (document: Claim["documents"][0]) => {
    toast({
      title: "Downloading Document",
      description: `${document.name} is being prepared for download.`,
    });

    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `${document.name} has been downloaded.`,
        variant: "success",
      });
    }, 1500);
  };

  const applyFilters = () => {
    setShowFilterPopover(false);
    toast({
      title: "Filters Applied",
      description: "Claims list has been filtered according to your criteria.",
      variant: "success",
    });
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      dateRange: {
        from: "",
        to: "",
      },
    });
    setShowFilterPopover(false);
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
      variant: "success",
    });
  };

  // Filter claims based on search query and filters
  const filteredClaims = claims.filter((claim) => {
    // Search query filter
    const matchesSearch =
      !searchQuery ||
      claim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (claim.relatedShipment &&
        claim.relatedShipment
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = !filters.status || claim.status === filters.status;

    // Priority filter
    const matchesPriority =
      !filters.priority || claim.priority === filters.priority;

    // Date range filter
    const matchesDateRange = () => {
      if (!filters.dateRange.from && !filters.dateRange.to) return true;

      const claimDate = new Date(claim.submittedDate);
      const fromDate = filters.dateRange.from
        ? new Date(filters.dateRange.from)
        : null;
      const toDate = filters.dateRange.to
        ? new Date(filters.dateRange.to)
        : null;

      if (fromDate && toDate) {
        return claimDate >= fromDate && claimDate <= toDate;
      } else if (fromDate) {
        return claimDate >= fromDate;
      } else if (toDate) {
        return claimDate <= toDate;
      }

      return true;
    };

    return (
      matchesSearch && matchesStatus && matchesPriority && matchesDateRange()
    );
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Claims Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all claims and disputes
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </motion.div>
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

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowNewClaimDialog(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Claim
            </Button>
          </motion.div>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search claims..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Popover
              open={showFilterPopover}
              onOpenChange={setShowFilterPopover}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Claims</h4>

                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
                      }
                    >
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority-filter">Priority</Label>
                    <Select
                      value={filters.priority}
                      onValueChange={(value) =>
                        setFilters({ ...filters, priority: value })
                      }
                    >
                      <SelectTrigger id="priority-filter">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Priorities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="date-from" className="text-xs">
                          From
                        </Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={filters.dateRange.from}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              dateRange: {
                                ...filters.dateRange,
                                from: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="date-to" className="text-xs">
                          To
                        </Label>
                        <Input
                          id="date-to"
                          type="date"
                          value={filters.dateRange.to}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              dateRange: {
                                ...filters.dateRange,
                                to: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button size="sm" onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{claim.id}</h3>
                        {getStatusBadge(claim.status)}
                        {getPriorityBadge(claim.priority)}
                      </div>
                      <p className="text-lg font-medium mt-2">{claim.title}</p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="z-10"
                    >
                      <Button
                        variant="outline"
                        onClick={() => handleViewDetails(claim)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium shadow-sm"
                      >
                        View Details
                      </Button>
                    </motion.div>
                  </div>

                  <p className="text-gray-600">{claim.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-medium">
                        ${claim.amount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Submitted</p>
                      <p className="font-medium">{claim.submittedDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium">{claim.lastUpdatedDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Related Shipment</p>
                      <p className="font-medium">{claim.relatedShipment}</p>
                    </div>
                  </div>

                  {claim.status === "open" && (
                    <div className="flex items-center gap-2 text-yellow-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Requires immediate attention
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No claims found matching your search criteria.
              </p>
              {(searchQuery ||
                filters.status ||
                filters.priority ||
                filters.dateRange.from ||
                filters.dateRange.to) && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    resetFilters();
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* New Claim Dialog */}
      <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Claim</DialogTitle>
            <DialogDescription>
              Fill in the details to submit a new claim.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="claim-title">Claim Title *</Label>
              <Input
                id="claim-title"
                placeholder="e.g., Cargo Damage During Transit"
                value={newClaim.title}
                onChange={(e) =>
                  setNewClaim({ ...newClaim, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claim-description">Description *</Label>
              <Textarea
                id="claim-description"
                placeholder="Provide a detailed description of the claim..."
                rows={4}
                value={newClaim.description}
                onChange={(e) =>
                  setNewClaim({ ...newClaim, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="claim-type">Claim Type</Label>
                <Select
                  value={newClaim.type}
                  onValueChange={(value) =>
                    setNewClaim({ ...newClaim, type: value })
                  }
                >
                  <SelectTrigger id="claim-type">
                    <SelectValue placeholder="Select claim type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-priority">Priority</Label>
                <Select
                  value={newClaim.priority}
                  onValueChange={(value) =>
                    setNewClaim({ ...newClaim, priority: value })
                  }
                >
                  <SelectTrigger id="claim-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="claim-amount">Amount ($)</Label>
                <Input
                  id="claim-amount"
                  type="number"
                  placeholder="0.00"
                  value={newClaim.amount}
                  onChange={(e) =>
                    setNewClaim({ ...newClaim, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="related-shipment">Related Shipment ID *</Label>
                <Input
                  id="related-shipment"
                  placeholder="e.g., SHP-2024-123"
                  value={newClaim.relatedShipment}
                  onChange={(e) =>
                    setNewClaim({
                      ...newClaim,
                      relatedShipment: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="claim-documents">Supporting Documents</Label>
              <Input
                id="claim-documents"
                type="file"
                multiple
                onChange={handleFileChange}
              />
              {newClaim.documents.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-medium">Selected Files:</p>
                  <div className="max-h-32 overflow-y-auto">
                    {newClaim.documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{file.name}</span>
                          <span className="text-gray-400 text-xs">
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewClaimDialog(false);
                setNewClaim({
                  title: "",
                  description: "",
                  type: "damage",
                  priority: "medium",
                  amount: "",
                  relatedShipment: "",
                  documents: [],
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClaim}
              disabled={isSubmitting}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                "Submit Claim"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 sm:slide-in-from-bottom-0 duration-300">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              {selectedClaim?.id} - {selectedClaim?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="py-4 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    {getStatusBadge(selectedClaim.status)}
                    {getPriorityBadge(selectedClaim.priority)}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleExport("pdf", selectedClaim.id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("csv", selectedClaim.id)}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{selectedClaim.title}</h3>
                <p className="text-gray-600">{selectedClaim.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Amount</p>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">
                      {selectedClaim.amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{selectedClaim.submittedDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">
                      {selectedClaim.lastUpdatedDate}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Related Shipment</p>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">
                      {selectedClaim.relatedShipment}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              {selectedClaim.documents &&
                selectedClaim.documents.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Supporting Documents</h4>
                    <div className="space-y-3">
                      {selectedClaim.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{doc.type}</span>
                                <span>•</span>
                                <span>{doc.fileSize}</span>
                                <span>•</span>
                                <span>Uploaded: {doc.uploadedDate}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                                onClick={() => {
                                  // In a real app, this would open the document viewer
                                  toast({
                                    title: "Viewing Document",
                                    description: `Opening ${doc.name} in document viewer.`,
                                  });
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Resolution Steps */}
              {selectedClaim.resolutionSteps &&
                selectedClaim.resolutionSteps.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Resolution Progress</h4>
                    <div className="space-y-4">
                      {selectedClaim.resolutionSteps.map((step, index) => (
                        <div key={step.id} className="relative pl-6 pb-4">
                          {/* Timeline connector */}
                          {index <
                            (selectedClaim.resolutionSteps?.length || 0) -
                              1 && (
                            <div className="absolute left-[0.9375rem] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <div className="h-2.5 w-2.5 rounded-full bg-blue-600"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium">{step.action}</p>
                                <p className="text-sm text-gray-500">
                                  {step.date}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                By: {step.user}
                              </p>
                              {step.notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {step.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Resolution Details (if resolved) */}
              {selectedClaim.status === "resolved" &&
                selectedClaim.resolution && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Resolution</h4>
                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">
                            {selectedClaim.resolution.outcome}
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            Resolved on: {selectedClaim.resolution.date}
                          </p>
                          {selectedClaim.resolution.compensationAmount !==
                            undefined && (
                            <p className="text-sm font-medium text-green-700 mt-2">
                              Compensation Amount: $
                              {selectedClaim.resolution.compensationAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
