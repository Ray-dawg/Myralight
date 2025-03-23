import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../lib/convex/_generated/api";
import { Id } from "../../lib/convex/_generated/dataModel";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CalendarIcon, Download, Filter, Search } from "lucide-react";
import { Input } from "../ui/input";

// Event icon mapping based on action type
const getEventIcon = (actionType: string) => {
  switch (actionType) {
    case "LOAD_CREATED":
      return "📦";
    case "STATUS_CHANGE":
      return "🔄";
    case "CARRIER_ASSIGNED":
      return "🚚";
    case "DRIVER_ASSIGNED":
      return "👨‍✈️";
    case "ROUTE_MODIFIED":
      return "🗺️";
    case "DELIVERY_CONFIRMED":
      return "✅";
    default:
      return "📝";
  }
};

// Action type options for filtering
const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "LOAD_CREATED", label: "Load Created" },
  { value: "STATUS_CHANGE", label: "Status Change" },
  { value: "CARRIER_ASSIGNED", label: "Carrier Assigned" },
  { value: "DRIVER_ASSIGNED", label: "Driver Assigned" },
  { value: "ROUTE_MODIFIED", label: "Route Modified" },
  { value: "DELIVERY_CONFIRMED", label: "Delivery Confirmed" },
];

// Individual event component
const TimelineEvent = ({ event, role }: { event: any; role: string }) => {
  const user = useQuery(api.users.getUser, { userId: event.userId });
  const timeAgo = formatDistanceToNow(parseISO(event.timestamp), {
    addSuffix: true,
  });

  // Show different levels of detail based on role
  const getEventDetails = () => {
    const baseDetails = (
      <>
        <div className="event-title">{event.details.description}</div>
        <div className="event-time">
          {format(parseISO(event.timestamp), "PPpp")}
        </div>
      </>
    );

    // Additional details for admin role
    if (role === "admin") {
      return (
        <>
          {baseDetails}
          <div className="event-meta">
            <div className="user-info">User: {user?.name || event.userId}</div>
            {event.details.before && event.details.after && (
              <Button
                variant="outline"
                size="sm"
                className="view-diff-button mt-2"
              >
                View Changes
              </Button>
            )}
          </div>
        </>
      );
    }

    return baseDetails;
  };

  return (
    <div className="timeline-event flex gap-3 mb-4 p-3 border rounded-md bg-card">
      <div className="event-icon text-2xl">
        {getEventIcon(event.actionType)}
      </div>
      <div className="event-content flex-1">{getEventDetails()}</div>
    </div>
  );
};

