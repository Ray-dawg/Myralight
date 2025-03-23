import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Search,
  LogOut,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  Filter,
  Download,
  History,
  MapPin,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const earnings = [
  { date: "2024-01", amount: 4500 },
  { date: "2024-02", amount: 5200 },
  { date: "2024-03", amount: 4800 },
  { date: "2024-04", amount: 6100 },
  { date: "2024-05", amount: 5800 },
  { date: "2024-06", amount: 6500 },
];

const recentLoads = [
  {
    id: "L-1234",
    from: "Chicago, IL",
    to: "Milwaukee, WI",
    earnings: 850,
    status: "completed",
    date: "2024-02-15",
    driver: "John Smith",
  },
  {
    id: "L-1235",
    from: "Milwaukee, WI",
    to: "Minneapolis, MN",
    earnings: 1200,
    status: "completed",
    date: "2024-02-14",
    driver: "Sarah Connor",
  },
  {
    id: "L-1236",
    from: "Minneapolis, MN",
    to: "Des Moines, IA",
    earnings: 750,
    status: "completed",
    date: "2024-02-13",
    driver: "Mike Johnson",
  },
];

export default function EarningsDashboard() {
  const [timeframe, setTimeframe] = useState("monthly");
  const [selectedDriver, setSelectedDriver] = useState("all");

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Earnings Dashboard</h1>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            Last updated: 5 mins ago
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Earnings (YTD)
                </p>
                <p className="text-2xl font-bold">$32,400</p>
                <div className="flex items-center text-green-500 text-sm mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12.5% from last year
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">$6,500</p>
                <div className="flex items-center text-green-500 text-sm mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +5.2% from last month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">
                  Average Per Load
                </p>
                <p className="text-2xl font-bold">$933</p>
                <div className="flex items-center text-sm mt-1">
                  <Package className="h-4 w-4 mr-1" />
                  35 loads this month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Next Payout</p>
                <p className="text-2xl font-bold">$2,850</p>
                <div className="flex items-center text-sm mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  Due in 2 days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Loads */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-8">
          <CardHeader>
            <CardTitle>Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earnings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoads.map((load) => (
                <div key={load.id} className="p-3 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{load.id}</span>
                    <Badge variant="secondary">${load.earnings}</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> {load.from} → {load.to}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <History className="h-3 w-3" /> {load.date}
                    </div>
                    <div className="text-xs text-gray-500">
                      Driver: {load.driver}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
