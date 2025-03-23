import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { Id } from "@/lib/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Search,
  Shield,
  Users,
  Save,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

interface Role {
  _id: Id<"roles">;
  name: string;
  description: string;
  permissions: string[];
  isCustom: boolean;
  organizationId: Id<"organizations">;
  dashboardConfig?: {
    visibleTabs: string[];
    defaultTab: string;
    widgets: string[];
  };
  createdAt: number;
  updatedAt: number;
}

interface Permission {
  _id: Id<"permissions">;
  name: string;
  description: string;
  category: string;
}

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  roleId?: Id<"roles">;
  role?: string; // Legacy field
}

export default function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("permissions");

  // Get current user
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get all roles
  const roles = useQuery(api.permissions.getAllRoles);

  // Get all permissions
  const permissions = useQuery(api.permissions.getAllPermissions);

  // Get users for selected role
  const usersForRole = useQuery(
    api.permissions.getUsersByRole,
    selectedRole ? { roleId: selectedRole._id } : "skip",
  );

  // Mutations
  const createRole = useMutation(api.permissions.createRole);
  const updateRole = useMutation(api.permissions.updateRole);
  const deleteRole = useMutation(api.permissions.deleteRole);
  const assignRoleToUser = useMutation(api.permissions.assignRoleToUser);

  // Effect to set selected permissions when role changes
  useEffect(() => {
    if (selectedRole) {
      setSelectedPermissions(selectedRole.permissions);
    } else {
      setSelectedPermissions([]);
    }
  }, [selectedRole]);

  // Filter roles based on search query
  const filteredRoles =
    roles?.filter((role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Group permissions by category
  const permissionsByCategory =
    permissions?.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>,
    ) || {};

  // Handle permission toggle
  const togglePermission = (permissionName: string) => {
    if (selectedPermissions.includes(permissionName)) {
      setSelectedPermissions(
        selectedPermissions.filter((p) => p !== permissionName),
      );
    } else {
      setSelectedPermissions([...selectedPermissions, permissionName]);
    }
  };

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setActiveTab("permissions");
  };

  // Handle role creation
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;

    try {
      if (!currentUser?._id) throw new Error("User not authenticated");

      // For demo purposes, using a placeholder organization ID
      // In a real app, you would get this from the current user's context
      const organizationId = currentUser.organizationId as Id<"organizations">;

      await createRole({
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions,
        organizationId,
        isCustom: true,
        createdBy: currentUser._id,
      });

      // Reset form
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions([]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating role:", error);
      // In a real app, you would show an error message to the user
    }
  };

  // Handle role update
  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      if (!currentUser?._id) throw new Error("User not authenticated");

      await updateRole({
        id: selectedRole._id,
        permissions: selectedPermissions,
        updatedBy: currentUser._id,
      });

      // Update local state
      setSelectedRole({
        ...selectedRole,
        permissions: selectedPermissions,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      // In a real app, you would show an error message to the user
    }
  };

  // Handle role deletion
  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await deleteRole({ id: selectedRole._id });
      setSelectedRole(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting role:", error);
      // In a real app, you would show an error message to the user
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-gray-500 mt-1">
            Create and manage custom roles with specific permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions for your
                organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Role Name
                </Label>
                <Input
                  id="name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Regional Manager"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Brief description of this role"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Permissions</Label>
                <div className="col-span-3 border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(
                    ([category, perms]) => (
                      <div key={category} className="mb-4">
                        <h3 className="font-medium mb-2">{category}</h3>
                        <div className="space-y-2">
                          {perms.map((permission) => (
                            <div
                              key={permission._id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`new-${permission.name}`}
                                checked={selectedPermissions.includes(
                                  permission.name,
                                )}
                                onCheckedChange={() =>
                                  togglePermission(permission.name)
                                }
                              />
                              <Label
                                htmlFor={`new-${permission.name}`}
                                className="flex-1"
                              >
                                <div className="font-medium">
                                  {permission.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {permission.description}
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>Create Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <Input
                placeholder="Search roles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {filteredRoles.map((role) => (
                <div
                  key={role._id}
                  className={`p-3 rounded-lg border hover:bg-gray-50 cursor-pointer ${selectedRole?._id === role._id ? "bg-gray-50 border-primary" : ""}`}
                  onClick={() => handleRoleSelect(role)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {role.name}
                        {!role.isCustom && (
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Users className="h-4 w-4" />
                        {usersForRole?.length || 0} users
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

        {/* Role Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>{selectedRole ? selectedRole.name : "Select a Role"}</span>
              {selectedRole && selectedRole.isCustom && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateRole}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="dashboard">Dashboard Config</TabsTrigger>
                </TabsList>

                <TabsContent value="permissions" className="space-y-6">
                  {Object.entries(permissionsByCategory).map(
                    ([category, perms]) => (
                      <div key={category}>
                        <h3 className="font-medium mb-4">{category}</h3>
                        <div className="space-y-4">
                          {perms.map((permission) => (
                            <div
                              key={permission._id}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-gray-400" />
                                  <p className="font-medium">
                                    {permission.name}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {permission.description}
                                </p>
                              </div>
                              <Switch
                                checked={selectedPermissions.includes(
                                  permission.name,
                                )}
                                onCheckedChange={() =>
                                  togglePermission(permission.name)
                                }
                                disabled={!selectedRole.isCustom}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Users with this role</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Assign Users
                    </Button>
                  </div>

                  {usersForRole?.length ? (
                    <div className="space-y-2">
                      {usersForRole.map((user) => (
                        <div
                          key={user._id}
                          className="p-3 rounded-lg border flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No users have been assigned this role yet.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="dashboard" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Dashboard Configuration</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!selectedRole.isCustom}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Configuration
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">Visible Tabs</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "loads",
                          "analytics",
                          "documents",
                          "messages",
                          "settings",
                        ].map((tab) => (
                          <div
                            key={tab}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`tab-${tab}`}
                              checked={
                                selectedRole.dashboardConfig?.visibleTabs.includes(
                                  tab,
                                ) || false
                              }
                              disabled={!selectedRole.isCustom}
                            />
                            <Label htmlFor={`tab-${tab}`}>
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Default Tab</Label>
                      <Select
                        defaultValue={
                          selectedRole.dashboardConfig?.defaultTab || "loads"
                        }
                        disabled={!selectedRole.isCustom}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select default tab" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedRole.dashboardConfig?.visibleTabs.map(
                            (tab) => (
                              <SelectItem key={tab} value={tab}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2 block">Visible Widgets</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "activeLoads",
                          "completedLoads",
                          "totalLoads",
                          "revenue",
                          "performance",
                          "recentActivity",
                        ].map((widget) => (
                          <div
                            key={widget}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`widget-${widget}`}
                              checked={
                                selectedRole.dashboardConfig?.widgets.includes(
                                  widget,
                                ) || false
                              }
                              disabled={!selectedRole.isCustom}
                            />
                            <Label htmlFor={`widget-${widget}`}>
                              {widget
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Select a role to view and manage its permissions
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 bg-amber-50 text-amber-800 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>
              Deleting a role will remove it from all users currently assigned
              to it.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
