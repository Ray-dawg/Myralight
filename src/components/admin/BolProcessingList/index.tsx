import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Mock data for BOL transmissions
const mockTransmissions = [
  {
    id: "BOL-1001",
    documentId: "DOC-5678",
    customerName: "Acme Logistics",
    sentDate: "2023-06-15T14:30:00",
    status: "delivered",
    recipient: "billing@acmelogistics.com",
    amount: 1250.75,
    paymentStatus: "paid",
  },
  {
    id: "BOL-1002",
    documentId: "DOC-5679",
    customerName: "Global Transport Inc.",
    sentDate: "2023-06-15T15:45:00",
    status: "delivered",
    recipient: "ap@globaltransport.com",
    amount: 876.5,
    paymentStatus: "pending",
  },
  {
    id: "BOL-1003",
    documentId: "DOC-5680",
    customerName: "FastFreight Services",
    sentDate: "2023-06-16T09:15:00",
    status: "failed",
    recipient: "accounting@fastfreight.com",
    amount: 2340.0,
    paymentStatus: "failed",
  },
  {
    id: "BOL-1004",
    documentId: "DOC-5681",
    customerName: "Reliable Shipping Co.",
    sentDate: "2023-06-16T11:30:00",
    status: "processing",
    recipient: "finance@reliableshipping.com",
    amount: 1875.25,
    paymentStatus: "processing",
  },
  {
    id: "BOL-1005",
    documentId: "DOC-5682",
    customerName: "Express Cargo LLC",
    sentDate: "2023-06-17T10:00:00",
    status: "delivered",
    recipient: "payments@expresscargo.com",
    amount: 945.0,
    paymentStatus: "paid",
  },
];

type Transmission = (typeof mockTransmissions)[0];

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "delivered":
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" /> Delivered
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-500">
          <Clock className="w-3 h-3 mr-1" /> Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-500">
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      );
    default:
      return <Badge className="bg-gray-500">Unknown</Badge>;
  }
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" /> Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-500">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-500">
          <RefreshCw className="w-3 h-3 mr-1" /> Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-500">
          <AlertCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      );
    default:
      return <Badge className="bg-gray-500">Unknown</Badge>;
  }
};

const TransmissionDetails = ({
  transmission,
}: {
  transmission: Transmission;
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium">BOL ID</h3>
          <p>{transmission.id}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Document ID</h3>
          <p>{transmission.documentId}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Customer</h3>
          <p>{transmission.customerName}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Recipient</h3>
          <p>{transmission.recipient}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Sent Date</h3>
          <p>{new Date(transmission.sentDate).toLocaleString()}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Amount</h3>
          <p>${transmission.amount.toFixed(2)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Email Status</h3>
          <p>
            <StatusBadge status={transmission.status} />
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Payment Status</h3>
          <p>
            <PaymentStatusBadge status={transmission.paymentStatus} />
          </p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-sm font-medium mb-2">Actions</h3>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function BolProcessingList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedTransmission, setSelectedTransmission] =
    useState<Transmission | null>(null);

  // Filter transmissions based on search and filters
  const filteredTransmissions = mockTransmissions.filter((transmission) => {
    const matchesSearch =
      transmission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transmission.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transmission.documentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || transmission.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || transmission.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">BOL Transmission History</h1>

      <Card>
        <CardHeader>
          <CardTitle>Transmission Records</CardTitle>
          <CardDescription>
            View and manage all Bill of Lading document transmissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by ID, customer, or document..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BOL ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransmissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-gray-500"
                    >
                      No transmissions found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransmissions.map((transmission) => (
                    <TableRow key={transmission.id}>
                      <TableCell className="font-medium">
                        {transmission.id}
                      </TableCell>
                      <TableCell>{transmission.customerName}</TableCell>
                      <TableCell>
                        {new Date(transmission.sentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={transmission.status} />
                      </TableCell>
                      <TableCell>${transmission.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge
                          status={transmission.paymentStatus}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setSelectedTransmission(transmission)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Transmission Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about BOL transmission{" "}
                                {transmission.id}
                              </DialogDescription>
                            </DialogHeader>
                            <TransmissionDetails transmission={transmission} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {filteredTransmissions.length} of{" "}
              {mockTransmissions.length} transmissions
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
