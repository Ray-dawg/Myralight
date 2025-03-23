import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import {
  BarChart,
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Package,
  Clock,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  MapPin,
  Globe,
} from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [regionFilter, setRegionFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for different time periods
  const data = {
    monthly: {
      revenue: 125000,
      revenueChange: 12,
      loads: 450,
      loadsChange: 8,
      avgRate: 278,
      avgRateChange: 4,
      onTimeDelivery: 96,
      onTimeDeliveryChange: 2,
      fuelCost: 28500,
      fuelCostChange: -3,
      maintenanceCost: 12000,
      maintenanceCostChange: 5,
      topRoutes: [
        { route: "Chicago to Detroit", count: 45, revenue: 12600 },
        { route: "Detroit to Cleveland", count: 38, revenue: 9500 },
        { route: "Cleveland to Pittsburgh", count: 32, revenue: 8000 },
        { route: "Pittsburgh to Columbus", count: 28, revenue: 7000 },
        { route: "Columbus to Indianapolis", count: 25, revenue: 6250 },
      ],
      monthlyRevenue: [
        { month: "Jan", revenue: 110000 },
        { month: "Feb", revenue: 115000 },
        { month: "Mar", revenue: 108000 },
        { month: "Apr", revenue: 112000 },
        { month: "May", revenue: 118000 },
        { month: "Jun", revenue: 125000 },
      ],
    },
    quarterly: {
      revenue: 360000,
      revenueChange: 15,
      loads: 1350,
      loadsChange: 10,
      avgRate: 267,
      avgRateChange: 5,
      onTimeDelivery: 95,
      onTimeDeliveryChange: 1,
      fuelCost: 82000,
      fuelCostChange: -2,
      maintenanceCost: 35000,
      maintenanceCostChange: 3,
      topRoutes: [
        { route: "Chicago to Detroit", count: 135, revenue: 36450 },
        { route: "Detroit to Cleveland", count: 120, revenue: 30000 },
        { route: "Cleveland to Pittsburgh", count: 105, revenue: 26250 },
        { route: "Pittsburgh to Columbus", count: 90, revenue: 22500 },
        { route: "Columbus to Indianapolis", count: 75, revenue: 18750 },
      ],
      monthlyRevenue: [
        { month: "Q1", revenue: 330000 },
        { month: "Q2", revenue: 360000 },
        { month: "Q3", revenue: 0 },
        { month: "Q4", revenue: 0 },
      ],
    },
    yearly: {
      revenue: 1450000,
      revenueChange: 18,
      loads: 5200,
      loadsChange: 12,
      avgRate: 279,
      avgRateChange: 6,
      onTimeDelivery: 94,
      onTimeDeliveryChange: 3,
      fuelCost: 320000,
      fuelCostChange: -1,
      maintenanceCost: 140000,
      maintenanceCostChange: 2,
      topRoutes: [
        { route: "Chicago to Detroit", count: 520, revenue: 145600 },
        { route: "Detroit to Cleveland", count: 480, revenue: 134400 },
        { route: "Cleveland to Pittsburgh", count: 440, revenue: 123200 },
        { route: "Pittsburgh to Columbus", count: 400, revenue: 112000 },
        { route: "Columbus to Indianapolis", count: 360, revenue: 100800 },
      ],
      monthlyRevenue: [
        { month: "2021", revenue: 1230000 },
        { month: "2022", revenue: 1450000 },
        { month: "2023", revenue: 0 },
      ],
    },
  };

  // Region-specific data
  const regionData = {
    all: data,
    northeast: {
      monthly: {
        revenue: 85000,
        revenueChange: 10,
        loads: 320,
        loadsChange: 6,
        avgRate: 265,
        avgRateChange: 3,
        onTimeDelivery: 94,
        onTimeDeliveryChange: 1,
        fuelCost: 19500,
        fuelCostChange: -2,
        maintenanceCost: 8000,
        maintenanceCostChange: 4,
        topRoutes: [
          { route: "Boston to New York", count: 40, revenue: 10600 },
          { route: "New York to Philadelphia", count: 35, revenue: 8750 },
          { route: "Philadelphia to Pittsburgh", count: 30, revenue: 7500 },
          { route: "Pittsburgh to Buffalo", count: 25, revenue: 6250 },
          { route: "Buffalo to Albany", count: 20, revenue: 5000 },
        ],
        monthlyRevenue: [
          { month: "Jan", revenue: 75000 },
          { month: "Feb", revenue: 78000 },
          { month: "Mar", revenue: 76000 },
          { month: "Apr", revenue: 79000 },
          { month: "May", revenue: 82000 },
          { month: "Jun", revenue: 85000 },
        ],
      },
      quarterly: {
        revenue: 240000,
        revenueChange: 12,
        loads: 960,
        loadsChange: 8,
        avgRate: 250,
        avgRateChange: 4,
        onTimeDelivery: 93,
        onTimeDeliveryChange: 1,
        fuelCost: 58000,
        fuelCostChange: -1,
        maintenanceCost: 24000,
        maintenanceCostChange: 2,
        topRoutes: [
          { route: "Boston to New York", count: 120, revenue: 30000 },
          { route: "New York to Philadelphia", count: 105, revenue: 26250 },
          { route: "Philadelphia to Pittsburgh", count: 90, revenue: 22500 },
          { route: "Pittsburgh to Buffalo", count: 75, revenue: 18750 },
          { route: "Buffalo to Albany", count: 60, revenue: 15000 },
        ],
        monthlyRevenue: [
          { month: "Q1", revenue: 225000 },
          { month: "Q2", revenue: 240000 },
          { month: "Q3", revenue: 0 },
          { month: "Q4", revenue: 0 },
        ],
      },
      yearly: {
        revenue: 980000,
        revenueChange: 15,
        loads: 3800,
        loadsChange: 10,
        avgRate: 258,
        avgRateChange: 5,
        onTimeDelivery: 92,
        onTimeDeliveryChange: 2,
        fuelCost: 235000,
        fuelCostChange: -1,
        maintenanceCost: 98000,
        maintenanceCostChange: 1,
        topRoutes: [
          { route: "Boston to New York", count: 380, revenue: 98000 },
          { route: "New York to Philadelphia", count: 350, revenue: 90000 },
          { route: "Philadelphia to Pittsburgh", count: 320, revenue: 82000 },
          { route: "Pittsburgh to Buffalo", count: 290, revenue: 74000 },
          { route: "Buffalo to Albany", count: 260, revenue: 66000 },
        ],
        monthlyRevenue: [
          { month: "2021", revenue: 850000 },
          { month: "2022", revenue: 980000 },
          { month: "2023", revenue: 0 },
        ],
      },
    },
    midwest: {
      monthly: {
        revenue: 95000,
        revenueChange: 14,
        loads: 350,
        loadsChange: 9,
        avgRate: 271,
        avgRateChange: 5,
        onTimeDelivery: 97,
        onTimeDeliveryChange: 3,
        fuelCost: 22000,
        fuelCostChange: -4,
        maintenanceCost: 9500,
        maintenanceCostChange: 6,
        topRoutes: [
          { route: "Chicago to Detroit", count: 45, revenue: 12600 },
          { route: "Detroit to Cleveland", count: 38, revenue: 9500 },
          { route: "Cleveland to Indianapolis", count: 32, revenue: 8000 },
          { route: "Indianapolis to St. Louis", count: 28, revenue: 7000 },
          { route: "St. Louis to Chicago", count: 25, revenue: 6250 },
        ],
        monthlyRevenue: [
          { month: "Jan", revenue: 82000 },
          { month: "Feb", revenue: 85000 },
          { month: "Mar", revenue: 88000 },
          { month: "Apr", revenue: 90000 },
          { month: "May", revenue: 92000 },
          { month: "Jun", revenue: 95000 },
        ],
      },
      quarterly: {
        revenue: 280000,
        revenueChange: 16,
        loads: 1050,
        loadsChange: 11,
        avgRate: 267,
        avgRateChange: 6,
        onTimeDelivery: 96,
        onTimeDeliveryChange: 2,
        fuelCost: 65000,
        fuelCostChange: -3,
        maintenanceCost: 28000,
        maintenanceCostChange: 4,
        topRoutes: [
          { route: "Chicago to Detroit", count: 135, revenue: 36450 },
          { route: "Detroit to Cleveland", count: 120, revenue: 30000 },
          { route: "Cleveland to Indianapolis", count: 105, revenue: 26250 },
          { route: "Indianapolis to St. Louis", count: 90, revenue: 22500 },
          { route: "St. Louis to Chicago", count: 75, revenue: 18750 },
        ],
        monthlyRevenue: [
          { month: "Q1", revenue: 255000 },
          { month: "Q2", revenue: 280000 },
          { month: "Q3", revenue: 0 },
          { month: "Q4", revenue: 0 },
        ],
      },
      yearly: {
        revenue: 1150000,
        revenueChange: 19,
        loads: 4200,
        loadsChange: 13,
        avgRate: 274,
        avgRateChange: 7,
        onTimeDelivery: 95,
        onTimeDeliveryChange: 4,
        fuelCost: 260000,
        fuelCostChange: -2,
        maintenanceCost: 115000,
        maintenanceCostChange: 3,
        topRoutes: [
          { route: "Chicago to Detroit", count: 420, revenue: 115000 },
          { route: "Detroit to Cleveland", count: 390, revenue: 107000 },
          { route: "Cleveland to Indianapolis", count: 360, revenue: 99000 },
          { route: "Indianapolis to St. Louis", count: 330, revenue: 90000 },
          { route: "St. Louis to Chicago", count: 300, revenue: 82000 },
        ],
        monthlyRevenue: [
          { month: "2021", revenue: 970000 },
          { month: "2022", revenue: 1150000 },
          { month: "2023", revenue: 0 },
        ],
      },
    },
    south: {
      monthly: {
        revenue: 75000,
        revenueChange: 8,
        loads: 280,
        loadsChange: 5,
        avgRate: 268,
        avgRateChange: 3,
        onTimeDelivery: 93,
        onTimeDeliveryChange: 1,
        fuelCost: 17500,
        fuelCostChange: -2,
        maintenanceCost: 7500,
        maintenanceCostChange: 4,
        topRoutes: [
          { route: "Atlanta to Miami", count: 35, revenue: 9800 },
          { route: "Miami to Orlando", count: 30, revenue: 7500 },
          { route: "Orlando to Nashville", count: 25, revenue: 6250 },
          { route: "Nashville to New Orleans", count: 20, revenue: 5000 },
          { route: "New Orleans to Houston", count: 15, revenue: 3750 },
        ],
        monthlyRevenue: [
          { month: "Jan", revenue: 68000 },
          { month: "Feb", revenue: 70000 },
          { month: "Mar", revenue: 71000 },
          { month: "Apr", revenue: 72000 },
          { month: "May", revenue: 73000 },
          { month: "Jun", revenue: 75000 },
        ],
      },
      quarterly: {
        revenue: 220000,
        revenueChange: 10,
        loads: 840,
        loadsChange: 7,
        avgRate: 262,
        avgRateChange: 4,
        onTimeDelivery: 92,
        onTimeDeliveryChange: 1,
        fuelCost: 52000,
        fuelCostChange: -1,
        maintenanceCost: 22000,
        maintenanceCostChange: 3,
        topRoutes: [
          { route: "Atlanta to Miami", count: 105, revenue: 27500 },
          { route: "Miami to Orlando", count: 90, revenue: 22500 },
          { route: "Orlando to Nashville", count: 75, revenue: 18750 },
          { route: "Nashville to New Orleans", count: 60, revenue: 15000 },
          { route: "New Orleans to Houston", count: 45, revenue: 11250 },
        ],
        monthlyRevenue: [
          { month: "Q1", revenue: 200000 },
          { month: "Q2", revenue: 220000 },
          { month: "Q3", revenue: 0 },
          { month: "Q4", revenue: 0 },
        ],
      },
      yearly: {
        revenue: 900000,
        revenueChange: 12,
        loads: 3400,
        loadsChange: 9,
        avgRate: 265,
        avgRateChange: 5,
        onTimeDelivery: 91,
        onTimeDeliveryChange: 2,
        fuelCost: 210000,
        fuelCostChange: 0,
        maintenanceCost: 90000,
        maintenanceCostChange: 2,
        topRoutes: [
          { route: "Atlanta to Miami", count: 340, revenue: 90000 },
          { route: "Miami to Orlando", count: 310, revenue: 82000 },
          { route: "Orlando to Nashville", count: 280, revenue: 74000 },
          { route: "Nashville to New Orleans", count: 250, revenue: 66000 },
          { route: "New Orleans to Houston", count: 220, revenue: 58000 },
        ],
        monthlyRevenue: [
          { month: "2021", revenue: 800000 },
          { month: "2022", revenue: 900000 },
          { month: "2023", revenue: 0 },
        ],
      },
    },
    west: {
      monthly: {
        revenue: 110000,
        revenueChange: 15,
        loads: 400,
        loadsChange: 10,
        avgRate: 275,
        avgRateChange: 6,
        onTimeDelivery: 95,
        onTimeDeliveryChange: 2,
        fuelCost: 25000,
        fuelCostChange: -5,
        maintenanceCost: 11000,
        maintenanceCostChange: 7,
        topRoutes: [
          { route: "Los Angeles to San Francisco", count: 50, revenue: 14000 },
          { route: "San Francisco to Seattle", count: 42, revenue: 11760 },
          { route: "Seattle to Portland", count: 35, revenue: 9800 },
          { route: "Portland to Denver", count: 30, revenue: 8400 },
          { route: "Denver to Phoenix", count: 25, revenue: 7000 },
        ],
        monthlyRevenue: [
          { month: "Jan", revenue: 95000 },
          { month: "Feb", revenue: 98000 },
          { month: "Mar", revenue: 100000 },
          { month: "Apr", revenue: 103000 },
          { month: "May", revenue: 107000 },
          { month: "Jun", revenue: 110000 },
        ],
      },
      quarterly: {
        revenue: 330000,
        revenueChange: 18,
        loads: 1200,
        loadsChange: 12,
        avgRate: 275,
        avgRateChange: 7,
        onTimeDelivery: 94,
        onTimeDeliveryChange: 2,
        fuelCost: 75000,
        fuelCostChange: -4,
        maintenanceCost: 33000,
        maintenanceCostChange: 5,
        topRoutes: [
          { route: "Los Angeles to San Francisco", count: 150, revenue: 42000 },
          { route: "San Francisco to Seattle", count: 126, revenue: 35280 },
          { route: "Seattle to Portland", count: 105, revenue: 29400 },
          { route: "Portland to Denver", count: 90, revenue: 25200 },
          { route: "Denver to Phoenix", count: 75, revenue: 21000 },
        ],
        monthlyRevenue: [
          { month: "Q1", revenue: 290000 },
          { month: "Q2", revenue: 330000 },
          { month: "Q3", revenue: 0 },
          { month: "Q4", revenue: 0 },
        ],
      },
      yearly: {
        revenue: 1350000,
        revenueChange: 20,
        loads: 4900,
        loadsChange: 15,
        avgRate: 276,
        avgRateChange: 8,
        onTimeDelivery: 93,
        onTimeDeliveryChange: 3,
        fuelCost: 300000,
        fuelCostChange: -3,
        maintenanceCost: 135000,
        maintenanceCostChange: 4,
        topRoutes: [
          {
            route: "Los Angeles to San Francisco",
            count: 490,
            revenue: 135000,
          },
          { route: "San Francisco to Seattle", count: 450, revenue: 124000 },
          { route: "Seattle to Portland", count: 410, revenue: 113000 },
          { route: "Portland to Denver", count: 370, revenue: 102000 },
          { route: "Denver to Phoenix", count: 330, revenue: 91000 },
        ],
        monthlyRevenue: [
          { month: "2021", revenue: 1120000 },
          { month: "2022", revenue: 1350000 },
          { month: "2023", revenue: 0 },
        ],
      },
    },
    canada: {
      monthly: {
        revenue: 65000,
        revenueChange: 7,
        loads: 240,
        loadsChange: 4,
        avgRate: 270,
        avgRateChange: 3,
        onTimeDelivery: 94,
        onTimeDeliveryChange: 1,
        fuelCost: 15000,
        fuelCostChange: -1,
        maintenanceCost: 6500,
        maintenanceCostChange: 3,
        topRoutes: [
          { route: "Toronto to Montreal", count: 30, revenue: 8100 },
          { route: "Montreal to Ottawa", count: 25, revenue: 6750 },
          { route: "Ottawa to Quebec City", count: 20, revenue: 5400 },
          { route: "Quebec City to Halifax", count: 15, revenue: 4050 },
          { route: "Halifax to St. John's", count: 10, revenue: 2700 },
        ],
        monthlyRevenue: [
          { month: "Jan", revenue: 60000 },
          { month: "Feb", revenue: 61000 },
          { month: "Mar", revenue: 62000 },
          { month: "Apr", revenue: 63000 },
          { month: "May", revenue: 64000 },
          { month: "Jun", revenue: 65000 },
        ],
      },
      quarterly: {
        revenue: 190000,
        revenueChange: 9,
        loads: 720,
        loadsChange: 6,
        avgRate: 264,
        avgRateChange: 4,
        onTimeDelivery: 93,
        onTimeDeliveryChange: 1,
        fuelCost: 45000,
        fuelCostChange: 0,
        maintenanceCost: 19000,
        maintenanceCostChange: 2,
        topRoutes: [
          { route: "Toronto to Montreal", count: 90, revenue: 24300 },
          { route: "Montreal to Ottawa", count: 75, revenue: 20250 },
          { route: "Ottawa to Quebec City", count: 60, revenue: 16200 },
          { route: "Quebec City to Halifax", count: 45, revenue: 12150 },
          { route: "Halifax to St. John's", count: 30, revenue: 8100 },
        ],
        monthlyRevenue: [
          { month: "Q1", revenue: 175000 },
          { month: "Q2", revenue: 190000 },
          { month: "Q3", revenue: 0 },
          { month: "Q4", revenue: 0 },
        ],
      },
      yearly: {
        revenue: 780000,
        revenueChange: 11,
        loads: 2900,
        loadsChange: 8,
        avgRate: 269,
        avgRateChange: 5,
        onTimeDelivery: 92,
        onTimeDeliveryChange: 2,
        fuelCost: 180000,
        fuelCostChange: -1,
        maintenanceCost: 78000,
        maintenanceCostChange: 1,
        topRoutes: [
          { route: "Toronto to Montreal", count: 290, revenue: 78000 },
          { route: "Montreal to Ottawa", count: 260, revenue: 70000 },
          { route: "Ottawa to Quebec City", count: 230, revenue: 62000 },
          { route: "Quebec City to Halifax", count: 200, revenue: 54000 },
          { route: "Halifax to St. John's", count: 170, revenue: 46000 },
        ],
        monthlyRevenue: [
          { month: "2021", revenue: 700000 },
          { month: "2022", revenue: 780000 },
          { month: "2023", revenue: 0 },
        ],
      },
    },
  };

  // Get current data based on time filter and region filter
  const currentData =
    regionFilter === "all"
      ? data[timeFilter as keyof typeof data]
      : regionData[regionFilter as keyof typeof regionData][
          timeFilter as keyof typeof data
        ];

  const handleTimeFilterChange = (value: string) => {
    setIsLoading(true);

    // Simulate loading data
    setTimeout(() => {
      setTimeFilter(value);
      setIsLoading(false);

      toast({
        title: "Data Updated",
        description: `Analytics data has been updated to ${value} view.`,
        variant: "success",
      });
    }, 800);
  };

  const handleRegionFilterChange = (value: string) => {
    setIsLoading(true);

    // Simulate loading data
    setTimeout(() => {
      setRegionFilter(value);
      setIsLoading(false);

      toast({
        title: "Region Updated",
        description: `Analytics data has been updated to ${value === "all" ? "All Regions" : value} view.`,
        variant: "success",
      });
    }, 800);
  };

  const handleExport = (format: string) => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: "Your analytics data is being prepared for download.",
    });

    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Analytics data has been exported as ${format.toUpperCase()}.`,
        variant: "success",
      });
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Financial Analytics</h1>
          <p className="text-gray-500 mt-1">
            Track your fleet performance and financial metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500 flex items-center gap-2"
          >
            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
              <SelectTrigger className="w-[120px] border-none bg-transparent focus:ring-0 focus:ring-offset-0 h-9 hover:bg-yellow-50 transition-colors">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Monthly" />
                </div>
              </SelectTrigger>
              <SelectContent className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                <SelectItem value="monthly" className="cursor-pointer">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Monthly
                  </div>
                </SelectItem>
                <SelectItem value="quarterly" className="cursor-pointer">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Quarterly
                  </div>
                </SelectItem>
                <SelectItem value="yearly" className="cursor-pointer">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Yearly
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Button>

          <Button
            variant="outline"
            className="bg-blue-400 hover:bg-blue-500 text-black border-blue-500 flex items-center gap-2"
          >
            <Select
              value={regionFilter}
              onValueChange={handleRegionFilterChange}
            >
              <SelectTrigger className="w-[150px] border-none bg-transparent focus:ring-0 focus:ring-offset-0 h-9 hover:bg-blue-50 transition-colors">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Regions" />
                </div>
              </SelectTrigger>
              <SelectContent className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                <SelectItem value="all" className="cursor-pointer">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    All Regions
                  </div>
                </SelectItem>
                <SelectItem value="northeast" className="cursor-pointer">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Northeast US
                  </div>
                </SelectItem>
                <SelectItem value="midwest" className="cursor-pointer">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Midwest US
                  </div>
                </SelectItem>
                <SelectItem value="south" className="cursor-pointer">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    South US
                  </div>
                </SelectItem>
                <SelectItem value="west" className="cursor-pointer">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    West US
                  </div>
                </SelectItem>
                <SelectItem value="canada" className="cursor-pointer">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Canada
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            >
              <DropdownMenuItem
                onClick={() => handleExport("pdf")}
                className="cursor-pointer hover:bg-gray-100"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("csv")}
                className="cursor-pointer hover:bg-gray-100"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("excel")}
                className="cursor-pointer hover:bg-gray-100"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold mt-2">
                      ${(currentData.revenue / 1000).toFixed(1)}k
                    </p>
                    <p
                      className={`text-sm ${currentData.revenueChange > 0 ? "text-green-600" : "text-red-600"} mt-1 flex items-center`}
                    >
                      {currentData.revenueChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(currentData.revenueChange)}% vs last period
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loads</p>
                    <p className="text-2xl font-bold mt-2">
                      {currentData.loads}
                    </p>
                    <p
                      className={`text-sm ${currentData.loadsChange > 0 ? "text-green-600" : "text-red-600"} mt-1 flex items-center`}
                    >
                      {currentData.loadsChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(currentData.loadsChange)}% vs last period
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Average Rate
                    </p>
                    <p className="text-2xl font-bold mt-2">
                      ${currentData.avgRate}/load
                    </p>
                    <p
                      className={`text-sm ${currentData.avgRateChange > 0 ? "text-green-600" : "text-red-600"} mt-1 flex items-center`}
                    >
                      {currentData.avgRateChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(currentData.avgRateChange)}% vs last period
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      On-Time Delivery
                    </p>
                    <p className="text-2xl font-bold mt-2">
                      {currentData.onTimeDelivery}%
                    </p>
                    <p
                      className={`text-sm ${currentData.onTimeDeliveryChange > 0 ? "text-green-600" : "text-red-600"} mt-1 flex items-center`}
                    >
                      {currentData.onTimeDeliveryChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(currentData.onTimeDeliveryChange)}% vs last
                      period
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="w-full">
                  {/* Simple bar chart visualization */}
                  <div className="flex items-end justify-between h-64 gap-2">
                    {currentData.monthlyRevenue.map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className="bg-blue-500 w-12 rounded-t-md transition-all duration-500 ease-in-out"
                          style={{
                            height: `${(item.revenue / currentData.revenue) * 200}px`,
                          }}
                        ></div>
                        <p className="text-xs mt-2">{item.month}</p>
                        <p className="text-xs text-gray-500">
                          ${(item.revenue / 1000).toFixed(0)}k
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentData.topRoutes.map((route, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">{route.route}</p>
                      <p className="text-sm font-medium">
                        ${route.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={
                          (route.revenue / currentData.topRoutes[0].revenue) *
                          100
                        }
                      />
                      <span className="text-sm text-gray-500">
                        {route.count} loads
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Expenses Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Fuel Costs</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        ${currentData.fuelCost.toLocaleString()}
                      </p>
                      <Badge
                        className={`${currentData.fuelCostChange < 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {currentData.fuelCostChange > 0 ? "+" : ""}
                        {currentData.fuelCostChange}%
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={
                      (currentData.fuelCost /
                        (currentData.fuelCost + currentData.maintenanceCost)) *
                      100
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Maintenance Costs</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        ${currentData.maintenanceCost.toLocaleString()}
                      </p>
                      <Badge
                        className={`${currentData.maintenanceCostChange < 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {currentData.maintenanceCostChange > 0 ? "+" : ""}
                        {currentData.maintenanceCostChange}%
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={
                      (currentData.maintenanceCost /
                        (currentData.fuelCost + currentData.maintenanceCost)) *
                      100
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <p className="font-medium">Total Expenses</p>
                    <p className="font-medium">
                      $
                      {(
                        currentData.fuelCost + currentData.maintenanceCost
                      ).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {(
                      ((currentData.fuelCost + currentData.maintenanceCost) /
                        currentData.revenue) *
                      100
                    ).toFixed(1)}
                    % of revenue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Fleet Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Vehicle Utilization</p>
                  <div className="flex items-center gap-4">
                    <Progress value={85} className="flex-1" />
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Driver Efficiency</p>
                  <div className="flex items-center gap-4">
                    <Progress value={92} className="flex-1" />
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Fuel Efficiency</p>
                  <div className="flex items-center gap-4">
                    <Progress value={78} className="flex-1" />
                    <span className="text-sm font-medium">78%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Maintenance Compliance</p>
                  <div className="flex items-center gap-4">
                    <Progress value={95} className="flex-1" />
                    <span className="text-sm font-medium">95%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
