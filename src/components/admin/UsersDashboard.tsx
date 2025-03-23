import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  UserPlus,
  Users,
  Shield,
  Ban,
  CheckCircle,
  MoreVertical,
  Download,
  FileText,
  FileSpreadsheet,
  X,
  Plus,
  Mail,
  Phone,
  MapPin,
  Key,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  joinDate: string;
  permissions: string[];
  phone?: string;
  region?: string;
}

interface FilterOptions {
  id: string;
  name: string;
  role: string;
  status: string;
  region: string;
  phone: string;
}

interface PermissionOption {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function UsersDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    id: "",
    name: "",
    role: "",
    status: "",
    region: "",
    phone: "",
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showPermissionsSheet, setShowPermissionsSheet] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [users, setUsers] = useState<User[]>([
    {
      id: "USR001",
      name: "John Smith",
      email: "john.smith@example.com",
      role: "Driver",
      status: "active",
      lastLogin: "2 hours ago",
      joinDate: "2024-01-15",
      permissions: ["drive", "view_loads", "update_profile"],
      phone: "(555) 123-4567",
      region: "Midwest",
    },
    {
      id: "USR002",
      name: "Sarah Connor",
      email: "sarah.connor@example.com",
      role: "Fleet Manager",
      status: "active",
      lastLogin: "5 minutes ago",
      joinDate: "2023-12-01",
      permissions: ["manage_fleet", "view_analytics", "manage_drivers"],
      phone: "(555) 987-6543",
      region: "West",
    },
    {
      id: "USR003",
      name: "Mike Johnson",
      email: "mike.j@example.com",
      role: "Dispatcher",
      status: "suspended",
      lastLogin: "1 day ago",
      joinDate: "2024-02-01",
      permissions: ["assign_loads", "view_fleet"],
      phone: "(555) 456-7890",
      region: "East",
    },
  ]);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    region: "",
    password: "",
    permissions: [] as string[],
  });

  const [availablePermissions] = useState<PermissionOption[]>([
    {
      id: "drive",
      name: "Drive",
      description: "Permission to operate vehicles",
      category: "Driver",
    },
    {
      id: "view_loads",
      name: "View Loads",
      description: "Access to view available loads",
      category: "Driver",
    },
    {
      id: "update_profile",
      name: "Update Profile",
      description: "Ability to update personal profile",
      category: "General",
    },
    {
      id: "manage_fleet",
      name: "Manage Fleet",
      description: "Full access to fleet management",
      category: "Fleet",
    },
    {
      id: "view_analytics",
      name: "View Analytics",
      description: "Access to analytics dashboards",
      category: "Analytics",
    },
    {
      id: "manage_drivers",
      name: "Manage Drivers",
      description: "Ability to manage driver accounts",
      category: "Management",
    },
    {
      id: "assign_loads",
      name: "Assign Loads",
      description: "Permission to assign loads to drivers",
      category: "Dispatch",
    },
    {
      id: "view_fleet",
      name: "View Fleet",
      description: "Access to view fleet information",
      category: "Fleet",
    },
  ]);

  const getStatusBadge = (status: User["status"]) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  // Filter users based on search query and filter options
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesId =
      filterOptions.id === "" || user.id.includes(filterOptions.id);
    const matchesName =
      filterOptions.name === "" ||
      user.name.toLowerCase().includes(filterOptions.name.toLowerCase());
    const matchesRole =
      filterOptions.role === "" || user.role === filterOptions.role;
    const matchesStatus =
      filterOptions.status === "" || user.status === filterOptions.status;
    const matchesRegion =
      filterOptions.region === "" ||
      (user.region && user.region.includes(filterOptions.region));
    const matchesPhone =
      filterOptions.phone === "" ||
      (user.phone && user.phone.includes(filterOptions.phone));

    return (
      matchesSearch &&
      matchesId &&
      matchesName &&
      matchesRole &&
      matchesStatus &&
      matchesRegion &&
      matchesPhone
    );
  });

  const handleExport = (format: string) => {
    toast({
      title: `Exporting Users as ${format.toUpperCase()}`,
      description: "Your user data is being prepared for download.",
    });

    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `User data has been exported as ${format.toUpperCase()}.`,
        variant: "success",
      });
    }, 1500);
  };

  const handleCreateUser = async () => {
    // Validate form
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Generate a unique ID
    const userId = `USR${Math.floor(1000 + Math.random() * 9000)}`;

    // Create the user
    try {
      // In a real app, this would use Supabase to create the user
      // const { data, error } = await supabase.auth.signUp({
      //   email: newUser.email,
      //   password: newUser.password,
      //   options: {
      //     data: {
      //       name: newUser.name,
      //       role: newUser.role,
      //       permissions: newUser.permissions,
      //       phone: newUser.phone,
      //       region: newUser.region
      //     }
      //   }
      // });

      // For demo purposes, we'll just add to our local state
      const newUserData: User = {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: "active",
        lastLogin: "Never",
        joinDate: new Date().toISOString().split("T")[0],
        permissions: newUser.permissions,
        phone: newUser.phone,
        region: newUser.region,
      };

      setUsers([...users, newUserData]);

      toast({
        title: "User Created Successfully",
        description: `${newUser.name} has been added and will receive a verification email.`,
        variant: "success",
      });

      // Reset form
      setNewUser({
        name: "",
        email: "",
        role: "",
        phone: "",
        region: "",
        password: "",
        permissions: [],
      });
    } catch (error) {
      toast({
        title: "Error Creating User",
        description: "There was a problem creating the user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePermissions = () => {
    if (!selectedUser) return;

    // Update the user's permissions
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        return {
          ...user,
          permissions: selectedPermissions,
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    setShowPermissionsSheet(false);

    toast({
      title: "Permissions Updated",
      description: `Permissions for ${selectedUser.name} have been updated.`,
      variant: "success",
    });
  };

  const handleStatusChange = (userId: string, newStatus: User["status"]) => {
    const updatedUsers = users.map((user) => {
      if (user.id === userId) {
        return {
          ...user,
          status: newStatus,
        };
      }
      return user;
    });

    setUsers(updatedUsers);

    toast({
      title: `User ${newStatus === "active" ? "Activated" : "Suspended"}`,
      description: `User status has been updated to ${newStatus}.`,
      variant: "success",
    });
  };

  const handlePermissionsClick = (user: User) => {
    setSelectedUser(user);
    setSelectedPermissions([...user.permissions]);
    setShowPermissionsSheet(true);
  };

  const handleFilterApply = () => {
    setShowFilterDialog(false);

    toast({
      title: "Filters Applied",
      description:
        "The user list has been filtered according to your criteria.",
    });
  };

  const handleFilterReset = () => {
    setFilterOptions({
      id: "",
      name: "",
      role: "",
      status: "",
      region: "",
      phone: "",
    });

    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500 mt-1">
            {users.length} total users •{" "}
            {users.filter((u) => u.status === "active").length} active
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. They will receive an email to
                  verify their account.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Driver">Driver</SelectItem>
                        <SelectItem value="Fleet Manager">
                          Fleet Manager
                        </SelectItem>
                        <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      placeholder="Temporary password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select
                      value={newUser.region}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, region: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="Midwest">Midwest</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="Northeast">Northeast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Initial Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availablePermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={permission.id}
                          checked={newUser.permissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewUser({
                                ...newUser,
                                permissions: [
                                  ...newUser.permissions,
                                  permission.id,
                                ],
                              });
                            } else {
                              setNewUser({
                                ...newUser,
                                permissions: newUser.permissions.filter(
                                  (p) => p !== permission.id,
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={permission.id} className="text-sm">
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" onClick={handleCreateUser}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: "Filter Users",
                  description: (
                    <div className="mt-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="toast-filter-id">User ID</Label>
                          <Input
                            id="toast-filter-id"
                            placeholder="USR..."
                            value={filterOptions.id}
                            onChange={(e) =>
                              setFilterOptions({
                                ...filterOptions,
                                id: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="toast-filter-name">Name</Label>
                          <Input
                            id="toast-filter-name"
                            placeholder="User name"
                            value={filterOptions.name}
                            onChange={(e) =>
                              setFilterOptions({
                                ...filterOptions,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="toast-filter-role">Role</Label>
                          <Select
                            value={filterOptions.role}
                            onValueChange={(value) =>
                              setFilterOptions({
                                ...filterOptions,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger id="toast-filter-role">
                              <SelectValue placeholder="Any role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Any role</SelectItem>
                              <SelectItem value="Driver">Driver</SelectItem>
                              <SelectItem value="Fleet Manager">
                                Fleet Manager
                              </SelectItem>
                              <SelectItem value="Dispatcher">
                                Dispatcher
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="toast-filter-status">Status</Label>
                          <Select
                            value={filterOptions.status}
                            onValueChange={(value) =>
                              setFilterOptions({
                                ...filterOptions,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger id="toast-filter-status">
                              <SelectValue placeholder="Any status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Any status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">
                                Suspended
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="toast-filter-region">Region</Label>
                          <Input
                            id="toast-filter-region"
                            placeholder="User region"
                            value={filterOptions.region}
                            onChange={(e) =>
                              setFilterOptions({
                                ...filterOptions,
                                region: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="toast-filter-phone">Phone</Label>
                          <Input
                            id="toast-filter-phone"
                            placeholder="Phone number"
                            value={filterOptions.phone}
                            onChange={(e) =>
                              setFilterOptions({
                                ...filterOptions,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={handleFilterReset}>
                          Reset
                        </Button>
                        <Button onClick={handleFilterApply}>
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  ),
                  duration: 100000,
                });
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name}</h3>
                      {getStatusBadge(user.status)}
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>ID: {user.id}</span>
                      <span>Role: {user.role}</span>
                      <span>Joined: {user.joinDate}</span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {user.phone}
                        </span>
                      )}
                      {user.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {user.region}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {user.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePermissionsClick(user)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Permissions
                  </Button>
                  {user.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(user.id, "suspended")}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(user.id, "active")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No users found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  handleFilterReset();
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Permissions Sheet */}
      <Sheet open={showPermissionsSheet} onOpenChange={setShowPermissionsSheet}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>User Permissions</SheetTitle>
            <SheetDescription>
              {selectedUser
                ? `Manage permissions for ${selectedUser.name}`
                : "Select permissions for this user"}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            {availablePermissions.map((permission) => (
              <div key={permission.id} className="flex items-start space-x-4">
                <Checkbox
                  id={`perm-${permission.id}`}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPermissions([
                        ...selectedPermissions,
                        permission.id,
                      ]);
                    } else {
                      setSelectedPermissions(
                        selectedPermissions.filter((p) => p !== permission.id),
                      );
                    }
                  }}
                />
                <div className="space-y-1">
                  <Label htmlFor={`perm-${permission.id}`}>
                    {permission.name}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {permission.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <SheetFooter>
            <Button onClick={handleUpdatePermissions}>Save Permissions</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
