import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Shield, Users, Save, Plus } from "lucide-react";

interface Role {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function PermissionManagement() {
  const [roles] = useState<Role[]>([
    {
      id: "1",
      name: "Admin",
      permissions: ["all"],
      userCount: 5,
    },
    {
      id: "2",
      name: "Fleet Manager",
      permissions: [
        "read:fleet",
        "write:fleet",
        "read:drivers",
        "write:drivers",
      ],
      userCount: 12,
    },
    {
      id: "3",
      name: "Dispatcher",
      permissions: ["read:loads", "write:loads", "read:drivers"],
      userCount: 8,
    },
  ]);

  const [permissions] = useState<Permission[]>([
    {
      id: "p1",
      name: "read:fleet",
      description: "View fleet information",
      category: "Fleet Management",
    },
    {
      id: "p2",
      name: "write:fleet",
      description: "Modify fleet information",
      category: "Fleet Management",
    },
    {
      id: "p3",
      name: "read:drivers",
      description: "View driver information",
      category: "Driver Management",
    },
  ]);

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Permission Management</h1>
          <p className="text-gray-500 mt-1">Manage roles and permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search roles..." className="pl-10" />
            </div>
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{role.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Users className="h-4 w-4" />
                        {role.userCount} users
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {role.permissions.length} permissions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Grid */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {["Fleet Management", "Driver Management", "Load Management"].map(
                (category) => (
                  <div key={category}>
                    <h3 className="font-medium mb-4">{category}</h3>
                    <div className="space-y-4">
                      {permissions
                        .filter((p) => p.category === category)
                        .map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-gray-400" />
                                <p className="font-medium">{permission.name}</p>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {permission.description}
                              </p>
                            </div>
                            <Switch />
                          </div>
                        ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