// Filter panel component
const HistoryFilterPanel = ({
  loadId,
  onFilterChange,
}: {
  loadId: Id<"loads">;
  onFilterChange: (filters: any) => void;
}) => {
  // Filter state
  const [filters, setFilters] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    actionType: string;
    userId: Id<"users"> | null;
    searchTerm: string;
  }>({
    startDate: null,
    endDate: null,
    actionType: "all",
    userId: null,
    searchTerm: "",
  });

  // Loading state
  const [isExporting, setIsExporting] = useState(false);

  // Get users for user filter dropdown
  const users = useQuery(api.users.listUsers);

  // Handle filter changes
  const handleFilterChange = (field: string, value: any) => {
    const newFilters = {
      ...filters,
      [field]: value,
    };

    setFilters(newFilters);

    // Convert dates to ISO strings for the API
    onFilterChange({
      startDate: newFilters.startDate?.toISOString() || undefined,
      endDate: newFilters.endDate?.toISOString() || undefined,
      actionType:
        newFilters.actionType === "all" ? undefined : newFilters.actionType,
      userId: newFilters.userId || undefined,
      searchTerm: newFilters.searchTerm || undefined,
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      startDate: null,
      endDate: null,
      actionType: "all",
      userId: null,
      searchTerm: "",
    };

    setFilters(resetFilters);
    onFilterChange({});
  };

  // Get filtered history for export
  const filteredHistory = useQuery(api.loadHistory.getFilteredLoadHistory, {
    loadId,
    filters: {
      startDate: filters.startDate?.toISOString() || undefined,
      endDate: filters.endDate?.toISOString() || undefined,
      actionType: filters.actionType === "all" ? undefined : filters.actionType,
      userId: filters.userId || undefined,
      searchTerm: filters.searchTerm || undefined,
    },
  });

  // Export function
  const handleExport = async () => {
    if (!filteredHistory) return;

    setIsExporting(true);

    try {
      // Convert history data to CSV format
      const headers = ["Timestamp", "Action Type", "User", "Description"];
      const rows = filteredHistory.map((event) => [
        new Date(event.timestamp).toLocaleString(),
        event.actionType,
        users?.find((u) => u._id === event.userId)?.name || "Unknown",
        event.details.description,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `load-${loadId}-history.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="history-filter-panel mb-6 p-4 border rounded-lg bg-card">
      <h4 className="text-lg font-medium mb-4">Filter History</h4>

      {/* Search input */}
      <div className="search-container mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in descriptions..."
            className="pl-8"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
          />
        </div>
      </div>

      <div className="filter-row grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="filter-group">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate || undefined}
                onSelect={(date) => handleFilterChange("startDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="filter-group">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate || undefined}
                onSelect={(date) => handleFilterChange("endDate", date)}
                initialFocus
                disabled={(date) =>
                  filters.startDate ? date < filters.startDate : false
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="filter-group">
          <label className="block text-sm font-medium mb-1">Action Type</label>
          <Select
            value={filters.actionType}
            onValueChange={(value) => handleFilterChange("actionType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action type" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="filter-actions flex justify-between">
        <Button variant="outline" onClick={handleResetFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!filteredHistory || isExporting}
          className="export-button"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>
    </div>
  );
};

// Role-based history view component
const RoleBasedHistoryView = ({
  loadId,
  role = "shipper",
}: {
  loadId: Id<"loads">;
  role?: string;
}) => {
  const [activeFilters, setActiveFilters] = useState<any>({});

  // Get role-specific history
  const user = useQuery(api.users.getCurrentUser);
  const historyEvents = useQuery(api.loadHistory.getLoadHistoryByRole, {
    loadId,
    userId: user?._id as Id<"users">,
    role,
    filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
  });

  // Role-specific action type options
  const getActionTypeOptions = () => {
    const commonOptions = [
      { value: "all", label: "All Actions" },
      { value: "STATUS_CHANGE", label: "Status Change" },
    ];

    if (role === "shipper") {
      return [
        ...commonOptions,
        { value: "CARRIER_ASSIGNED", label: "Carrier Assigned" },
        { value: "DELIVERY_CONFIRMED", label: "Delivery Confirmed" },
      ];
    } else if (role === "carrier") {
      return [
        ...commonOptions,
        { value: "DRIVER_ASSIGNED", label: "Driver Assigned" },
        { value: "ROUTE_MODIFIED", label: "Route Modified" },
        { value: "DELIVERY_CONFIRMED", label: "Delivery Confirmed" },
      ];
    } else {
      // Admin sees all options
      return ACTION_TYPES;
    }
  };

  if (!user) {
    return <div className="p-4">Loading user information...</div>;
  }

  return (
    <div className="role-based-history p-4">
      <div className="role-indicator mb-4">
        Viewing as:{" "}
        <span className="role-badge px-2 py-1 bg-primary/10 text-primary rounded-md">
          {role}
        </span>
      </div>

      {/* Filter panel */}
      <HistoryFilterPanel loadId={loadId} onFilterChange={setActiveFilters} />

      {/* Timeline display */}
      <div className="timeline-container">
        <h3 className="text-xl font-bold mb-4">Load History</h3>

        {!historyEvents && (
          <div className="loading p-4">Loading history...</div>
        )}

        {historyEvents?.length === 0 && (
          <div className="empty-state p-4 text-center border rounded-md">
            No history events found for this load.
          </div>
        )}

        {historyEvents?.map((event) => (
          <TimelineEvent key={event._id} event={event} role={role} />
        ))}
      </div>
    </div>
  );
};

// Main timeline component
const LoadHistoryTimeline = ({ loadId }: { loadId: Id<"loads"> }) => {
  const historyEvents = useQuery(api.loadHistory.getLoadHistory, { loadId });
  const user = useQuery(api.users.getCurrentUser);

  if (!user) {
    return <div className="loading p-4">Loading user information...</div>;
  }

  // Determine user role for role-based view
  return <RoleBasedHistoryView loadId={loadId} role={user.role} />;
};

export default LoadHistoryTimeline;
