import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  DollarSign,
  Ban,
  UserCheck,
  AlertTriangle,
  Clock,
  CreditCard,
  Tag,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: "active" | "suspended" | "banned";
  subscription: {
    plan: string;
    status: "active" | "past_due" | "canceled";
    amount: number;
    nextBilling?: string;
  };
  balance: number;
  lastPayment?: {
    amount: number;
    date: string;
    status: "successful" | "failed";
  };
  discounts?: {
    code: string;
    amount: number;
    expires?: string;
  }[];
}

export default function UserFinancialManagement() {
  const [users] = useState<User[]>([
    {
      id: "USR-001",
      name: "FastFreight Logistics",
      email: "billing@fastfreight.com",
      company: "FastFreight Inc.",
      role: "carrier",
      status: "active",
      subscription: {
        plan: "Enterprise",
        status: "active",
        amount: 299,
        nextBilling: "2024-03-15",
      },
      balance: 2500,
      lastPayment: {
        amount: 299,
        date: "2024-02-15",
        status: "successful",
      },
      discounts: [
        {
          code: "ENTERPRISE20",
          amount: 20,
          expires: "2024-12-31",
        },
      ],
    },
    {
      id: "USR-002",
      name: "Global Shipping Co",
      email: "accounts@globalshipping.com",
      company: "Global Shipping",
      role: "shipper",
      status: "active",
      subscription: {
        plan: "Professional",
        status: "past_due",
        amount: 199,
        nextBilling: "2024-02-28",
      },
      balance: -150,
      lastPayment: {
        amount: 199,
        date: "2024-01-28",
        status: "failed",
      },
    },
  ]);

  const getStatusBadge = (status: User["status"]) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-yellow-100 text-yellow-800",
      banned: "bg-red-100 text-red-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  const getSubscriptionBadge = (status: User["subscription"]["status"]) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      past_due: "bg-yellow-100 text-yellow-800",
      canceled: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={styles[status]}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Financial Management</h1>
          <p className="text-gray-500 mt-1">
            Manage user subscriptions, payments, and financial status
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search users..." className="pl-10" />
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
        {users.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{user.name}</h3>
                    {getStatusBadge(user.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {user.email} • {user.company}
                  </p>
                </div>
                <div className="flex gap-2">
                  {user.status === "active" ? (
                    <Button variant="outline" size="sm">
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Reinstate
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Subscription Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Subscription</h4>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Plan</span>
                      <span className="font-medium">
                        {user.subscription.plan}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status</span>
                      {getSubscriptionBadge(user.subscription.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-medium">
                        ${user.subscription.amount}/mo
                      </span>
                    </div>
                    {user.subscription.nextBilling && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <Clock className="h-4 w-4" />
                        Next billing: {user.subscription.nextBilling}
                      </div>
                    )}
                  </div>
                </div>

                {/* Balance & Payments */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Balance & Payments</h4>
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Current Balance</span>
                      <span
                        className={`font-medium ${user.balance < 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        ${Math.abs(user.balance)}
                      </span>
                    </div>
                    {user.lastPayment && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-500">Last Payment</p>
                        <div className="flex justify-between items-center mt-2">
                          <span>${user.lastPayment.amount}</span>
                          <Badge
                            variant={
                              user.lastPayment.status === "successful"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {user.lastPayment.status}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Discounts */}
                {user.discounts && user.discounts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Active Discounts</h4>
                    <div className="p-4 border rounded-lg space-y-4">
                      {user.discounts.map((discount, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{discount.code}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-green-600">
                              {discount.amount}% off
                            </span>
                            {discount.expires && (
                              <p className="text-xs text-gray-500">
                                Expires: {discount.expires}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
