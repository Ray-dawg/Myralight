import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, Lock, Shield } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = () => {
    // Handle save logic
    console.log("Saving profile:", profile);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Account
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <Input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <Input
                        type="password"
                        value={profile.currentPassword}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            currentPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <Input
                        type="password"
                        value={profile.newPassword}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <Input
                        type="password"
                        value={profile.confirmPassword}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
