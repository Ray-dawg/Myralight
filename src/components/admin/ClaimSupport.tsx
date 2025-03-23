import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  MessageCircle,
} from "lucide-react";

interface Claim {
  id: string;
  type: "damage" | "delay" | "billing" | "other";
  status: "new" | "in_review" | "resolved" | "escalated";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  submittedBy: {
    name: string;
    role: string;
    company: string;
  };
  submittedAt: string;
  lastUpdated: string;
  amount?: number;
}

export default function ClaimSupport() {
  const [claims] = useState<Claim[]>([
    {
      id: "CLM-2024-001",
      type: "damage",
      status: "new",
      priority: "high",
      title: "Cargo Damage During Transit",
      description: "Significant damage to electronics shipment",
      submittedBy: {
        name: "John Smith",
        role: "Driver",
        company: "FastFreight Inc.",
      },
      submittedAt: "2024-02-20T10:30:00Z",
      lastUpdated: "2024-02-20T10:30:00Z",
      amount: 5000,
    },
    {
      id: "CLM-2024-002",
      type: "delay",
      status: "in_review",
      priority: "medium",
      title: "Delivery Delay Compensation",
      description: "24-hour delay due to weather conditions",
      submittedBy: {
        name: "Sarah Connor",
        role: "Shipper",
        company: "Tech Electronics",
      },
      submittedAt: "2024-02-19T15:45:00Z",
      lastUpdated: "2024-02-20T09:15:00Z",
      amount: 800,
    },
  ]);

  const getStatusBadge = (status: Claim["status"]) => {
    const styles = {
      new: "bg-blue-100 text-blue-800",
      in_review: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      escalated: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={styles[status]}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Claim["priority"]) => {
    const styles = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={styles[priority]}>
        {priority.toUpperCase()} PRIORITY
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Claim Support</h1>
          <p className="text-gray-500 mt-1">
            Manage and resolve user claims and disputes
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search claims..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {claims.map((claim) => (
          <Card key={claim.id} className="p-6">
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
                <Button variant="outline">View Details</Button>
              </div>

              <p className="text-gray-600">{claim.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Submitted By</p>
                  <p className="font-medium">{claim.submittedBy.name}</p>
                  <p className="text-gray-500">
                    {claim.submittedBy.role} at {claim.submittedBy.company}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium">
                    {new Date(claim.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {new Date(claim.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
                {claim.amount && (
                  <div>
                    <p className="text-gray-500">Claim Amount</p>
                    <p className="font-medium">
                      ${claim.amount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
                <Button variant="outline" size="sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
