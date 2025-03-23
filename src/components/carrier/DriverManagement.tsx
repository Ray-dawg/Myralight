import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import {
  User,
  UserPlus,
  Search,
  Shield,
  MapPin,
  Calendar,
  FileText,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  Eye,
  Download,
  Upload,
  Phone,
  Mail,
  Truck,
  FileCheck,
  Ban,
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "on_break" | "off_duty" | "suspended";
  currentLoad?: string;
  location: string;
  performance: {
    rating: number;
    onTimeDelivery: number;
    safetyScore: number;
    fuelEfficiency: number;
  };
  compliance: {
    hoursAvailable: number;
    lastBreak: string;
    violations: number;
    nextMedicalExam?: string;
    nextDrugTest?: string;
  };
  documents: Array<{
    id: string;
    type: string;
    status: "valid" | "expiring" | "expired";
    expiresIn: string;
    fileName: string;
  }>;
  metrics: {
    completedLoads: number;
    totalMiles: string;
    avgRatingLast30: number;
    incidentsLast30: number;
  };
  earnings: {
    currentMonth: number;
    trend: string;
    bonusEligible?: boolean;
  };
  vehicle?: {
    id: string;
    number: string;
    status: "active" | "maintenance";
  };
}

export default function DriverManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [showDriverProfileDialog, setShowDriverProfileDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");

  // New driver form state
  const [newDriver, setNewDriver] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseState: "",
    licenseExpiry: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    emergencyContact: "",
    emergencyPhone: "",
    driverLicense: null as File | null,
    medicalCard: null as File | null,
  });

  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "D001",
      name: "John Anderson",
      email: "john.anderson@example.com",
      phone: "(555) 123-4567",
      status: "active",
      currentLoad: "LDG-2024-156",
      location: "Chicago, IL",
      performance: {
        rating: 4.8,
        onTimeDelivery: 98,
        safetyScore: 95,
        fuelEfficiency: 92,
      },
      compliance: {
        hoursAvailable: 6.5,
        lastBreak: "2h ago",
        violations: 0,
        nextMedicalExam: "2024-08-15",
        nextDrugTest: "2024-05-20",
      },
      documents: [
        {
          id: "doc1",
          type: "CDL",
          status: "valid",
          expiresIn: "8 months",
          fileName: "cdl_license.pdf",
        },
        {
          id: "doc2",
          type: "Medical Card",
          status: "expiring",
          expiresIn: "30 days",
          fileName: "medical_card.pdf",
        },
      ],
      metrics: {
        completedLoads: 145,
        totalMiles: "24,500",
        avgRatingLast30: 4.9,
        incidentsLast30: 0,
      },
      earnings: {
        currentMonth: 8500,
        trend: "+12%",
        bonusEligible: true,
      },
      vehicle: {
        id: "TRK001",
        number: "TRK-2024-156",
        status: "active",
      },
    },
    {
      id: "D002",
      name: "Sarah Martinez",
      email: "sarah.martinez@example.com",
      phone: "(555) 987-6543",
      status: "on_break",
      location: "Detroit, MI",
      performance: {
        rating: 4.9,
        onTimeDelivery: 99,
        safetyScore: 98,
        fuelEfficiency: 94,
      },
      compliance: {
        hoursAvailable: 8,
        lastBreak: "Just started",
        violations: 0,
        nextMedicalExam: "2024-09-10",
        nextDrugTest: "2024-06-15",
      },
      documents: [
        {
          id: "doc3",
          type: "CDL",
          status: "valid",
          expiresIn: "14 months",
          fileName: "cdl_license.pdf",
        },
        {
          id: "doc4",
          type: "Medical Card",
          status: "valid",
          expiresIn: "6 months",
          fileName: "medical_card.pdf",
        },
      ],
      metrics: {
        completedLoads: 162,
        totalMiles: "28,750",
        avgRatingLast30: 4.9,
        incidentsLast30: 0,
      },
      earnings: {
        currentMonth: 9200,
        trend: "+15%",
        bonusEligible: true,
      },
      vehicle: {
        id: "TRK002",
        number: "TRK-2024-157",
        status: "active",
      },
    },
  ]);

  const getStatusBadge = (status: Driver["status"]) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      on_break: "bg-yellow-100 text-yellow-800",
      off_duty: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800",
    };

    const labels = {
      active: "Active",
      on_break: "On Break",
      off_duty: "Off Duty",
      suspended: "Suspended",
    };

    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getDocumentStatus = (status: "valid" | "expiring" | "expired") => {
    const styles = {
      valid: "text-green-600",
      expiring: "text-yellow-600",
      expired: "text-red-600",
    };

    return styles[status];
  };

  const handleDriverLicenseChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setNewDriver({ ...newDriver, driverLicense: e.target.files[0] });
    }
  };

  const handleMedicalCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDriver({ ...newDriver, medicalCard: e.target.files[0] });
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleAddDriver = async () => {
    if (
      !newDriver.name ||
      !newDriver.email ||
      !newDriver.phone ||
      !newDriver.licenseNumber
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!newDriver.driverLicense) {
      toast({
        title: "Missing Document",
        description: "Please upload a driver's license.",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, we would upload the documents to storage
    // and create the user in Supabase Auth
    // For demo purposes, we'll just simulate this

    // Simulate creating a user in Supabase
    // const { data, error } = await supabase.auth.signUp({
    //   email: newDriver.email,
    //   password: generateRandomPassword(),
    //   options: {
    //     data: {
    //       name: newDriver.name,
    //       role: 'driver',
    //     }
    //   }
    // });

    // if (error) {
    //   toast({
    //     title: "Error Creating User",
    //     description: error.message,
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // Create a new driver object
    const newDriverObj: Driver = {
      id: `D${(drivers.length + 1).toString().padStart(3, "0")}`,
      name: newDriver.name,
      email: newDriver.email,
      phone: newDriver.phone,
      status: "off_duty",
      location: `${newDriver.city}, ${newDriver.state}`,
      performance: {
        rating: 0,
        onTimeDelivery: 0,
        safetyScore: 0,
        fuelEfficiency: 0,
      },
      compliance: {
        hoursAvailable: 11,
        lastBreak: "N/A",
        violations: 0,
        nextMedicalExam: newDriver.medicalCard ? "1 year from now" : undefined,
        nextDrugTest: "3 months from now",
      },
      documents: [
        {
          id: `doc${Math.floor(Math.random() * 1000)}`,
          type: "CDL",
          status: "valid",
          expiresIn: "1 year",
          fileName: newDriver.driverLicense?.name || "driver_license.pdf",
        },
      ],
      metrics: {
        completedLoads: 0,
        totalMiles: "0",
        avgRatingLast30: 0,
        incidentsLast30: 0,
      },
      earnings: {
        currentMonth: 0,
        trend: "0%",
      },
    };

    if (newDriver.medicalCard) {
      newDriverObj.documents.push({
        id: `doc${Math.floor(Math.random() * 1000)}`,
        type: "Medical Card",
        status: "valid",
        expiresIn: "1 year",
        fileName: newDriver.medicalCard.name,
      });
    }

    setDrivers([...drivers, newDriverObj]);
    setShowAddDriverDialog(false);

    // Reset form
    setNewDriver({
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      licenseState: "",
      licenseExpiry: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      emergencyContact: "",
      emergencyPhone: "",
      driverLicense: null,
      medicalCard: null,
    });

    toast({
      title: "Driver Added",
      description: `${newDriverObj.name} has been added to your team. An invitation email has been sent.`,
      variant: "success",
    });
  };

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter((driver) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      driver.name.toLowerCase().includes(query) ||
      driver.email.toLowerCase().includes(query) ||
      driver.id.toLowerCase().includes(query) ||
      driver.location.toLowerCase().includes(query) ||
      (driver.currentLoad && driver.currentLoad.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6 space-y-6 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Driver Management</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <span>
                {drivers.filter((d) => d.status === "active").length} Active
              </span>
            </div>
            <span>•</span>
            <span>{drivers.length} Total</span>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDriverDialog(true)}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Driver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold">
                  {drivers.filter((d) => d.status === "active").length}/
                  {drivers.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Currently on duty
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">
                  Fleet Performance
                </p>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-xs text-muted-foreground">All drivers</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Revenue/Driver
                </p>
                <p className="text-2xl font-bold">$8.2k</p>
                <p className="text-xs text-green-600">↑ 14% vs last month</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search drivers..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Driver Cards */}
      <div className="space-y-4">
        {filteredDrivers.length > 0 ? (
          filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Driver Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{driver.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {driver.id}
                        </p>
                      </div>
                      {getStatusBadge(driver.status)}
                    </div>
                    <div className="space-y-2">
                      {driver.currentLoad && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            Current Load:{" "}
                          </span>
                          {driver.currentLoad}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Location:{" "}
                        </span>
                        {driver.location}
                      </p>
                      {driver.vehicle && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            Vehicle:{" "}
                          </span>
                          {driver.vehicle.number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Performance</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Safety Score</span>
                          <span>{driver.performance.safetyScore}%</span>
                        </div>
                        <Progress value={driver.performance.safetyScore} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>On-Time Delivery</span>
                          <span>{driver.performance.onTimeDelivery}%</span>
                        </div>
                        <Progress value={driver.performance.onTimeDelivery} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Fuel Efficiency</span>
                          <span>{driver.performance.fuelEfficiency}%</span>
                        </div>
                        <Progress value={driver.performance.fuelEfficiency} />
                      </div>
                    </div>
                  </div>

                  {/* Compliance */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Compliance & Documents</h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Hours Available:{" "}
                        </span>
                        {driver.compliance.hoursAvailable}h
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Last Break:{" "}
                        </span>
                        {driver.compliance.lastBreak}
                      </p>
                      {driver.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{doc.type}</span>
                          <span className={getDocumentStatus(doc.status)}>
                            {doc.expiresIn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                        variant="outline"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDriverProfileDialog(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                        variant="outline"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowLocationDialog(true);
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Track Location
                      </Button>
                      <Button
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                        variant="outline"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowScheduleDialog(true);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No drivers found matching your search criteria.
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

      {/* Add Driver Dialog */}
      <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>
              Enter driver details and upload required documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver-name">Full Name *</Label>
                <Input
                  id="driver-name"
                  placeholder="John Doe"
                  value={newDriver.name}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-email">Email Address *</Label>
                <Input
                  id="driver-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={newDriver.email}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver-phone">Phone Number *</Label>
                <Input
                  id="driver-phone"
                  placeholder="(555) 123-4567"
                  value={newDriver.phone}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-license">License Number *</Label>
                <Input
                  id="driver-license"
                  placeholder="DL12345678"
                  value={newDriver.licenseNumber}
                  onChange={(e) =>
                    setNewDriver({
                      ...newDriver,
                      licenseNumber: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver-license-state">License State</Label>
                <Select
                  value={newDriver.licenseState}
                  onValueChange={(value) =>
                    setNewDriver({ ...newDriver, licenseState: value })
                  }
                >
                  <SelectTrigger id="driver-license-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    {/* Add more states as needed */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-license-expiry">
                  License Expiry Date
                </Label>
                <Input
                  id="driver-license-expiry"
                  type="date"
                  value={newDriver.licenseExpiry}
                  onChange={(e) =>
                    setNewDriver({
                      ...newDriver,
                      licenseExpiry: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver-address">Address</Label>
              <Input
                id="driver-address"
                placeholder="123 Main St"
                value={newDriver.address}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver-city">City</Label>
                <Input
                  id="driver-city"
                  placeholder="Chicago"
                  value={newDriver.city}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-state">State</Label>
                <Input
                  id="driver-state"
                  placeholder="IL"
                  value={newDriver.state}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, state: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-zip">ZIP Code</Label>
                <Input
                  id="driver-zip"
                  placeholder="60601"
                  value={newDriver.zip}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, zip: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency-contact">Emergency Contact</Label>
                <Input
                  id="emergency-contact"
                  placeholder="Jane Doe"
                  value={newDriver.emergencyContact}
                  onChange={(e) =>
                    setNewDriver({
                      ...newDriver,
                      emergencyContact: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-phone">Emergency Phone</Label>
                <Input
                  id="emergency-phone"
                  placeholder="(555) 987-6543"
                  value={newDriver.emergencyPhone}
                  onChange={(e) =>
                    setNewDriver({
                      ...newDriver,
                      emergencyPhone: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver-license-upload">
                  Driver's License (PDF) *
                </Label>
                <Input
                  id="driver-license-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDriverLicenseChange}
                />
                {newDriver.driverLicense && (
                  <p className="text-sm text-green-600">
                    Selected: {newDriver.driverLicense.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical-card-upload">Medical Card (PDF)</Label>
                <Input
                  id="medical-card-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleMedicalCardChange}
                />
                {newDriver.medicalCard && (
                  <p className="text-sm text-green-600">
                    Selected: {newDriver.medicalCard.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDriverDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDriver}>Add Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Profile Dialog */}
      <Dialog
        open={showDriverProfileDialog}
        onOpenChange={setShowDriverProfileDialog}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Profile</DialogTitle>
            <DialogDescription>
              {selectedDriver?.name} - {selectedDriver?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedDriver.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    <span>{selectedDriver.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4" />
                    <span>{selectedDriver.phone}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <div>{getStatusBadge(selectedDriver.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedDriver.location}</p>
                </div>
                {selectedDriver.currentLoad && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Current Load</p>
                    <p className="font-medium">{selectedDriver.currentLoad}</p>
                  </div>
                )}
                {selectedDriver.vehicle && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Assigned Vehicle</p>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <p className="font-medium">
                        {selectedDriver.vehicle.number}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Overall Rating</p>
                    <p className="font-medium">
                      {selectedDriver.performance.rating} / 5.0
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Completed Loads</p>
                    <p className="font-medium">
                      {selectedDriver.metrics.completedLoads}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Total Miles</p>
                    <p className="font-medium">
                      {selectedDriver.metrics.totalMiles}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Incidents (30 days)</p>
                    <p className="font-medium">
                      {selectedDriver.metrics.incidentsLast30}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Compliance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Hours Available</p>
                    <p className="font-medium">
                      {selectedDriver.compliance.hoursAvailable}h
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Last Break</p>
                    <p className="font-medium">
                      {selectedDriver.compliance.lastBreak}
                    </p>
                  </div>
                  {selectedDriver.compliance.nextMedicalExam && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm">Next Medical Exam</p>
                      <p className="font-medium">
                        {selectedDriver.compliance.nextMedicalExam}
                      </p>
                    </div>
                  )}
                  {selectedDriver.compliance.nextDrugTest && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm">Next Drug Test</p>
                      <p className="font-medium">
                        {selectedDriver.compliance.nextDrugTest}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Documents</h4>
                <div className="space-y-3">
                  {selectedDriver.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{doc.type}</p>
                        <p className="text-sm text-gray-500">{doc.fileName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${doc.status === "valid" ? "bg-green-100 text-green-800" : doc.status === "expiring" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                        >
                          {doc.status === "valid"
                            ? "Valid"
                            : doc.status === "expiring"
                              ? "Expiring"
                              : "Expired"}
                        </Badge>
                        <p className="text-sm">{doc.expiresIn}</p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <Label htmlFor="document-upload">Upload New Document</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="document-upload"
                        type="file"
                        onChange={handleDocumentUpload}
                      />
                      <Select
                        value={documentType}
                        onValueChange={setDocumentType}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Document Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDL">CDL</SelectItem>
                          <SelectItem value="Medical Card">
                            Medical Card
                          </SelectItem>
                          <SelectItem value="HAZMAT">HAZMAT</SelectItem>
                          <SelectItem value="Training">
                            Training Certificate
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button disabled={!uploadFile || !documentType}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Assign Load
                  </Button>
                  <Button variant="outline" className="text-red-600">
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Driver
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDriverProfileDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Track Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Location</DialogTitle>
            <DialogDescription>
              {selectedDriver?.name} - Current Location
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="py-6 space-y-6">
              <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    Map would display here with real-time location
                  </p>
                  <p className="font-medium mt-2">{selectedDriver.location}</p>
                  {selectedDriver.currentLoad && (
                    <p className="text-sm text-gray-500 mt-1">
                      Currently delivering load: {selectedDriver.currentLoad}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Location Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Current Location</p>
                    <p className="font-medium">{selectedDriver.location}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Last Updated</p>
                    <p className="font-medium">Just now</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Status</p>
                    <div>{getStatusBadge(selectedDriver.status)}</div>
                  </div>
                  {selectedDriver.currentLoad && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm">Current Load</p>
                      <p className="font-medium">
                        {selectedDriver.currentLoad}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Driver
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLocationDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Schedule</DialogTitle>
            <DialogDescription>
              {selectedDriver?.name} - Schedule and Assignments
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="py-6 space-y-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Current Week</h4>
                <div className="space-y-3">
                  {[
                    {
                      day: "Monday",
                      status: "Completed",
                      load: "LDG-2024-155",
                      hours: 9,
                    },
                    {
                      day: "Tuesday",
                      status: "Completed",
                      load: "LDG-2024-156",
                      hours: 10,
                    },
                    {
                      day: "Wednesday",
                      status: "In Progress",
                      load: selectedDriver.currentLoad || "None",
                      hours: 6.5,
                    },
                    {
                      day: "Thursday",
                      status: "Scheduled",
                      load: "LDG-2024-158",
                      hours: 8,
                    },
                    {
                      day: "Friday",
                      status: "Scheduled",
                      load: "LDG-2024-160",
                      hours: 8,
                    },
                    { day: "Saturday", status: "Off", load: "None", hours: 0 },
                    { day: "Sunday", status: "Off", load: "None", hours: 0 },
                  ].map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border-b last:border-0"
                    >
                      <div className="w-24">
                        <p className="font-medium">{day.day}</p>
                      </div>
                      <div className="flex-1 px-4">
                        <Badge
                          className={`${day.status === "Completed" ? "bg-green-100 text-green-800" : day.status === "In Progress" ? "bg-blue-100 text-blue-800" : day.status === "Scheduled" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {day.status}
                        </Badge>
                      </div>
                      <div className="w-32 text-right">
                        <p className="text-sm">{day.load}</p>
                      </div>
                      <div className="w-16 text-right">
                        <p className="text-sm">{day.hours}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Hours Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Hours This Week</p>
                    <p className="font-medium">25.5 / 70</p>
                    <Progress value={(25.5 / 70) * 100} className="mt-1" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Hours Available Today
                    </p>
                    <p className="font-medium">
                      {selectedDriver.compliance.hoursAvailable}h
                    </p>
                    <Progress
                      value={
                        (selectedDriver.compliance.hoursAvailable / 11) * 100
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Upcoming Assignments</h4>
                <div className="space-y-3">
                  {[
                    {
                      date: "2024-03-16",
                      load: "LDG-2024-158",
                      pickup: "Chicago, IL",
                      delivery: "Detroit, MI",
                    },
                    {
                      date: "2024-03-17",
                      load: "LDG-2024-160",
                      pickup: "Detroit, MI",
                      delivery: "Cleveland, OH",
                    },
                    {
                      date: "2024-03-20",
                      load: "LDG-2024-165",
                      pickup: "Cleveland, OH",
                      delivery: "Pittsburgh, PA",
                    },
                  ].map((assignment, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{assignment.load}</p>
                        <p className="text-sm">{assignment.date}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {assignment.pickup} → {assignment.delivery}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Modify Schedule
                  </Button>
                  <Button variant="outline">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Assign Load
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
