import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Download } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { exportToCSV, exportToExcel, exportToPDF } from "./ExportUtils";

export default function Analytics() {
  const { toast } = useToast();
  const [showDateRangeDialog, setShowDateRangeDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  });

  const [exportFormat, setExportFormat] = useState("csv");

  const metrics = [
    {
      title: "Total Shipments",
      value: "324",
      change: "+12%",
      changeLabel: "vs last month",
      trend: "up",
    },
    {
      title: "On-Time Delivery",
      value: "94%",
      change: "+3%",
      changeLabel: "vs last month",
      trend: "up",
    },
    {
      title: "Avg Cost/Mile",
      value: "$2.45",
      change: "+5%",
      changeLabel: "vs last month",
      trend: "up",
    },
    {
      title: "Cost Savings",
      value: "$12.5k",
      change: "+8%",
      changeLabel: "vs last month",
      trend: "up",
    },
  ];

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleApplyDateRange = () => {
    setShowDateRangeDialog(false);

    toast({
      title: "Date Range Applied",
      description:
        dateRange?.from && dateRange?.to
          ? `Data filtered from ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`
          : "All data is being displayed",
      variant: "success",
    });
  };

  const handleExport = () => {
    setShowExportDialog(false);

    // Sample data to export
    const data = [
      {
        date: "2024-01-01",
        shipments: 120,
        onTimeDelivery: "92%",
        avgCostPerMile: 2.35,
        costSavings: 4500,
      },
      {
        date: "2024-02-01",
        shipments: 145,
        onTimeDelivery: "93%",
        avgCostPerMile: 2.4,
        costSavings: 5200,
      },
      {
        date: "2024-03-01",
        shipments: 324,
        onTimeDelivery: "94%",
        avgCostPerMile: 2.45,
        costSavings: 12500,
      },
    ];

    // Export based on selected format
    if (exportFormat === "csv") {
      exportToCSV(data, "analytics_data");
    } else if (exportFormat === "excel") {
      exportToExcel(data, "analytics_data");
    } else if (exportFormat === "pdf") {
      exportToPDF(data, "analytics_data");
    }

    toast({
      title: "Export Complete",
      description: `Analytics data has been exported as ${exportFormat.toUpperCase()}.`,
      variant: "success",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={() => setShowDateRangeDialog(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button
            variant="outline"
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{metric.title}</p>
                <p className="text-2xl font-semibold">{metric.value}</p>
                <div
                  className={`flex items-center gap-1 ${metric.trend === "up" ? "text-emerald-600" : "text-red-600"} text-sm`}
                >
                  {metric.trend === "up" ? "↑" : "↓"}
                  <span>{metric.change}</span>
                  <span className="text-gray-500">{metric.changeLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Shipment Performance</h2>
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-full">
                {/* Simple bar chart visualization */}
                <div className="flex items-end justify-between h-64 gap-2">
                  {["Jan", "Feb", "Mar", "Apr"].map((month, index) => (
                    <div key={month} className="flex flex-col items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className="bg-green-500 w-12 rounded-t-md"
                          style={{ height: `${[60, 65, 80, 70][index]}%` }}
                        ></div>
                        <div
                          className="bg-red-500 w-12 mt-1"
                          style={{ height: `${[7, 6, 5, 6][index]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-2">{month}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Transportation Cost Trend
            </h2>
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-full">
                {/* Simple line chart visualization */}
                <div className="relative h-64">
                  <div className="absolute inset-0">
                    <div className="border-t border-gray-200 absolute top-0 w-full"></div>
                    <div className="border-t border-gray-200 absolute top-1/4 w-full"></div>
                    <div className="border-t border-gray-200 absolute top-2/4 w-full"></div>
                    <div className="border-t border-gray-200 absolute top-3/4 w-full"></div>
                    <div className="border-t border-gray-200 absolute bottom-0 w-full"></div>
                  </div>

                  <div className="absolute inset-0 flex items-end">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 400 200"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,150 L100,130 L200,110 L300,90 L400,70"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      <circle cx="0" cy="150" r="4" fill="#3b82f6" />
                      <circle cx="100" cy="130" r="4" fill="#3b82f6" />
                      <circle cx="200" cy="110" r="4" fill="#3b82f6" />
                      <circle cx="300" cy="90" r="4" fill="#3b82f6" />
                      <circle cx="400" cy="70" r="4" fill="#3b82f6" />
                    </svg>
                  </div>

                  <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-500">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Dialog */}
      <Dialog open={showDateRangeDialog} onOpenChange={setShowDateRangeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>
              Choose a date range to filter the analytics data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDateRangeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApplyDateRange}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Analytics Data</DialogTitle>
            <DialogDescription>
              Choose a format to export your analytics data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === "csv"}
                    onChange={() => setExportFormat("csv")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>CSV (.csv)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="excel"
                    checked={exportFormat === "excel"}
                    onChange={() => setExportFormat("excel")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === "pdf"}
                    onChange={() => setExportFormat("pdf")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>PDF (.pdf)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data to Include</Label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Shipment Performance</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Transportation Cost Trend</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Key Metrics</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExport}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
