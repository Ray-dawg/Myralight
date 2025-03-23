import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Package, Clock, CheckCircle } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
}

function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SimpleDashboard() {
  // Static data instead of using Convex query
  const metrics = [
    {
      title: "Total Loads",
      value: 324,
      icon: <Package className="h-5 w-5 text-blue-500" />,
      description: "All time",
    },
    {
      title: "Active Loads",
      value: 19,
      icon: <Truck className="h-5 w-5 text-yellow-500" />,
      description: "Assigned or in transit",
    },
    {
      title: "Completed Loads",
      value: 15,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      description: "Successfully delivered",
    },
    {
      title: "Average Rate",
      value: "$25.00",
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      description: "Per load",
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
          <Package className="h-4 w-4 mr-2" />
          Create Shipment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            description={metric.description}
          />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Loads</h2>
        <div className="text-center py-8">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No Loads Found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No shipments found. Create a new shipment to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
