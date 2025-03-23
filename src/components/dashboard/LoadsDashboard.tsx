import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  Filter,
  MoreVertical,
  Search,
  Truck,
  MapPin,
  Calendar,
  Package,
  Clock,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

type UserRole = "admin" | "shipper" | "carrier" | "driver";

interface LoadsDashboardProps {
  userRole: UserRole;
  userId?: string;
}

export default function LoadsDashboard({
  userRole,
  userId,
}: LoadsDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("pickupDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch loads based on user role
  const loads = useQuery(api.loads.getLoads, {
    status: statusFilter || undefined,
    limit: 50,
  });

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-200 text-gray-800";
      case "posted":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-purple-100 text-purple-800";
      case "in_transit":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-200 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Filter and sort loads
  const filteredLoads = loads?.loads
    ? loads.loads
        .filter((load) => {
          // Filter by search term
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              load.referenceNumber.toLowerCase().includes(searchLower) ||
              load.commodity.toLowerCase().includes(searchLower)
            );
          }
          return true;
        })
        .filter((load) => {
          // Filter by tab
          if (activeTab === "all") return true;
          if (activeTab === "active") {
            return ["posted", "assigned", "in_transit"].includes(load.status);
          }
          if (activeTab === "completed") {
            return ["delivered", "completed"].includes(load.status);
          }
          if (activeTab === "draft") {
            return load.status === "draft";
          }
          return true;
        })
        .filter((load) => {
          // Filter by date
          if (!dateFilter) return true;
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          const pickupDate = new Date(load.pickupWindowStart);

          switch (dateFilter) {
            case "today":
              return (
                pickupDate.getDate() === today.getDate() &&
                pickupDate.getMonth() === today.getMonth() &&
                pickupDate.getFullYear() === today.getFullYear()
              );
            case "tomorrow":
              return (
                pickupDate.getDate() === tomorrow.getDate() &&
                pickupDate.getMonth() === tomorrow.getMonth() &&
                pickupDate.getFullYear() === tomorrow.getFullYear()
              );
            case "thisWeek":
              return pickupDate <= nextWeek && pickupDate >= today;
            case "thisMonth":
              return pickupDate <= nextMonth && pickupDate >= today;
            default:
              return true;
          }
        })
        .sort((a, b) => {
          // Sort loads
          let valueA, valueB;

          switch (sortBy) {
            case "pickupDate":
              valueA = a.pickupWindowStart;
              valueB = b.pickupWindowStart;
              break;
            case "deliveryDate":
              valueA = a.deliveryWindowStart;
              valueB = b.deliveryWindowStart;
              break;
            case "status":
              valueA = a.status;
              valueB = b.status;
              break;
            case "reference":
              valueA = a.referenceNumber;
              valueB = b.referenceNumber;
              break;
            default:
              valueA = a.pickupWindowStart;
              valueB = b.pickupWindowStart;
          }

          if (sortOrder === "asc") {
            return valueA > valueB ? 1 : -1;
          } else {
            return valueA < valueB ? 1 : -1;
          }
        })
    : [];

  // Get available actions based on user role and load status
  const getActions = (load: any) => {
    const actions = [];

    // View action is available for all roles and statuses
    actions.push({
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      onClick: () => handleViewLoad(load),
    });

    // Role-specific actions
    if (userRole === "admin") {
      // Admin can edit any load that's not completed or cancelled
      if (!["completed", "cancelled"].includes(load.status)) {
        actions.push({
          label: "Edit Load",
          icon: <Edit className="h-4 w-4 mr-2" />,
          onClick: () => handleEditLoad(load),
        });
      }

      // Admin can delete draft loads
      if (load.status === "draft") {
        actions.push({
          label: "Delete Load",
          icon: <Trash2 className="h-4 w-4 mr-2" />,
          onClick: () => handleDeleteLoad(load),
        });
      }

      // Admin can change status of any load
      actions.push({
        label: "Change Status",
        icon: <RefreshCw className="h-4 w-4 mr-2" />,
        onClick: () => handleChangeStatus(load),
      });
    } else if (userRole === "shipper") {
      // Shipper can edit their own loads in draft or posted status
      if (["draft", "posted"].includes(load.status)) {
        actions.push({
          label: "Edit Load",
          icon: <Edit className="h-4 w-4 mr-2" />,
          onClick: () => handleEditLoad(load),
        });
      }

      // Shipper can delete draft loads
      if (load.status === "draft") {
        actions.push({
          label: "Delete Load",
          icon: <Trash2 className="h-4 w-4 mr-2" />,
          onClick: () => handleDeleteLoad(load),
        });
      }

      // Shipper can post draft loads
      if (load.status === "draft") {
        actions.push({
          label: "Post Load",
          icon: <CheckCircle className="h-4 w-4 mr-2" />,
          onClick: () => handlePostLoad(load),
        });
      }

      // Shipper can cancel posted or assigned loads
      if (["posted", "assigned"].includes(load.status)) {
        actions.push({
          label: "Cancel Load",
          icon: <XCircle className="h-4 w-4 mr-2" />,
          onClick: () => handleCancelLoad(load),
        });
      }

      // Shipper can mark delivered loads as completed
      if (load.status === "delivered") {
        actions.push({
          label: "Mark as Completed",
          icon: <CheckCircle className="h-4 w-4 mr-2" />,
          onClick: () => handleCompleteLoad(load),
        });
      }
    } else if (userRole === "carrier") {
      // Carrier can accept posted loads
      if (load.status === "posted") {
        actions.push({
          label: "Accept Load",
          icon: <CheckCircle className="h-4 w-4 mr-2" />,
          onClick: () => handleAcceptLoad(load),
        });
      }

      // Carrier can assign driver to accepted loads
      if (load.status === "assigned" && !load.driverId) {
        actions.push({
          label: "Assign Driver",
          icon: <Truck className="h-4 w-4 mr-2" />,
          onClick: () => handleAssignDriver(load),
        });
      }

      // Carrier can update status of assigned loads
      if (load.status === "assigned" && load.driverId) {
        actions.push({
          label: "Mark In Transit",
          icon: <Truck className="h-4 w-4 mr-2" />,
          onClick: () => handleMarkInTransit(load),
        });
      }

      // Carrier can mark in_transit loads as delivered
      if (load.status === "in_transit") {
        actions.push({
          label: "Mark as Delivered",
          icon: <CheckCircle className="h-4 w-4 mr-2" />,
          onClick: () => handleMarkDelivered(load),
        });
      }
    } else if (userRole === "driver") {
      // Driver can update status of assigned loads
      if (load.status === "assigned") {
        actions.push({
          label: "Start Trip",
          icon: <Truck className="h-4 w-4 mr-2" />,
          onClick: () => handleStartTrip(load),
        });
      }

      // Driver can mark in_transit loads as delivered
      if (load.status === "in_transit") {
        actions.push({
          label: "Mark as Delivered",
          icon: <CheckCircle className="h-4 w-4 mr-2" />,
          onClick: () => handleMarkDelivered(load),
        });
      }

      // Driver can update location for in_transit loads
      if (load.status === "in_transit") {
        actions.push({
          label: "Update Location",
          icon: <MapPin className="h-4 w-4 mr-2" />,
          onClick: () => handleUpdateLocation(load),
        });
      }
    }

    return actions;
  };

  // Action handlers
  const handleViewLoad = (load: any) => {
    toast({
      title: "View Load",
      description: `Viewing load ${load.referenceNumber}`,
    });
    // Navigate to load details page
    // window.location.href = `/loads/${load._id}`;
  };

  const handleEditLoad = (load: any) => {
    toast({
      title: "Edit Load",
      description: `Editing load ${load.referenceNumber}`,
    });
    // Navigate to load edit page
    // window.location.href = `/loads/${load._id}/edit`;
  };

  const handleDeleteLoad = (load: any) => {
    toast({
      title: "Delete Load",
      description: `Deleting load ${load.referenceNumber}`,
      variant: "destructive",
    });
    // Show confirmation dialog and delete load
  };

  const handleChangeStatus = (load: any) => {
    toast({
      title: "Change Status",
      description: `Changing status for load ${load.referenceNumber}`,
    });
    // Show status change dialog
  };

  const handlePostLoad = (load: any) => {
    toast({
      title: "Post Load",
      description: `Posting load ${load.referenceNumber}`,
    });
    // Update load status to posted
  };

  const handleCancelLoad = (load: any) => {
    toast({
      title: "Cancel Load",
      description: `Cancelling load ${load.referenceNumber}`,
      variant: "destructive",
    });
    // Show confirmation dialog and cancel load
  };

  const handleCompleteLoad = (load: any) => {
    toast({
      title: "Complete Load",
      description: `Marking load ${load.referenceNumber} as completed`,
    });
    // Update load status to completed
  };

  const handleAcceptLoad = (load: any) => {
    toast({
      title: "Accept Load",
      description: `Accepting load ${load.referenceNumber}`,
    });
    // Update load status to assigned and set carrier ID
  };

  const handleAssignDriver = (load: any) => {
    toast({
      title: "Assign Driver",
      description: `Assigning driver to load ${load.referenceNumber}`,
    });
    // Show driver selection dialog
  };

  const handleMarkInTransit = (load: any) => {
    toast({
      title: "Mark In Transit",
      description: `Marking load ${load.referenceNumber} as in transit`,
    });
    // Update load status to in_transit
  };

  const handleMarkDelivered = (load: any) => {
    toast({
      title: "Mark Delivered",
      description: `Marking load ${load.referenceNumber} as delivered`,
    });
    // Update load status to delivered
  };

  const handleStartTrip = (load: any) => {
    toast({
      title: "Start Trip",
      description: `Starting trip for load ${load.referenceNumber}`,
    });
    // Update load status to in_transit
  };

  const handleUpdateLocation = (load: any) => {
    toast({
      title: "Update Location",
      description: `Updating location for load ${load.referenceNumber}`,
    });
    // Show location update dialog
  };

  // Get role-specific dashboard title
  const getDashboardTitle = () => {
    switch (userRole) {
      case "admin":
        return "All Loads";
      case "shipper":
        return "My Shipments";
      case "carrier":
        return "Available & Assigned Loads";
      case "driver":
        return "My Assigned Loads";
      default:
        return "Loads Dashboard";
    }
  };

  // Get role-specific empty state message
  const getEmptyStateMessage = () => {
    switch (userRole) {
      case "admin":
        return "No loads found. Loads will appear here once created.";
      case "shipper":
        return "No shipments found. Create a new shipment to get started.";
      case "carrier":
        return "No loads available. Check back later for new opportunities.";
      case "driver":
        return "No loads assigned to you yet. Check back later.";
      default:
        return "No loads found.";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{getDashboardTitle()}</h1>
        <div className="flex gap-2">
          {userRole === "shipper" && (
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
              <Package className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          )}
          <Button
            variant="outline"
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={() => {
              toast({
                title: "Refreshed",
                description: "Dashboard data has been refreshed",
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-between items-center p-4 border-b">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              {userRole === "shipper" && (
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              )}
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search loads..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Status</p>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <p className="text-sm font-medium mb-2 mt-4">Date</p>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any Date</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sort
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("pickupDate");
                      setSortOrder("asc");
                    }}
                  >
                    Pickup Date (Earliest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("pickupDate");
                      setSortOrder("desc");
                    }}
                  >
                    Pickup Date (Latest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("deliveryDate");
                      setSortOrder("asc");
                    }}
                  >
                    Delivery Date (Earliest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("deliveryDate");
                      setSortOrder("desc");
                    }}
                  >
                    Delivery Date (Latest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("status");
                      setSortOrder("asc");
                    }}
                  >
                    Status (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("reference");
                      setSortOrder("asc");
                    }}
                  >
                    Reference Number
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="all" className="p-0">
            <LoadsTable
              loads={filteredLoads}
              getActions={getActions}
              formatDate={formatDate}
              formatTime={formatTime}
              getStatusBadgeColor={getStatusBadgeColor}
              formatStatus={formatStatus}
              emptyStateMessage={getEmptyStateMessage()}
            />
          </TabsContent>

          <TabsContent value="active" className="p-0">
            <LoadsTable
              loads={filteredLoads}
              getActions={getActions}
              formatDate={formatDate}
              formatTime={formatTime}
              getStatusBadgeColor={getStatusBadgeColor}
              formatStatus={formatStatus}
              emptyStateMessage={getEmptyStateMessage()}
            />
          </TabsContent>

          <TabsContent value="completed" className="p-0">
            <LoadsTable
              loads={filteredLoads}
              getActions={getActions}
              formatDate={formatDate}
              formatTime={formatTime}
              getStatusBadgeColor={getStatusBadgeColor}
              formatStatus={formatStatus}
              emptyStateMessage={getEmptyStateMessage()}
            />
          </TabsContent>

          {userRole === "shipper" && (
            <TabsContent value="draft" className="p-0">
              <LoadsTable
                loads={filteredLoads}
                getActions={getActions}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusBadgeColor={getStatusBadgeColor}
                formatStatus={formatStatus}
                emptyStateMessage={getEmptyStateMessage()}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

interface LoadsTableProps {
  loads: any[];
  getActions: (load: any) => any[];
  formatDate: (timestamp: number) => string;
  formatTime: (timestamp: number) => string;
  getStatusBadgeColor: (status: string) => string;
  formatStatus: (status: string) => string;
  emptyStateMessage: string;
}

function LoadsTable({
  loads,
  getActions,
  formatDate,
  formatTime,
  getStatusBadgeColor,
  formatStatus,
  emptyStateMessage,
}: LoadsTableProps) {
  if (loads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Truck className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No Loads Found
        </h3>
        <p className="text-gray-500 max-w-md">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Commodity</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load._id}>
              <TableCell className="font-medium">
                {load.referenceNumber}
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(load.status)}>
                  {formatStatus(load.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                    {formatDate(load.pickupWindowStart)}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(load.pickupWindowStart)}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                    {load.pickupLocation?.address || "Address not available"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                    {formatDate(load.deliveryWindowStart)}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(load.deliveryWindowStart)}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                    {load.deliveryLocation?.address || "Address not available"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{load.commodity}</span>
                  <span className="text-xs text-gray-500">
                    {load.weight.toLocaleString()} lbs
                  </span>
                </div>
              </TableCell>
              <TableCell>{load.equipmentType}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {getActions(load).map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        className="flex items-center"
                      >
                        {action.icon}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
