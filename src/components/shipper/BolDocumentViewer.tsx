import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Printer,
  Share2,
} from "lucide-react";
import DocumentCenter from "../shared/DocumentCenter";

interface BolDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "uploaded" | "verified" | "rejected";
  shipment_id: string;
  comments?: string;
}

export default function BolDocumentViewer() {
  const { bolId } = useParams<{ bolId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<BolDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("document");

  useEffect(() => {
    if (bolId) {
      fetchBolDocument(bolId);
    }
  }, [bolId]);

  const fetchBolDocument = async (id: string) => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .eq("category", "bol")
        .single();

      if (error) {
        console.error("Error fetching BOL document:", error);
        // Fall back to mock data if there's an error
        const mockDocument: BolDocument = {
          id,
          title: `Bill of Lading - ${id}`,
          description: "Official Bill of Lading document for shipment",
          content: `<div class="bol-document">
            <h2>BILL OF LADING</h2>
            <p><strong>BOL Number:</strong> ${id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Shipment ID:</strong> SHP-2024-001</p>
            <p><strong>Carrier:</strong> FastFreight Inc.</p>
            <p><strong>Driver:</strong> John Smith</p>
            <hr/>
            <h3>SHIPPER INFORMATION</h3>
            <p><strong>Company:</strong> ABC Manufacturing</p>
            <p><strong>Address:</strong> 123 Industrial Pkwy, Chicago, IL 60007</p>
            <p><strong>Contact:</strong> Jane Doe</p>
            <p><strong>Phone:</strong> (312) 555-1234</p>
            <hr/>
            <h3>CONSIGNEE INFORMATION</h3>
            <p><strong>Company:</strong> XYZ Distribution</p>
            <p><strong>Address:</strong> 456 Commerce Dr, Milwaukee, WI 53202</p>
            <p><strong>Contact:</strong> John Johnson</p>
            <p><strong>Phone:</strong> (414) 555-5678</p>
            <hr/>
            <h3>FREIGHT INFORMATION</h3>
            <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Weight (lbs)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Class</th>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">10</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Pallets of Industrial Equipment</td>
                <td style="border: 1px solid #ddd; padding: 8px;">15,000</td>
                <td style="border: 1px solid #ddd; padding: 8px;">70</td>
              </tr>
            </table>
            <hr/>
            <h3>SPECIAL INSTRUCTIONS</h3>
            <p>Handle with care. Delivery appointment required.</p>
            <hr/>
            <div style="margin-top: 30px;">
              <p><strong>Shipper Signature:</strong> ________________________</p>
              <p><strong>Driver Signature:</strong> ________________________</p>
              <p><strong>Date:</strong> ________________________</p>
            </div>
          </div>`,
          file_url: "/sample-bol.pdf",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "uploaded",
          shipment_id: "SHP-2024-001",
          comments: "Awaiting verification by receiver",
        };

        setDocument(mockDocument);
      } else {
        // Transform the data to match our BolDocument interface
        const bolDoc: BolDocument = {
          id: data.id,
          title: data.title,
          description: data.description || "Bill of Lading document",
          content: data.content,
          file_url: data.file_url,
          created_at: data.created_at,
          updated_at: data.updated_at,
          status: data.status || "uploaded",
          shipment_id: data.shipment_id || data.tags?.[0] || "Unknown",
          comments: data.comments,
        };

        setDocument(bolDoc);
      }
    } catch (error) {
      console.error("Error in BOL document fetch:", error);
      toast({
        title: "Error",
        description: "Failed to load the BOL document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyBol = async () => {
    if (document) {
      try {
        // Update in Supabase
        const { error } = await supabase
          .from("documents")
          .update({ status: "verified" })
          .eq("id", document.id);

        if (error) throw error;

        // Update local state
        setDocument({ ...document, status: "verified" });

        toast({
          title: "Success",
          description: "BOL document has been verified.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error verifying BOL:", error);
        toast({
          title: "Error",
          description: "Failed to verify the BOL document. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRejectBol = async () => {
    if (document) {
      try {
        // Update in Supabase
        const { error } = await supabase
          .from("documents")
          .update({ status: "rejected" })
          .eq("id", document.id);

        if (error) throw error;

        // Update local state
        setDocument({ ...document, status: "rejected" });

        toast({
          title: "Notice",
          description: "BOL document has been rejected.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error rejecting BOL:", error);
        toast({
          title: "Error",
          description: "Failed to reject the BOL document. Please try again.",
          variant: "destructive",
        });
      }
    }
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
      <Badge className={`${styles[status]} flex items-center px-3 py-1`}>
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 bg-white">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {document ? document.title : "BOL Document"}
              </h1>
              <p className="text-gray-500 mt-1">
                {document ? document.description : "Loading..."}
              </p>
            </div>
          </div>
          {document && (
            <div className="flex items-center space-x-2">
              {getStatusBadge(document.status)}
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="document">
              <FileText className="h-4 w-4 mr-2" />
              Document
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="related">
              <FileText className="h-4 w-4 mr-2" />
              Related Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-center items-center h-64">
                    <p>Loading document...</p>
                  </div>
                </CardContent>
              </Card>
            ) : document ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bill of Lading Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: document.content }}
                        />
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {document.status === "uploaded" && (
                          <>
                            <Button
                              className="w-full"
                              onClick={handleVerifyBol}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify Document
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full text-red-600"
                              onClick={handleRejectBol}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Document
                            </Button>
                          </>
                        )}
                        {document.status === "verified" && (
                          <div className="p-4 bg-green-50 rounded-md">
                            <p className="text-green-800 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              This document has been verified
                            </p>
                          </div>
                        )}
                        {document.status === "rejected" && (
                          <div className="p-4 bg-red-50 rounded-md">
                            <p className="text-red-800 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              This document has been rejected
                            </p>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <h3 className="font-medium mb-2">Document Details</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">BOL ID:</span>
                              <span>{document.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Shipment ID:
                              </span>
                              <span>{document.shipment_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Uploaded:</span>
                              <span>
                                {new Date(
                                  document.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Last Updated:
                              </span>
                              <span>
                                {new Date(
                                  document.updated_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {document.comments && (
                          <div className="pt-4 border-t">
                            <h3 className="font-medium mb-2">Comments</h3>
                            <p className="text-sm">{document.comments}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900">
                      Document Not Found
                    </h3>
                    <p className="text-gray-500 mt-2">
                      The requested BOL document could not be found
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate(-1)}
                    >
                      Go Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Document History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 bg-blue-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Document Uploaded</p>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleString()}
                      </p>
                      <p className="text-sm">
                        Driver John Smith uploaded the BOL
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 bg-yellow-100 p-2 rounded-full">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Pending Verification</p>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleString()}
                      </p>
                      <p className="text-sm">
                        Awaiting verification by receiver
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="related" className="mt-4">
            <DocumentCenter mode="bol" shipmentId={document?.shipment_id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
