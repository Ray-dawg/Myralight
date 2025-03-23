import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Search, Filter, Plus } from "lucide-react";

interface Load {
  id: string;
  status: "pending" | "active" | "completed" | "cancelled";
  origin: string;
  destination: string;
  carrier?: string;
  driver?: string;
  createdAt: string;
}

const LoadManagement = () => {
  const [loads, setLoads] = useState<Load[]>([
    {
      id: "LOAD-001",
      status: "active",
      origin: "Chicago, IL",
      destination: "Detroit, MI",
      carrier: "FastFreight Inc",
      driver: "John Doe",
      createdAt: new Date().toISOString(),
    },
    {
      id: "LOAD-002",
      status: "pending",
      origin: "Milwaukee, WI",
      destination: "Minneapolis, MN",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: Load["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Load Management</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Load
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search loads..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loads.map((load) => (
                <TableRow key={load.id}>
                  <TableCell className="font-medium">{load.id}</TableCell>
                  <TableCell>{getStatusBadge(load.status)}</TableCell>
                  <TableCell>{load.origin}</TableCell>
                  <TableCell>{load.destination}</TableCell>
                  <TableCell>{load.carrier || "—"}</TableCell>
                  <TableCell>{load.driver || "—"}</TableCell>
                  <TableCell>
                    {new Date(load.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default LoadManagement;
