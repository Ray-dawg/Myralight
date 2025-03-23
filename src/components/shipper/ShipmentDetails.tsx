import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Clock,
  Package,
  Truck,
  Download,
  MessageCircle,
  AlertTriangle,
  ChevronLeft,
  Edit,
  Copy,
  FileText,
} from "lucide-react";

interface ShipmentMetrics {
  etaConfidence: number;
  costPerMile: number;
  co2Emissions: number;
  carrierScore: number;
}

interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: "pending" | "in_transit" | "delivered" | "cancelled";
  carrier?: string;
  driver?: string;
  pickupDate: string;
  deliveryDate: string;
  weight: string;
  type: string;
  rate: number;
  metrics?: ShipmentMetrics;
  estimatedArrival?: string;
  delayProbability?: number;
  weatherImpact?: "none" | "low" | "medium" | "high";
  specialInstructions?: string;
  documents?: { name: string; type: string; date: string }[];
  updates?: { time: string; message: string; status?: string }[];
}

export default function ShipmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    // Simulate API call to fetch shipment details
    setTimeout(() => {
      // Mock data for the shipment
      const mockShipment: Shipment = {
        id: id || "SHP-2024-001",
        origin: "Chicago, IL",
        destination: "Milwaukee, WI",
        status: "in_transit",
        carrier: "FastFreight Inc.",
        driver: "John Smith",
        pickupDate: "2024-02-20",
        deliveryDate: "2024-02-20",
        weight: "15,000 lbs",
        type: "Dry Van",
        rate: 850,
        metrics: {
          etaConfidence: 92,
          costPerMile: 2.8,
          co2Emissions: 450,
          carrierScore: 4.8,
        },
        estimatedArrival: "2024-02-20 15:30",
        delayProbability: 12,
        weatherImpact: "low",
        specialInstructions:
          "Handle with care. Requires liftgate for delivery.",
        documents: [
          { name: "Bill of Lading", type: "PDF", date: "2024-02-20" },
          { name: "Proof of Delivery", type: "PDF", date: "2024-02-20" },
          { name: "Insurance Certificate", type: "PDF", date: "2024-02-19" },
        ],
        updates: [
          {
            time: "2024-02-20 08:15",
            message: "Shipment picked up",
            status: "in_transit",
          },
          {
            time: "2024-02-20 07:30",
            message: "Driver en route to pickup location",
          },
          {
            time: "2024-02-19 16:45",
            message: "Carrier assigned",
            status: "assigned",
          },
          {
            time: "2024-02-19 14:30",
            message: "Shipment created",
            status: "pending",
          },
        ],
      };

      setShipment(mockShipment);
      setLoading(false);
    }, 1000);
  }, [id]);

  const getStatusBadge = (status: Shipment["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      in_transit: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const labels = {
      pending: "Pending",
      in_transit: "In Transit",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };

    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-pulse text-gray-500">
          Loading shipment details...
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700">
            Shipment not found
          </h2>
          <p className="text-gray-500 mt-2">
            The requested shipment could not be found.
          </p>
          <Button
            className="mt-6"
            onClick={() => navigate("/shipper/shipments")}
          >
            Return to Shipments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{shipment.id}</h1>
            {getStatusBadge(shipment.status)}
          </div>
          <p className="text-gray-500 mt-1">
            {shipment.type} • {shipment.weight}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex border-b space-x-6">
        <button
          className={`pb-2 font-medium ${activeTab === "details" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button
          className={`pb-2 font-medium ${activeTab === "documents" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>
        <button
          className={`pb-2 font-medium ${activeTab === "updates" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("updates")}
        >
          Updates
        </button>
      </div>

      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Origin</p>
                        <p className="font-medium">{shipment.origin}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <Clock className="h-3 w-3" />
                          {shipment.pickupDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <p className="font-medium">{shipment.destination}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <Clock className="h-3 w-3" />
                          {shipment.deliveryDate}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {shipment.carrier && (
                      <div>
                        <p className="text-sm text-gray-500">Carrier</p>
                        <p className="font-medium">{shipment.carrier}</p>
                      </div>
                    )}

                    {shipment.driver && (
                      <div>
                        <p className="text-sm text-gray-500">Driver</p>
                        <p className="font-medium">{shipment.driver}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500">Rate</p>
                      <p className="font-medium">${shipment.rate}</p>
                    </div>
                  </div>
                </div>

                {shipment.specialInstructions && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Special Instructions
                    </p>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {shipment.specialInstructions}
                    </div>
                  </div>
                )}

                {shipment.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Cost/Mile</p>
                      <p className="font-medium">
                        ${shipment.metrics.costPerMile}/mi
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Carrier Score</p>
                      <p className="font-medium">
                        {shipment.metrics.carrierScore}/5
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CO₂ Emissions</p>
                      <p className="font-medium">
                        {shipment.metrics.co2Emissions}kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ETA Confidence</p>
                      <p className="font-medium">
                        {shipment.metrics.etaConfidence}%
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message Carrier
              </Button>
              <Button className="flex-1">
                <Truck className="h-4 w-4 mr-2" />
                Track Shipment
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipment.estimatedArrival && (
                    <div>
                      <p className="text-sm text-gray-500">Estimated Arrival</p>
                      <p className="font-medium">
                        {new Date(shipment.estimatedArrival).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {shipment.delayProbability && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <p className="text-sm">
                        {shipment.delayProbability}% chance of delay
                      </p>
                    </div>
                  )}

                  {shipment.weatherImpact &&
                    shipment.weatherImpact !== "none" && (
                      <div className="p-3 bg-yellow-50 rounded-md flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800">
                            {shipment.weatherImpact.charAt(0).toUpperCase() +
                              shipment.weatherImpact.slice(1)}{" "}
                            Weather Impact
                          </p>
                          <p className="text-sm text-yellow-700">
                            Weather conditions may affect this shipment.
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center mt-4">
                    <p className="text-gray-500">Map view would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <Card>
          <CardHeader>
            <CardTitle>Shipment Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shipment.documents?.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.type} • {doc.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" className="w-full mt-4">
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "updates" && (
        <Card>
          <CardHeader>
            <CardTitle>Shipment Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {shipment.updates?.map((update, index) => (
                <div key={index} className="relative pl-6 pb-6">
                  {index !== shipment.updates!.length - 1 && (
                    <div className="absolute top-2 left-[9px] bottom-0 w-[1px] bg-gray-200" />
                  )}
                  <div className="absolute top-2 left-0 w-[18px] h-[18px] rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-[8px] h-[8px] rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{update.time}</p>
                    <p className="font-medium mt-1">{update.message}</p>
                    {update.status && (
                      <Badge className="mt-2" variant="outline">
                        Status: {update.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
