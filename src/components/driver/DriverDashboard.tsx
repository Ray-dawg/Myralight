import React, { useState } from "react";
import {
  AlertTriangle,
  Minimize2,
  X,
  Filter,
  Clock,
  MapPin,
  DollarSign,
  Truck,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const FloatingCard = ({ title, children, onClose, onMinimize }) => (
  <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
    <CardContent className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{title}</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="h-6 w-6"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {children}
    </CardContent>
  </Card>
);

export default function DriverDashboard() {
  const { toast } = useToast();
  const [showCards, setShowCards] = useState({
    trip: true,
    nextStop: true,
    alert: true,
    load: true,
  });
  const [minimizedCards, setMinimizedCards] = useState({
    trip: false,
    nextStop: false,
    alert: false,
    load: false,
  });

  // Filter states
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showRatePopover, setShowRatePopover] = useState(false);
  const [showTimePopover, setShowTimePopover] = useState(false);
  const [showTypePopover, setShowTypePopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    distance: [0, 500],
    payRange: [0, 5000],
    savedSearches: false,
  });

  const [rateFilters, setRateFilters] = useState({
    minRate: "",
    maxRate: "",
    rateType: "all",
  });

  const [timeFilters, setTimeFilters] = useState({
    pickupDate: "",
    deliveryDate: "",
    timeOfDay: "all",
  });

  const [typeFilters, setTypeFilters] = useState({
    dryVan: true,
    refrigerated: false,
    flatbed: false,
    tanker: false,
    other: false,
  });

  const mockRoute = {
    currentLocation: {
      address: "Chicago, IL",
      coordinates: { lat: 41.8781, lng: -87.6298 },
    },
    destination: {
      address: "Milwaukee, WI",
      coordinates: { lat: 43.0389, lng: -87.9065 },
    },
    eta: "11:30 AM",
    distance: "92.5 miles",
    nextStop: {
      type: "Fuel",
      location: "Love's Travel Stop",
      distance: "45 miles",
      timeUntil: "45 min",
    },
    alerts: [
      {
        type: "Weather",
        severity: "warning",
        message: "Heavy rain expected on I-94",
      },
    ],
    load: {
      id: "L-1234",
      type: "Dry Van",
      timeRemaining: "5h remaining",
      pickup: {
        location: "Chicago, IL",
        time: "Today, 2:00 PM",
      },
      delivery: {
        location: "Milwaukee, WI",
        time: "Today, 5:00 PM",
      },
    },
  };

  const handleMinimizeCard = (cardType) => {
    setMinimizedCards((prev) => ({
      ...prev,
      [cardType]: !prev[cardType],
    }));

    toast({
      title: "Card Updated",
      description: `Card has been ${minimizedCards[cardType] ? "expanded" : "minimized"}.`,
    });
  };

  const handleCloseCard = (cardType) => {
    setShowCards((prev) => ({
      ...prev,
      [cardType]: false,
    }));

    toast({
      title: "Card Closed",
      description: "Card has been closed. You can restore it from settings.",
    });
  };

  const handleApplyFilters = () => {
    setShowFilterPopover(false);

    toast({
      title: "Filters Applied",
      description: "Your search filters have been applied.",
      variant: "success",
    });
  };

  const handleApplyRateFilters = () => {
    setShowRatePopover(false);

    toast({
      title: "Rate Filters Applied",
      description: `Showing loads with rates between $${rateFilters.minRate || "0"} and $${rateFilters.maxRate || "5000"}.`,
      variant: "success",
    });
  };

  const handleApplyTimeFilters = () => {
    setShowTimePopover(false);

    toast({
      title: "Time Filters Applied",
      description: "Your time preferences have been applied to the search.",
      variant: "success",
    });
  };

  const handleApplyTypeFilters = () => {
    setShowTypePopover(false);

    const selectedTypes = Object.entries(typeFilters)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(", ");

    toast({
      title: "Load Types Applied",
      description: `Showing ${selectedTypes || "all"} load types.`,
      variant: "success",
    });
  };

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gray-100">
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          <span className="ml-2">Google Maps would render here</span>
        </div>
      </div>

      {/* Floating Cards */}
      <div className="absolute top-4 left-4 right-4 md:right-auto md:w-96 space-y-4 pointer-events-auto">
        {showCards.trip && (
          <FloatingCard
            title="Current Trip"
            onClose={() => handleCloseCard("trip")}
            onMinimize={() => handleMinimizeCard("trip")}
          >
            {!minimizedCards.trip && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Location</p>
                    <p className="font-medium">
                      {mockRoute.currentLocation.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium">
                      {mockRoute.destination.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-sm font-medium">
                      ETA: {mockRoute.eta}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    AI Enhanced
                  </Badge>
                </div>
                <div className="bg-blue-50 p-2 rounded-md text-xs border border-blue-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-blue-700">
                      AI Route Insight
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-700">Confidence:</span>
                      <div className="w-12 h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: "85%" }}
                        ></div>
                      </div>
                      <span className="text-blue-700">85%</span>
                    </div>
                  </div>
                  <p className="text-blue-700">
                    Taking I-94 W is optimal. Construction on Highway 43 is
                    causing 15-minute delays. Your current route avoids this
                    delay.
                  </p>
                  <div className="flex justify-end mt-1">
                    <button className="text-blue-700 hover:text-blue-900 text-xs flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                      Helpful
                    </button>
                  </div>
                </div>
              </div>
            )}
          </FloatingCard>
        )}

        {showCards.nextStop && (
          <FloatingCard
            title="Next Stop"
            onClose={() => handleCloseCard("nextStop")}
            onMinimize={() => handleMinimizeCard("nextStop")}
          >
            {!minimizedCards.nextStop && (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <p className="font-medium">{mockRoute.nextStop.location}</p>
                    <p className="text-sm text-gray-500">
                      {mockRoute.nextStop.distance} •{" "}
                      {mockRoute.nextStop.timeUntil}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 p-2 rounded-md text-xs border border-blue-200">
                  <div className="flex items-center gap-1 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-700"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span className="font-medium text-blue-700">
                      AI Recommendation
                    </span>
                  </div>
                  <p className="text-blue-700">
                    This stop has 3 diesel pumps available now. Fuel prices are
                    $0.15/gal lower than the next stop on your route.
                  </p>
                </div>
              </div>
            )}
          </FloatingCard>
        )}

        {showCards.alert &&
          mockRoute.alerts.map((alert, index) => (
            <FloatingCard
              key={index}
              title="Weather Alert"
              onClose={() => handleCloseCard("alert")}
              onMinimize={() => handleMinimizeCard("alert")}
            >
              {!minimizedCards.alert && (
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-600">
                      {alert.type} Alert
                    </p>
                    <p className="text-sm mt-1">{alert.message}</p>
                  </div>
                </div>
              )}
            </FloatingCard>
          ))}

        {showCards.load && (
          <FloatingCard
            title={`Load ${mockRoute.load.id}`}
            onClose={() => handleCloseCard("load")}
            onMinimize={() => handleMinimizeCard("load")}
          >
            {!minimizedCards.load && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{mockRoute.load.type}</Badge>
                  <span className="text-sm text-gray-500">
                    {mockRoute.load.timeRemaining}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pickup</p>
                      <p className="font-medium">
                        {mockRoute.load.pickup.location}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mockRoute.load.pickup.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Delivery</p>
                      <p className="font-medium">
                        {mockRoute.load.delivery.location}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mockRoute.load.delivery.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </FloatingCard>
        )}
      </div>

      {/* Search bar with filter buttons at the bottom */}
      <div className="absolute bottom-20 md:bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl p-4">
          <div className="relative">
            <Input
              placeholder="Search loads..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 mt-3">
            <Popover
              open={showFilterPopover}
              onOpenChange={setShowFilterPopover}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Loads</h4>

                  <div className="space-y-2">
                    <Label>Distance (miles)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.distance[0]}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            distance: [
                              parseInt(e.target.value) || 0,
                              filters.distance[1],
                            ],
                          })
                        }
                      />
                      <span>to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.distance[1]}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            distance: [
                              filters.distance[0],
                              parseInt(e.target.value) || 500,
                            ],
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pay Range ($)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.payRange[0]}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            payRange: [
                              parseInt(e.target.value) || 0,
                              filters.payRange[1],
                            ],
                          })
                        }
                      />
                      <span>to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.payRange[1]}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            payRange: [
                              filters.payRange[0],
                              parseInt(e.target.value) || 5000,
                            ],
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Other Options</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saved-searches"
                        checked={filters.savedSearches}
                        onCheckedChange={(checked) =>
                          setFilters({
                            ...filters,
                            savedSearches: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor="saved-searches"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show only saved searches
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters({
                          distance: [0, 500],
                          payRange: [0, 5000],
                          savedSearches: false,
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleApplyFilters}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={showRatePopover} onOpenChange={setShowRatePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Rate
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Rate Filters</h4>

                  <div className="space-y-2">
                    <Label>Rate Range ($)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={rateFilters.minRate}
                        onChange={(e) =>
                          setRateFilters({
                            ...rateFilters,
                            minRate: e.target.value,
                          })
                        }
                      />
                      <span>to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={rateFilters.maxRate}
                        onChange={(e) =>
                          setRateFilters({
                            ...rateFilters,
                            maxRate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rate Type</Label>
                    <Select
                      value={rateFilters.rateType}
                      onValueChange={(value) =>
                        setRateFilters({ ...rateFilters, rateType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rate type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rates</SelectItem>
                        <SelectItem value="per_mile">Per Mile</SelectItem>
                        <SelectItem value="flat">Flat Rate</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRateFilters({
                          minRate: "",
                          maxRate: "",
                          rateType: "all",
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleApplyRateFilters}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={showTimePopover} onOpenChange={setShowTimePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Time
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Time Filters</h4>

                  <div className="space-y-2">
                    <Label>Pickup Date</Label>
                    <Input
                      type="date"
                      value={timeFilters.pickupDate}
                      onChange={(e) =>
                        setTimeFilters({
                          ...timeFilters,
                          pickupDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={timeFilters.deliveryDate}
                      onChange={(e) =>
                        setTimeFilters({
                          ...timeFilters,
                          deliveryDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time of Day</Label>
                    <Select
                      value={timeFilters.timeOfDay}
                      onValueChange={(value) =>
                        setTimeFilters({ ...timeFilters, timeOfDay: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Time</SelectItem>
                        <SelectItem value="morning">
                          Morning (6AM-12PM)
                        </SelectItem>
                        <SelectItem value="afternoon">
                          Afternoon (12PM-6PM)
                        </SelectItem>
                        <SelectItem value="evening">
                          Evening (6PM-12AM)
                        </SelectItem>
                        <SelectItem value="night">Night (12AM-6AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTimeFilters({
                          pickupDate: "",
                          deliveryDate: "",
                          timeOfDay: "all",
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleApplyTimeFilters}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={showTypePopover} onOpenChange={setShowTypePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Type
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Load Types</h4>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-dryvan"
                        checked={typeFilters.dryVan}
                        onCheckedChange={(checked) =>
                          setTypeFilters({
                            ...typeFilters,
                            dryVan: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor="type-dryvan"
                        className="text-sm font-medium leading-none"
                      >
                        Dry Van
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-reefer"
                        checked={typeFilters.refrigerated}
                        onCheckedChange={(checked) =>
                          setTypeFilters({
                            ...typeFilters,
                            refrigerated: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor="type-reefer"
                        className="text-sm font-medium leading-none"
                      >
                        Refrigerated
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-flatbed"
                        checked={typeFilters.flatbed}
                        onCheckedChange={(checked) =>
                          setTypeFilters({
                            ...typeFilters,
                            flatbed: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor="type-flatbed"
                        className="text-sm font-medium leading-none"
                      >
                        Flatbed
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-tanker"
                        checked={typeFilters.tanker}
                        onCheckedChange={(checked) =>
                          setTypeFilters({
                            ...typeFilters,
                            tanker: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor="type-tanker"
                        className="text-sm font-medium leading-none"
                      >
                        Tanker
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-other"
                        checked={typeFilters.other}
                        onCheckedChange={(checked) =>
                          setTypeFilters({
                            ...typeFilters,
                            other: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor="type-other"
                        className="text-sm font-medium leading-none"
                      >
                        Other
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTypeFilters({
                          dryVan: true,
                          refrigerated: false,
                          flatbed: false,
                          tanker: false,
                          other: false,
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleApplyTypeFilters}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
