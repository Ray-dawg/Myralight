import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart2,
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Truck,
  Calendar,
  Filter,
  Users,
  Clock,
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
  AreaChart,
  Area,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 420000, target: 400000, ltl: 180000, ftl: 240000 },
  { month: "Feb", revenue: 440000, target: 420000, ltl: 190000, ftl: 250000 },
  { month: "Mar", revenue: 480000, target: 440000, ltl: 210000, ftl: 270000 },
  { month: "Apr", revenue: 520000, target: 460000, ltl: 230000, ftl: 290000 },
];

const operationalData = [
  { month: "Jan", utilization: 82, maintenance: 12000, fuel: 45000 },
  { month: "Feb", utilization: 85, maintenance: 8500, fuel: 47000 },
  { month: "Mar", utilization: 88, maintenance: 15000, fuel: 48000 },
  { month: "Apr", utilization: 86, maintenance: 9000, fuel: 46000 },
];

const MetricCard = ({
  title,
  value,
  trend,
  prefix = "$",
  subtitle,
  icon: Icon,
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-gray-400" />}
            <p className="text-gray-500 text-sm">{title}</p>
          </div>
          <h3 className="text-2xl font-bold mt-2">
            {prefix}
            {value.toLocaleString()}
          </h3>
          {trend && (
            <div
              className={`flex items-center mt-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {trend > 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="text-sm font-medium ml-1">
                {Math.abs(trend)}%
              </span>
            </div>
          )}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const FinancialDashboard = () => {
  const [timeframe, setTimeframe] = useState("monthly");
  const [region, setRegion] = useState("all");

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Financial Analytics</h1>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <span>Live Data</span>
            </div>
            <span className="mx-2">•</span>
            <span>Last update: 2 mins ago</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-lg border shadow-sm">
            <Button variant="ghost" className="text-sm h-9">
              {timeframe === "monthly" ? "Monthly" : "Weekly"}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-gray-200 my-auto" />
            <Button variant="ghost" className="text-sm h-9">
              {region === "all" ? "All Regions" : region}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue"
          value={520000}
          trend={12.5}
          icon={DollarSign}
          subtitle="Total revenue this month"
        />
        <MetricCard
          title="Gross Margin"
          value={31.5}
          trend={-2.1}
          prefix=""
          icon={TrendingUp}
          subtitle="Average across all loads"
        />
        <MetricCard
          title="Fleet Utilization"
          value={86}
          trend={3.2}
          prefix=""
          icon={Truck}
          subtitle="Active trucks: 42/48"
        />
        <MetricCard
          title="Operating Cash Flow"
          value={245000}
          trend={8.7}
          icon={BarChart2}
          subtitle="30-day rolling average"
        />
      </div>

      {/* Revenue Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Revenue Breakdown</CardTitle>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="ltl"
                    name="LTL Revenue"
                    stackId="a"
                    fill="#8b5cf6"
                  />
                  <Bar
                    dataKey="ftl"
                    name="FTL Revenue"
                    stackId="a"
                    fill="#c4b5fd"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Operational Metrics</CardTitle>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={operationalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="utilization"
                    name="Fleet Utilization %"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="maintenance"
                    name="Maintenance Cost"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fuel"
                    name="Fuel Cost"
                    stroke="#22c55e"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Top Performing Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { route: "Chicago → Detroit", revenue: 85000, growth: 12 },
                { route: "Milwaukee → Minneapolis", revenue: 72000, growth: 8 },
                { route: "Detroit → Cleveland", revenue: 68000, growth: 5 },
              ].map((route, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{route.route}</p>
                    <p className="text-sm text-gray-500">
                      ${route.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm ml-1">{route.growth}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Driver Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "John Smith", trips: 24, earnings: 12500 },
                { name: "Sarah Connor", trips: 22, earnings: 11800 },
                { name: "Mike Johnson", trips: 20, earnings: 10900 },
              ].map((driver, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-gray-500">
                      {driver.trips} trips
                    </p>
                  </div>
                  <p className="font-medium">
                    ${driver.earnings.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: "Fuel", amount: 145000, percentage: 35 },
                { category: "Maintenance", amount: 82000, percentage: 20 },
                { category: "Insurance", amount: 62000, percentage: 15 },
              ].map((cost, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <p className="font-medium">{cost.category}</p>
                    <p className="text-gray-500">
                      ${cost.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${cost.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDashboard;
