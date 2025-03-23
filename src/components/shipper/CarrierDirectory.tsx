import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, Truck, Star } from "lucide-react";

interface Carrier {
  id: string;
  name: string;
  location: string;
  fleetSize: string;
  rating: number;
}

export default function CarrierDirectory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCarrierDialog, setShowAddCarrierDialog] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showCarrierProfileDialog, setShowCarrierProfileDialog] =
    useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

  // New carrier form state
  const [newCarrier, setNewCarrier] = useState({
    name: "",
    location: "",
    fleetSize: "",
    mcNumber: "",
    dotNumber: "",
    email: "",
    phone: "",
    contactName: "",
  });

  // Filter states
  const [filters, setFilters] = useState({
    minRating: 0,
    minFleetSize: 0,
    locations: [] as string[],
    verifiedOnly: false,
  });

  const [carriers, setCarriers] = useState<Carrier[]>([
    {
      id: "1",
      name: "FastFreight Logistics #1",
      location: "Chicago, IL",
      fleetSize: "50+ trucks",
      rating: 4.8,
    },
    {
      id: "2",
      name: "FastFreight Logistics #2",
      location: "Chicago, IL",
      fleetSize: "50+ trucks",
      rating: 4.8,
    },
    {
      id: "3",
      name: "FastFreight Logistics #3",
      location: "Chicago, IL",
      fleetSize: "50+ trucks",
      rating: 4.8,
    },
  ]);

  const handleAddCarrier = () => {
    if (!newCarrier.name || !newCarrier.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newCarrierObj: Carrier = {
      id: `${carriers.length + 1}`,
      name: newCarrier.name,
      location: newCarrier.location,
      fleetSize: newCarrier.fleetSize || "Unknown",
      rating: 0,
    };

    setCarriers([...carriers, newCarrierObj]);
    setShowAddCarrierDialog(false);

    // Reset form
    setNewCarrier({
      name: "",
      location: "",
      fleetSize: "",
      mcNumber: "",
      dotNumber: "",
      email: "",
      phone: "",
      contactName: "",
    });

    toast({
      title: "Carrier Added",
      description: `${newCarrierObj.name} has been added to your carrier directory.`,
      variant: "success",
    });
  };

  const handleViewProfile = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setShowCarrierProfileDialog(true);
  };

  const handleApplyFilters = () => {
    setShowFilterPopover(false);

    toast({
      title: "Filters Applied",
      description: "Your carrier filters have been applied.",
      variant: "success",
    });
  };

  const resetFilters = () => {
    setFilters({
      minRating: 0,
      minFleetSize: 0,
      locations: [],
      verifiedOnly: false,
    });

    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
    });
  };

  // Filter carriers based on search query and filters
  const filteredCarriers = carriers.filter((carrier) => {
    if (
      searchQuery &&
      !carrier.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    if (filters.minRating > 0 && carrier.rating < filters.minRating) {
      return false;
    }

    if (filters.verifiedOnly) {
      // In a real app, you would check if the carrier is verified
      // For this demo, let's assume all carriers with ID < 3 are verified
      if (parseInt(carrier.id) >= 3) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Carrier Directory</h1>
        <Button
          onClick={() => setShowAddCarrierDialog(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          <Truck className="h-4 w-4 mr-2" />
          Add Carrier
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search carriers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
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
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Carriers</h4>

                  <div className="space-y-2">
                    <Label>Minimum Rating</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        placeholder="0"
                        value={filters.minRating || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minRating: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <span>out of 5</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Fleet Size</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={filters.minFleetSize || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minFleetSize: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Other Options</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified-only"
                        checked={filters.verifiedOnly}
                        onCheckedChange={(checked) =>
                          setFilters({
                            ...filters,
                            verifiedOnly: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor="verified-only"
                        className="text-sm font-medium leading-none"
                      >
                        Show verified carriers only
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleApplyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredCarriers.map((carrier) => (
          <Card key={carrier.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{carrier.name}</h3>
                  <Badge variant="outline" className="text-yellow-600">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {carrier.rating}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  Based in {carrier.location} • {carrier.fleetSize}
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={() => handleViewProfile(carrier)}
              >
                View Profile
              </Button>
            </div>
          </Card>
        ))}

        {filteredCarriers.length === 0 && (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No carriers found matching your criteria.
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

      {/* Add Carrier Dialog */}
      <Dialog
        open={showAddCarrierDialog}
        onOpenChange={setShowAddCarrierDialog}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Carrier</DialogTitle>
            <DialogDescription>
              Enter carrier details to add them to your directory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier-name">Carrier Name *</Label>
                <Input
                  id="carrier-name"
                  placeholder="Enter carrier name"
                  value={newCarrier.name}
                  onChange={(e) =>
                    setNewCarrier({ ...newCarrier, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier-location">Location *</Label>
                <Input
                  id="carrier-location"
                  placeholder="City, State"
                  value={newCarrier.location}
                  onChange={(e) =>
                    setNewCarrier({ ...newCarrier, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier-fleet">Fleet Size</Label>
                <Input
                  id="carrier-fleet"
                  placeholder="e.g., 50+ trucks"
                  value={newCarrier.fleetSize}
                  onChange={(e) =>
                    setNewCarrier({ ...newCarrier, fleetSize: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier-mc">MC Number</Label>
                <Input
                  id="carrier-mc"
                  placeholder="MC-XXXXXX"
                  value={newCarrier.mcNumber}
                  onChange={(e) =>
                    setNewCarrier({ ...newCarrier, mcNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier-dot">DOT Number</Label>
                <Input
                  id="carrier-dot"
                  placeholder="XXXXXXX"
                  value={newCarrier.dotNumber}
                  onChange={(e) =>
                    setNewCarrier({ ...newCarrier, dotNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier-email">Email</Label>
                <Input
                  id="carrier-email"
                  type="email"
                  placeholder="contact@carrier.com"
                  value={newCarrier.email}
                  onChange={(e) =>
                    setNewCarrier({ ...newCarrier, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier-phone">Phone</Label>
                <Input
                  id="carrier-phone"
                  placeholder="(555) 123-4567"
                  value={newCarrier.phone}
                  onChange={(e) =>
                    setNewCarrier({ ...newCarrier, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier-contact">Contact Person</Label>
                <Input
                  id="carrier-contact"
                  placeholder="John Doe"
                  value={newCarrier.contactName}
                  onChange={(e) =>
                    setNewCarrier({
                      ...newCarrier,
                      contactName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCarrierDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCarrier}>Add Carrier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Carrier Profile Dialog */}
      <Dialog
        open={showCarrierProfileDialog}
        onOpenChange={setShowCarrierProfileDialog}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Carrier Profile</DialogTitle>
            <DialogDescription>{selectedCarrier?.name}</DialogDescription>
          </DialogHeader>

          {selectedCarrier && (
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedCarrier.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fleet Size</p>
                  <p className="font-medium">{selectedCarrier.fleetSize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-medium">
                      {selectedCarrier.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">On-Time Delivery</p>
                    <p className="font-medium">98%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Claims Rate</p>
                    <p className="font-medium">0.5%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Response Time</p>
                    <p className="font-medium">1.2 hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed Loads</p>
                    <p className="font-medium">245</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      contact@
                      {selectedCarrier.name.toLowerCase().replace(/\s+/g, "")}
                      .com
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">(555) 123-4567</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">John Smith</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Compliance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">MC Number</p>
                    <p className="font-medium">MC-123456</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DOT Number</p>
                    <p className="font-medium">1234567</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Insurance</p>
                    <p className="font-medium">$1M / $2M</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Safety Rating</p>
                    <p className="font-medium">Satisfactory</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCarrierProfileDialog(false)}
            >
              Close
            </Button>
            <Button>Contact Carrier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
