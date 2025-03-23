import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
  Shield,
  Truck,
  CheckCircle,
  XCircle,
  BarChart2,
} from "lucide-react";

interface DriverProfileProps {
  driverId?: string;
}

export default function DriverProfile({
  driverId = "D001",
}: DriverProfileProps) {
  const [driver] = useState({
    id: "D001",
    name: "John Anderson",
    email: "john.anderson@fastfreight.com",
    phone: "(555) 123-4567",
    location: "Chicago, IL",
    status: "active" as const,
    license: {
      number: "IL12345678",
      class: "Class A CDL",
      expiry: "2024-12-31",
      endorsements: ["Hazmat", "Tanker", "Doubles/Triples"],
    },
    performance: {
      rating: 4.8,
      onTimeDelivery: 98,
      safetyScore: 95,
      fuelEfficiency: 92,
      totalMiles: "124,500",
      completedLoads: 450,
    },
    compliance: {
      hoursAvailable: 6.5,
      lastBreak: "2h ago",
      violations: 0,
      nextMedicalExam: "2024-08-15",
      nextDrugTest: "2024-05-20",
    },
    vehicle: {
      id: "TRK001",
      number: "TRK-2024-156",
      make: "Freightliner",
      model: "Cascadia",
      year: "2022",
    },
    recentLoads: [
      {
        id: "L-1234",
        route: "Chicago, IL → Milwaukee, WI",
        date: "2024-02-15",
        status: "completed",
        earnings: 850,
      },
      {
        id: "L-1235",
        route: "Milwaukee, WI → Minneapolis, MN",
        date: "2024-02-14",
        status: "completed",
        earnings: 1200,
      },
    ],
  });

  const getStatusBadge = (status: "active" | "inactive" | "on_break") => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      on_break: "bg-yellow-100 text-yellow-800",
    };

    return (
      <Badge className={styles[status]}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{driver.name}</h1>
              {getStatusBadge(driver.status)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-gray-500">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {driver.email}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {driver.phone}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {driver.location}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Message</Button>
          <Button variant="outline">Schedule</Button>
          <Button>Assign Load</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Safety Score</p>
                <p className="text-2xl font-bold">
                  {driver.performance.safetyScore}%
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours Available</p>
                <p className="text-2xl font-bold">
                  {driver.compliance.hoursAvailable}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Loads</p>
                <p className="text-2xl font-bold">
                  {driver.performance.completedLoads}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Miles</p>
                <p className="text-2xl font-bold">
                  {driver.performance.totalMiles}
                </p>
              </div>
              <BarChart2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center gap-2">
            <Truck className="h-4 w-4" /> Vehicle
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Load History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Safety Score</span>
                    <span>{driver.performance.safetyScore}%</span>
                  </div>
                  <Progress value={driver.performance.safetyScore} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>On-Time Delivery</span>
                    <span>{driver.performance.onTimeDelivery}%</span>
                  </div>
                  <Progress value={driver.performance.onTimeDelivery} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Fuel Efficiency</span>
                    <span>{driver.performance.fuelEfficiency}%</span>
                  </div>
                  <Progress value={driver.performance.fuelEfficiency} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium">{driver.license.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{driver.license.class}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium">{driver.license.expiry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Endorsements</p>
                  <p className="font-medium">
                    {driver.license.endorsements.join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Medical Examination</p>
                    <p className="text-sm text-gray-500">
                      Due: {driver.compliance.nextMedicalExam}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Drug Test</p>
                    <p className="text-sm text-gray-500">
                      Due: {driver.compliance.nextDrugTest}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium">{driver.vehicle.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Make & Model</p>
                  <p className="font-medium">
                    {driver.vehicle.make} {driver.vehicle.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{driver.vehicle.year}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Loads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driver.recentLoads.map((load) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{load.route}</p>
                      <p className="text-sm text-gray-500">{load.date}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">${load.earnings}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
