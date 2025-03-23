import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Search,
  Download,
  FolderOpen,
  Tag,
  Clock,
  User,
  FileSpreadsheet,
  Filter,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  file_url?: string;
  created_at: string;
  updated_at: string;
  author: string;
  role: string;
}

interface DocumentCenterProps {
  mode?: "all" | "bol";
  shipmentId?: string;
}

export default function DocumentCenter({
  mode = "all",
  shipmentId,
}: DocumentCenterProps = {}) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeRole, setActiveRole] = useState("all");

  // Categories for the documentation
  const categories =
    mode === "bol"
      ? [
          { id: "all", name: "All BOL Documents" },
          { id: "pending", name: "Pending BOLs" },
          { id: "uploaded", name: "Uploaded BOLs" },
          { id: "verified", name: "Verified BOLs" },
          { id: "rejected", name: "Rejected BOLs" },
        ]
      : [
          { id: "all", name: "All Categories" },
          { id: "user-guide", name: "User Guides" },
          { id: "api", name: "API Reference" },
          { id: "data-model", name: "Data Models" },
          { id: "workflows", name: "Common Workflows" },
          { id: "troubleshooting", name: "Troubleshooting" },
          { id: "bol", name: "BOL Documents" },
        ];

  // Roles for filtering
  const roles = [
    { id: "all", name: "All Roles" },
    { id: "admin", name: "Admin" },
    { id: "shipper", name: "Shipper" },
    { id: "carrier", name: "Carrier" },
    { id: "driver", name: "Driver" },
    { id: "developer", name: "Developer" },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (
      searchQuery.trim() === "" &&
      activeCategory === "all" &&
      activeRole === "all"
    ) {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter((doc) => {
        const matchesSearch =
          searchQuery.trim() === "" ||
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.tags &&
            doc.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase()),
            ));

        const matchesCategory =
          activeCategory === "all" || doc.category === activeCategory;

        const matchesRole = activeRole === "all" || doc.role === activeRole;

        return matchesSearch && matchesCategory && matchesRole;
      });
      setFilteredDocuments(filtered);
    }
  }, [searchQuery, documents, activeCategory, activeRole]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters based on mode
      if (mode === "bol") {
        query = query.eq("category", "bol");

        // If shipmentId is provided, filter by that specific shipment
        if (shipmentId) {
          // In a real implementation, we would use a proper relationship
          // For now, we'll check if the shipmentId is in the tags array
          query = query.contains("tags", [shipmentId]);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Process the documents
        const processedDocs = data.map((doc) => {
          // Ensure tags is always an array
          if (!doc.tags) doc.tags = [];
          return doc as Document;
        });

        setDocuments(processedDocs);
        setFilteredDocuments(processedDocs);
        setSelectedDocument(processedDocs[0]);
      } else {
        // No documents found
        setDocuments([]);
        setFilteredDocuments([]);
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleRoleChange = (role: string) => {
    setActiveRole(role);
  };

  const downloadDocument = async (document: Document) => {
    if (document.file_url) {
      try {
        const { data, error } = await supabase.storage
          .from("documents")
          .download(document.file_url.split("/").pop() || "");

        if (error) throw error;

        // Create a download link
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = document.title + ".pdf";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error("Error downloading document:", error);
      }
    }
  };

  const exportDocuments = (format: string) => {
    // This would be implemented to export the document list
    console.log(`Exporting documents as ${format}`);
    // In a real implementation, this would generate and download a file
  };

  return (
    <div className="container mx-auto p-6 bg-white">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "bol" ? "BOL Document Center" : "Document Center"}
            </h1>
            <p className="text-gray-500 mt-1">
              {mode === "bol"
                ? "Access and manage Bill of Lading (BOL) documents"
                : "Access documentation, guides, and resources"}
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
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocuments("excel")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with categories and search */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {mode === "bol" ? "BOL Status" : "Categories"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={
                        activeCategory === category.id ? "default" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      {category.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Filter by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <Button
                      key={role.id}
                      variant={activeRole === role.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleRoleChange(role.id)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {role.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search documentation..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle section with document list */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  {filteredDocuments.length} document
                  {filteredDocuments.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <p>Loading documents...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No documents found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Try adjusting your search or category filter
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {filteredDocuments.map((doc) => (
                        <div key={doc.id}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start text-left ${selectedDocument?.id === doc.id ? "bg-gray-100" : ""}`}
                            onClick={() => handleDocumentSelect(doc)}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{doc.title}</span>
                              <span className="text-xs text-gray-500 mt-1 truncate w-full">
                                {doc.description}
                              </span>
                            </div>
                          </Button>
                          <Separator className="my-2" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right section with document content */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              {selectedDocument ? (
                <>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedDocument.title}</CardTitle>
                        <CardDescription>
                          {selectedDocument.description}
                        </CardDescription>
                      </div>
                      {selectedDocument.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(selectedDocument)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDocument.tags &&
                        selectedDocument.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </div>
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="content">
                      <TabsList>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      </TabsList>
                      <TabsContent value="content" className="mt-4">
                        <ScrollArea className="h-[400px]">
                          <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: selectedDocument.content,
                            }}
                          />
                        </ScrollArea>
                      </TabsContent>
                      <TabsContent value="metadata" className="mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 mr-2">
                              Author:
                            </span>
                            <span className="text-sm">
                              {selectedDocument.author}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 mr-2">
                              Created:
                            </span>
                            <span className="text-sm">
                              {new Date(
                                selectedDocument.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 mr-2">
                              Updated:
                            </span>
                            <span className="text-sm">
                              {new Date(
                                selectedDocument.updated_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FolderOpen className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 mr-2">
                              Category:
                            </span>
                            <span className="text-sm">
                              {selectedDocument.category}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 mr-2">
                              Intended for:
                            </span>
                            <span className="text-sm capitalize">
                              {selectedDocument.role}
                            </span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[600px] text-center p-6">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900">
                    No document selected
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Select a document from the list to view its content
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import the necessary components for the dropdown menu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
