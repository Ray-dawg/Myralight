import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  TrendingUp,
  Download,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const sampleMetrics = {
  totalShipments: 1234,
  onTimeDelivery: 94.5,
  avgCost: 325,
  totalSpend: 401250,
};

const sampleTrends = [
  { date: "Jan", shipments: 180, onTime: 170, cost: 310 },
  { date: "Feb", shipments: 220, onTime: 200, cost: 315 },
  { date: "Mar", shipments: 260, onTime: 245, cost: 305 },
  { date: "Apr", shipments: 240, onTime: 225, cost: 320 },
  { date: "May", shipments: 280, onTime: 265, cost: 325 },
  { date: "Jun", shipments: 300, onTime: 285, cost: 330 },
];

const MetricCard = ({ title, value, prefix = "", suffix = "", icon }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {prefix}
            {value?.toLocaleString()}
            {suffix}
          </p>
        </div>
        {icon}
      </div>
    </CardContent>
  </Card>
);

export default function ShippingReports() {
  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Reports</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="flex items-center">
            <Calendar className="mr-2" size={20} />
            Last 30 Days
            <ChevronDown className="ml-2" size={16} />
          </Button>
          <Button className="flex items-center">
            <Download className="mr-2" size={20} />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Shipments"
          value={sampleMetrics.totalShipments}
          icon={<BarChart2 className="text-purple-600" size={24} />}
        />
        <MetricCard
          title="On-Time Delivery"
          value={sampleMetrics.onTimeDelivery}
          suffix="%"
          icon={<TrendingUp className="text-green-600" size={24} />}
        />
        <MetricCard
          title="Average Cost"
          value={sampleMetrics.avgCost}
          prefix="$"
          icon={<BarChart2 className="text-blue-600" size={24} />}
        />
        <MetricCard
          title="Total Spend"
          value={sampleMetrics.totalSpend}
          prefix="$"
          icon={<BarChart2 className="text-orange-600" size={24} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipment Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fill: "#6B7280" }} />
                  <YAxis tick={{ fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="shipments"
                    fill="#9333ea"
                    name="Total Shipments"
                  />
                  <Bar dataKey="onTime" fill="#22c55e" name="On-Time" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fill: "#6B7280" }} />
                  <YAxis tick={{ fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                    name="Average Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
