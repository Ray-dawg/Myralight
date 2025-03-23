import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  History,
  Wrench,
} from "lucide-react";

interface MaintenanceRecord {
  id: string;
  type: string;
  date: string;
  mileage: number;
  description: string;
  cost: number;
  status: "completed" | "scheduled" | "overdue";
}

export default function TruckManagement() {
  const { toast } = useToast();
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: "oil_change",
    date: "",
    time: "",
    mileage: "",
    description: "",
    priority: "medium",
  });

  const [truckInfo] = useState({
    number: "TRK-2024-156",
    make: "Peterbilt",
    model: "579",
    year: "2022",
    vin: "1XPBD49X1MD456789",
    license: "IL-12345",
    mileage: 125890,
    lastInspection: "2024-01-15",
    nextInspection: "2024-04-15",
    status: "active",
  });

  const [maintenanceRecords] = useState<MaintenanceRecord[]>([
    {
      id: "M1",
      type: "Oil Change",
      date: "2024-02-01",
      mileage: 120000,
      description: "Regular oil change and filter replacement",
      cost: 350,
      status: "completed",
    },
    {
      id: "M2",
      type: "Brake Inspection",
      date: "2024-02-15",
      mileage: 125000,
      description: "Scheduled brake system inspection",
      cost: 200,
      status: "scheduled",
    },
    {
      id: "M3",
      type: "Tire Rotation",
      date: "2024-01-15",
      mileage: 122000,
      description: "Regular tire rotation and pressure check",
      cost: 150,
      status: "completed",
    },
  ]);

  const StatusBadge = ({ status }: { status: MaintenanceRecord["status"] }) => {
    const styles = {
      completed: "bg-[#E7F6EC] text-[#0E4F2C]",
      scheduled: "bg-[#F5F3FF] text-[#4F46E5]",
      overdue: "bg-[#FEE2E2] text-[#B91C1C]",
    };

    return (
      <div
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  const handleScheduleMaintenance = () => {
    if (!maintenanceForm.date || !maintenanceForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Process the maintenance request
    toast({
      title: "Maintenance Scheduled",
      description: `Your maintenance has been scheduled for ${maintenanceForm.date} ${maintenanceForm.time ? "at " + maintenanceForm.time : ""}.`,
      variant: "success",
    });

    // Close the dialog and reset form
    setShowMaintenanceDialog(false);
    setMaintenanceForm({
      type: "oil_change",
      date: "",
      time: "",
      mileage: "",
      description: "",
      priority: "medium",
    });
  };

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Truck Management</h1>
            <Badge variant="outline" className="text-blue-600">
              {truckInfo.number}
            </Badge>
          </div>
          <Button
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={() => setShowMaintenanceDialog(true)}
          >
            <Wrench className="h-4 w-4" />
            Schedule Maintenance
          </Button>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Truck Info
            </TabsTrigger>
            <TabsTrigger
              value="maintenance"
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" /> Maintenance
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input value={truckInfo.make} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={truckInfo.model} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input value={truckInfo.year} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>VIN</Label>
                  <Input value={truckInfo.vin} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>License Plate</Label>
                  <Input value={truckInfo.license} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Current Mileage</Label>
                  <Input value={truckInfo.mileage.toLocaleString()} readOnly />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Inspection Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium">Last Inspection</p>
                    <p className="text-sm text-gray-500">
                      {truckInfo.lastInspection}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                  <div>
                    <p className="font-medium">Next Inspection Due</p>
                    <p className="text-sm text-gray-500">
                      {truckInfo.nextInspection}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            {maintenanceRecords.map((record) => (
              <Card key={record.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{record.type}</h3>
                      <StatusBadge status={record.status} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {record.description}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Date: {record.date}</span>
                      <span>Mileage: {record.mileage.toLocaleString()}</span>
                      <span>Cost: ${record.cost}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <div className="text-center text-gray-500 py-8">
                Detailed history view coming soon...
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Maintenance Dialog */}
      <Dialog
        open={showMaintenanceDialog}
        onOpenChange={setShowMaintenanceDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              Schedule maintenance for your truck (ID: {truckInfo.number})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-type">Maintenance Type *</Label>
              <Select
                value={maintenanceForm.type}
                onValueChange={(value) =>
                  setMaintenanceForm({ ...maintenanceForm, type: value })
                }
              >
                <SelectTrigger id="maintenance-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oil_change">Oil Change</SelectItem>
                  <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
                  <SelectItem value="brake_service">Brake Service</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance-date">Date *</Label>
                <Input
                  id="maintenance-date"
                  type="date"
                  value={maintenanceForm.date}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance-time">Time</Label>
                <Input
                  id="maintenance-time"
                  type="time"
                  value={maintenanceForm.time}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-mileage">Current Mileage</Label>
              <Input
                id="maintenance-mileage"
                type="number"
                defaultValue={truckInfo.mileage}
                value={maintenanceForm.mileage || truckInfo.mileage}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    mileage: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-priority">Priority</Label>
              <Select
                value={maintenanceForm.priority}
                onValueChange={(value) =>
                  setMaintenanceForm({ ...maintenanceForm, priority: value })
                }
              >
                <SelectTrigger id="maintenance-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-description">Description *</Label>
              <Textarea
                id="maintenance-description"
                placeholder="Describe the maintenance needed"
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMaintenanceDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleScheduleMaintenance}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
