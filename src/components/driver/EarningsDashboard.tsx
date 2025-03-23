import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowUpRight,
  RotateCcw,
  Download,
  Bell,
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Load {
  id: string;
  from: string;
  to: string;
  date: string;
  amount: number;
}

export default function EarningsDashboard() {
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    minAmount: "",
    maxAmount: "",
    dateRange: {
      from: "",
      to: "",
    },
  });

  const stats = [
    {
      title: "Total Earnings (YTD)",
      value: "$32,400",
      change: "+12.5%",
      changeLabel: "from last year",
    },
    {
      title: "This Month",
      value: "$6,500",
      change: "+5.2%",
      changeLabel: "from last month",
    },
    {
      title: "Average Per Load",
      value: "$933",
      subtitle: "35 loads this month",
    },
    {
      title: "Next Payout",
      value: "$2,850",
      subtitle: "Due in 2 days",
    },
  ];

  const recentLoads: Load[] = [
    {
      id: "L-1234",
      from: "Chicago, IL",
      to: "Milwaukee, WI",
      date: "2024-02-15",
      amount: 850,
    },
    {
      id: "L-1235",
      from: "Milwaukee, WI",
      to: "Minneapolis, MN",
      date: "2024-02-14",
      amount: 1200,
    },
    {
      id: "L-1236",
      from: "Minneapolis, MN",
      to: "Des Moines, IA",
      date: "2024-02-13",
      amount: 750,
    },
  ];

  const handleRefresh = () => {
    toast({
      title: "Data Refreshed",
      description:
        "Your earnings data has been refreshed with the latest information.",
      variant: "success",
    });
  };

  const handleExport = (format: string) => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: "Your earnings data is being prepared for download.",
    });

    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Earnings data has been exported as ${format.toUpperCase()}.`,
        variant: "success",
      });
    }, 1500);
  };

  const applyFilters = () => {
    setShowFilterPopover(false);
    toast({
      title: "Filters Applied",
      description:
        "Earnings data has been filtered according to your criteria.",
      variant: "success",
    });
  };

  const resetFilters = () => {
    setFilters({
      minAmount: "",
      maxAmount: "",
      dateRange: {
        from: "",
        to: "",
      },
    });
    setShowFilterPopover(false);
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
      variant: "success",
    });
  };

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Earnings Dashboard</h1>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              Last updated: 5 mins ago
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover
              open={showFilterPopover}
              onOpenChange={setShowFilterPopover}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Earnings</h4>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Amount Range ($)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full p-2 border rounded-md"
                          value={filters.minAmount}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              minAmount: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full p-2 border rounded-md"
                          value={filters.maxAmount}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              maxAmount: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="date"
                          className="w-full p-2 border rounded-md"
                          value={filters.dateRange.from}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              dateRange: {
                                ...filters.dateRange,
                                from: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          className="w-full p-2 border rounded-md"
                          value={filters.dateRange.to}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              dateRange: {
                                ...filters.dateRange,
                                to: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button size="sm" onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RotateCcw className="h-4 w-4" />
            </Button>

            <DropdownMenu
              open={showNotificationsMenu}
              onOpenChange={setShowNotificationsMenu}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2">
                  <h4 className="font-medium mb-2">Financial Notifications</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    <div className="flex items-start gap-2 p-2 border-b">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Payment Received</p>
                        <p className="text-xs text-gray-500">
                          $450 has been deposited to your account
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          2 hours ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 border-b">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Bonus Earned</p>
                        <p className="text-xs text-gray-500">
                          You earned a $50 bonus for on-time deliveries
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 border-b">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          Payment Processing
                        </p>
                        <p className="text-xs text-gray-500">
                          Your payment of $380 is being processed
                        </p>
                        <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View All Notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 text-emerald-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>{stat.change}</span>
                    <span className="text-gray-500">{stat.changeLabel}</span>
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-sm text-gray-500">{stat.subtitle}</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Loads */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Loads</h2>
          <div className="space-y-4">
            {recentLoads.map((load) => (
              <div
                key={load.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div>
                  <div className="font-medium">{load.id}</div>
                  <div className="text-sm text-gray-500">
                    From: {load.from}
                    <br />
                    To: {load.to}
                  </div>
                  <div className="text-xs text-gray-400">{load.date}</div>
                </div>
                <div className="text-lg font-semibold">${load.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
