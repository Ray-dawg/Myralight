import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

interface BolDocument {
  id: string;
  title: string;
  shipment_id: string;
  carrier: string;
  driver: string;
  status: "pending" | "uploaded" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
  origin: string;
  destination: string;
}

export default function BolDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<BolDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<BolDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBolDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchQuery, activeTab, documents]);

  const fetchBolDocuments = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from your API or Supabase
      // For demo purposes, we're creating mock data
      const mockDocuments: BolDocument[] = [
        {
          id: "BOL-2024-001",
          title: "Bill of Lading - SHP-2024-001",
          shipment_id: "SHP-2024-001",
          carrier: "FastFreight Inc.",
          driver: "John Smith",
          status: "uploaded",
          created_at: "2024-02-20T10:15:00Z",
          updated_at: "2024-02-20T10:15:00Z",
          origin: "Chicago, IL",
          destination: "Milwaukee, WI",
        },
        {
          id: "BOL-2024-002",
          title: "Bill of Lading - SHP-2024-002",
          shipment_id: "SHP-2024-002",
          carrier: "FastFreight Inc.",
          driver: "John Smith",
          status: "pending",
          created_at: "2024-02-20T09:30:00Z",
          updated_at: "2024-02-20T09:30:00Z",
          origin: "Chicago, IL",
          destination: "Milwaukee, WI",
        },
        {
          id: "BOL-2024-003",
          title: "Bill of Lading - SHP-2024-003",
          shipment_id: "SHP-2024-003",
          carrier: "MidWest Logistics",
          driver: "Mike Johnson",
          status: "verified",
          created_at: "2024-02-18T14:45:00Z",
          updated_at: "2024-02-18T16:30:00Z",
          origin: "Milwaukee, WI",
          destination: "Minneapolis, MN",
        },
        {
          id: "BOL-2024-004",
          title: "Bill of Lading - SHP-2024-004",
          shipment_id: "SHP-2024-004",
          carrier: "MidWest Logistics",
          driver: "Mike Johnson",
          status: "verified",
          created_at: "2024-02-18T16:45:00Z",
          updated_at: "2024-02-18T18:20:00Z",
          origin: "Minneapolis, MN",
          destination: "Des Moines, IA",
        },
        {
          id: "BOL-2024-005",
          title: "Bill of Lading - SHP-2024-005",
          shipment_id: "SHP-2024-005",
          carrier: "Premier Transport",
          driver: "Sarah Williams",
          status: "rejected",
          created_at: "2024-02-17T11:30:00Z",
          updated_at: "2024-02-17T13:15:00Z",
          origin: "Des Moines, IA",
          destination: "Omaha, NE",
        },
      ];

      setDocuments(mockDocuments);
      setFilteredDocuments(mockDocuments);
    } catch (error) {
      console.error("Error fetching BOL documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((doc) => doc.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.id.toLowerCase().includes(query) ||
          doc.shipment_id.toLowerCase().includes(query) ||
          doc.carrier.toLowerCase().includes(query) ||
          doc.driver.toLowerCase().includes(query) ||
          doc.origin.toLowerCase().includes(query) ||
          doc.destination.toLowerCase().includes(query),
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getStatusBadge = (status: BolDocument["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      uploaded: "bg-blue-100 text-blue-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const icons = {
      pending: <Clock className="h-4 w-4 mr-2" />,
      uploaded: <FileText className="h-4 w-4 mr-2" />,
      verified: <CheckCircle className="h-4 w-4 mr-2" />,
      rejected: <AlertCircle className="h-4 w-4 mr-2" />,
    };

    const labels = {
      pending: "Pending",
      uploaded: "Uploaded",
      verified: "Verified",
      rejected: "Rejected",
    };

    return (
      <Badge className={`${styles[status]} flex items-center`}>
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  const exportDocuments = (format: string) => {
    // This would be implemented to export the document list
    console.log(`Exporting BOL documents as ${format}`);
    // In a real implementation, this would generate and download a file
  };

  return (
    <div className="container mx-auto p-6 bg-white">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">BOL Management</h1>
            <p className="text-gray-500 mt-1">
              Track and manage Bill of Lading documents
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
                <DropdownMenuItem onClick={() => exportDocuments("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocuments("csv")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocuments("excel")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search BOL documents..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("all")}
                >
                  All
                </Button>
                <Button
                  variant={activeTab === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={activeTab === "uploaded" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("uploaded")}
                >
                  Uploaded
                </Button>
                <Button
                  variant={activeTab === "verified" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("verified")}
                >
                  Verified
                </Button>
                <Button
                  variant={activeTab === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("rejected")}
                >
                  Rejected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading BOL documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No BOL documents found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search or filter
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">BOL ID</th>
                      <th className="py-3 px-4 text-left">Shipment ID</th>
                      <th className="py-3 px-4 text-left">Route</th>
                      <th className="py-3 px-4 text-left">Carrier</th>
                      <th className="py-3 px-4 text-left">Driver</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          navigate(`/shipper/documents/bol/${doc.id}`)
                        }
                      >
                        <td className="py-3 px-4">{doc.id}</td>
                        <td className="py-3 px-4">{doc.shipment_id}</td>
                        <td className="py-3 px-4">
                          {doc.origin} → {doc.destination}
                        </td>
                        <td className="py-3 px-4">{doc.carrier}</td>
                        <td className="py-3 px-4">{doc.driver}</td>
                        <td className="py-3 px-4">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/shipper/documents/bol/${doc.id}`);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>BOL Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total BOLs</p>
                    <p className="text-2xl font-bold">{documents.length}</p>
                  </div>
                  <div className="bg-gray-200 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600">Pending</p>
                    <p className="text-2xl font-bold">
                      {documents.filter((d) => d.status === "pending").length}
                    </p>
                  </div>
                  <div className="bg-yellow-200 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Uploaded</p>
                    <p className="text-2xl font-bold">
                      {documents.filter((d) => d.status === "uploaded").length}
                    </p>
                  </div>
                  <div className="bg-blue-200 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Verified</p>
                    <p className="text-2xl font-bold">
                      {documents.filter((d) => d.status === "verified").length}
                    </p>
                  </div>
                  <div className="bg-green-200 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
