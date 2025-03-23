import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Users,
  Truck,
  DollarSign,
} from "lucide-react";

export default function CompanySettings() {
  const [companyInfo, setCompanyInfo] = useState({
    name: "FastFreight Logistics",
    email: "contact@fastfreight.com",
    phone: "(555) 123-4567",
    address: "123 Logistics Way, Chicago, IL 60601",
    dot: "US DOT 1234567",
    mc: "MC 987654",
    insurance: {
      provider: "TruckSure Insurance",
      policy: "INS-2024-789",
      coverage: "$2,000,000",
      expiry: "2024-12-31",
    },
    preferences: {
      autoAssignLoads: true,
      emailNotifications: true,
      smsNotifications: true,
      requireApproval: true,
    },
    billing: {
      method: "ACH",
      account: "**** **** 1234",
      paymentTerms: "Net 30",
    },
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Company Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your company profile and preferences
          </p>
        </div>
        <Button>Save Changes</Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Company Profile
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={companyInfo.phone}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={companyInfo.address}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Authority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>USDOT Number</Label>
                  <Input value={companyInfo.dot} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>MC Number</Label>
                  <Input value={companyInfo.mc} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Insurance Provider</Label>
                  <Input value={companyInfo.insurance.provider} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input value={companyInfo.insurance.policy} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Coverage Amount</Label>
                  <Input value={companyInfo.insurance.coverage} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={companyInfo.insurance.expiry}
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operational Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Load Assignment</Label>
                    <p className="text-sm text-gray-500">
                      Automatically assign loads to available drivers
                    </p>
                  </div>
                  <Switch
                    checked={companyInfo.preferences.autoAssignLoads}
                    onCheckedChange={(checked) =>
                      setCompanyInfo({
                        ...companyInfo,
                        preferences: {
                          ...companyInfo.preferences,
                          autoAssignLoads: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={companyInfo.preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      setCompanyInfo({
                        ...companyInfo,
                        preferences: {
                          ...companyInfo.preferences,
                          emailNotifications: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive updates via SMS
                    </p>
                  </div>
                  <Switch
                    checked={companyInfo.preferences.smsNotifications}
                    onCheckedChange={(checked) =>
                      setCompanyInfo({
                        ...companyInfo,
                        preferences: {
                          ...companyInfo.preferences,
                          smsNotifications: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Input value={companyInfo.billing.method} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={companyInfo.billing.account} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input value={companyInfo.billing.paymentTerms} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
