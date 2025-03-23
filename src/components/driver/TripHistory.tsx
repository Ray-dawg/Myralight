import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Calendar,
  Download,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  CalendarDays,
  Truck,
} from "lucide-react";

interface Trip {
  id: string;
  from: string;
  to: string;
  date: string;
  distance: string;
  duration: string;
  status: "completed" | "cancelled";
  earnings: number;
  details?: {
    loadType?: string;
    weight?: string;
    pickupTime?: string;
    deliveryTime?: string;
    client?: string;
    notes?: string;
    stops?: Array<{
      location: string;
      time: string;
      status: "completed" | "pending";
    }>;
  };
}

export default function TripHistory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    dateRange: {
      from: "",
      to: "",
    },
    minDistance: "",
    maxDistance: "",
  });

  const [trips, setTrips] = useState<Trip[]>([
    {
      id: "T-1234",
      from: "Chicago, IL",
      to: "Milwaukee, WI",
      date: "2024-02-15",
      distance: "92 miles",
      duration: "2h 15m",
      status: "completed",
      earnings: 850,
      details: {
        loadType: "General Freight",
        weight: "12,500 lbs",
        pickupTime: "08:30 AM",
        deliveryTime: "10:45 AM",
        client: "ABC Logistics",
        notes: "Delivered on time, no issues.",
        stops: [
          {
            location: "Chicago Distribution Center",
            time: "08:30 AM",
            status: "completed",
          },
          {
            location: "Milwaukee Warehouse",
            time: "10:45 AM",
            status: "completed",
          },
        ],
      },
    },
    {
      id: "T-1235",
      from: "Milwaukee, WI",
      to: "Minneapolis, MN",
      date: "2024-02-14",
      distance: "337 miles",
      duration: "5h 45m",
      status: "completed",
      earnings: 1200,
      details: {
        loadType: "Refrigerated",
        weight: "18,000 lbs",
        pickupTime: "07:00 AM",
        deliveryTime: "12:45 PM",
        client: "Fresh Foods Inc.",
        notes: "Temperature maintained at 34°F throughout transit.",
        stops: [
          {
            location: "Milwaukee Cold Storage",
            time: "07:00 AM",
            status: "completed",
          },
          {
            location: "Madison Rest Stop",
            time: "09:30 AM",
            status: "completed",
          },
          {
            location: "Minneapolis Distribution Center",
            time: "12:45 PM",
            status: "completed",
          },
        ],
      },
    },
    {
      id: "T-1236",
      from: "Minneapolis, MN",
      to: "Des Moines, IA",
      date: "2024-02-13",
      distance: "244 miles",
      duration: "4h 30m",
      status: "cancelled",
      earnings: 0,
      details: {
        loadType: "Dry Van",
        weight: "15,000 lbs",
        pickupTime: "09:00 AM",
        client: "Midwest Distributors",
        notes: "Cancelled due to severe weather conditions.",
      },
    },
    {
      id: "T-1237",
      from: "Des Moines, IA",
      to: "Kansas City, MO",
      date: "2024-02-12",
      distance: "200 miles",
      duration: "3h 45m",
      status: "completed",
      earnings: 750,
      details: {
        loadType: "Flatbed",
        weight: "22,000 lbs",
        pickupTime: "10:15 AM",
        deliveryTime: "01:25 PM",
        client: "Construction Supplies Co.",
        notes: "Load secured with extra straps due to high winds.",
        stops: [
          {
            location: "Des Moines Warehouse",
            time: "10:15 AM",
            status: "completed",
          },
          {
            location: "Kansas City Depot",
            time: "01:25 PM",
            status: "completed",
          },
        ],
      },
    },
  ]);

  const StatusBadge = ({ status }: { status: Trip["status"] }) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={styles[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowTripDetails(true);
  };

  const handleExport = (format: string) => {
    toast({
      title: "Exporting Trip History",
      description: `Your trip history is being prepared for download as ${format.toUpperCase()}...`,
    });

    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Trip history has been exported as ${format.toUpperCase()}.`,
        variant: "success",
      });
    }, 1500);
  };

  const applyFilters = () => {
    setShowFilterPopover(false);
    toast({
      title: "Filters Applied",
      description: "Trip history has been filtered according to your criteria.",
      variant: "success",
    });
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      dateRange: {
        from: "",
        to: "",
      },
      minDistance: "",
      maxDistance: "",
    });
    setShowFilterPopover(false);
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
      variant: "success",
    });
  };

  // Filter trips based on search query and filters
  const filteredTrips = trips.filter((trip) => {
    // Search query filter
    const matchesSearch =
      !searchQuery ||
      trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.to.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = !filters.status || trip.status === filters.status;

    // Date range filter
    const matchesDateRange = () => {
      if (!filters.dateRange.from && !filters.dateRange.to) return true;

      const tripDate = new Date(trip.date);
      const fromDate = filters.dateRange.from
        ? new Date(filters.dateRange.from)
        : null;
      const toDate = filters.dateRange.to
        ? new Date(filters.dateRange.to)
        : null;

      if (fromDate && toDate) {
        return tripDate >= fromDate && tripDate <= toDate;
      } else if (fromDate) {
        return tripDate >= fromDate;
      } else if (toDate) {
        return tripDate <= toDate;
      }

      return true;
    };

    return matchesSearch && matchesStatus && matchesDateRange();
  });

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Trip History</h1>
            <div className="text-sm text-gray-500">
              {trips.filter((t) => t.status === "completed").length} completed
              trips
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover
              open={showCalendarPopover}
              onOpenChange={setShowCalendarPopover}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium">Select Date Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs">From</label>
                      <Input
                        type="date"
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
                      <label className="text-xs">To</label>
                      <Input
                        type="date"
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
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          ...filters,
                          dateRange: { from: "", to: "" },
                        });
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowCalendarPopover(false);
                        toast({
                          title: "Date Range Applied",
                          description: "Trips filtered by selected date range.",
                          variant: "success",
                        });
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover
              open={showFilterPopover}
              onOpenChange={setShowFilterPopover}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-blue-400 hover:bg-blue-500 text-black"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Trips</h4>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                    >
                      <option value="">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search trips by ID, location..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Trips List */}
        <div className="space-y-4">
          {filteredTrips.length > 0 ? (
            filteredTrips.map((trip) => (
              <Card key={trip.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{trip.id}</h3>
                      <StatusBadge status={trip.status} />
                    </div>
                    <div className="text-sm text-gray-500">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div>
                          <span className="font-medium">From:</span> {trip.from}
                        </div>
                        <div>
                          <span className="font-medium">Distance:</span>{" "}
                          {trip.distance}
                        </div>
                        <div>
                          <span className="font-medium">To:</span> {trip.to}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>{" "}
                          {trip.duration}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">{trip.date}</span>
                      {trip.status === "completed" && (
                        <span className="font-medium text-green-600">
                          ${trip.earnings}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                    onClick={() => handleViewDetails(trip)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No trips found matching your search criteria.
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Trip Details Dialog */}
      <Dialog open={showTripDetails} onOpenChange={setShowTripDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>
              {selectedTrip?.id} - {selectedTrip?.from} to {selectedTrip?.to}
            </DialogDescription>
          </DialogHeader>

          {selectedTrip && (
            <div className="py-4 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">
                    {selectedTrip.details?.loadType || "General Freight"}
                  </span>
                </div>
                <StatusBadge status={selectedTrip.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="font-medium">{selectedTrip.from}</p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-medium">{selectedTrip.to}</p>
                </div>
                <div>
                  <p className="text-gray-500">Distance</p>
                  <p className="font-medium">{selectedTrip.distance}</p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-medium">{selectedTrip.duration}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{selectedTrip.date}</p>
                </div>
                {selectedTrip.details?.weight && (
                  <div>
                    <p className="text-gray-500">Weight</p>
                    <p className="font-medium">{selectedTrip.details.weight}</p>
                  </div>
                )}
                {selectedTrip.details?.pickupTime && (
                  <div>
                    <p className="text-gray-500">Pickup Time</p>
                    <p className="font-medium">
                      {selectedTrip.details.pickupTime}
                    </p>
                  </div>
                )}
                {selectedTrip.details?.deliveryTime && (
                  <div>
                    <p className="text-gray-500">Delivery Time</p>
                    <p className="font-medium">
                      {selectedTrip.details.deliveryTime}
                    </p>
                  </div>
                )}
                {selectedTrip.details?.client && (
                  <div>
                    <p className="text-gray-500">Client</p>
                    <p className="font-medium">{selectedTrip.details.client}</p>
                  </div>
                )}
                {selectedTrip.status === "completed" && (
                  <div>
                    <p className="text-gray-500">Payment</p>
                    <p className="font-medium text-green-600">
                      ${selectedTrip.earnings}
                    </p>
                  </div>
                )}
              </div>

              {selectedTrip.details?.notes && (
                <div>
                  <p className="text-gray-500 mb-1">Notes</p>
                  <p className="text-sm p-3 bg-gray-50 rounded-md">
                    {selectedTrip.details.notes}
                  </p>
                </div>
              )}

              {selectedTrip.details?.stops &&
                selectedTrip.details.stops.length > 0 && (
                  <div>
                    <p className="text-gray-500 mb-2">Stops</p>
                    <div className="space-y-3">
                      {selectedTrip.details.stops.map((stop, index) => (
                        <div
                          key={index}
                          className="flex items-start p-3 bg-gray-50 rounded-md"
                        >
                          <div className="mr-3 mt-1">
                            <div className="h-4 w-4 rounded-full bg-green-500"></div>
                            {index < selectedTrip.details.stops.length - 1 && (
                              <div className="h-full w-0.5 bg-gray-200 mx-auto mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{stop.location}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{stop.time}</span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTripDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
