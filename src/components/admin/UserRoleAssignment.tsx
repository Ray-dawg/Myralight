import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { Id } from "@/lib/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  UserCog,
  Users,
  Shield,
  Filter,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role?: string; // Legacy field
  roleId?: Id<"roles">;
  lastLogin?: number;
  createdAt: number;
}

interface Role {
  _id: Id<"roles">;
  name: string;
  isCustom: boolean;
  permissions: string[];
}

export default function UserRoleAssignment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<Id<"roles"> | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Get current user
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get all users
  const users = useQuery(api.users.listUsers);

  // Get all roles
  const roles = useQuery(api.permissions.getAllRoles);

  // Mutations
  const assignRoleToUser = useMutation(api.permissions.assignRoleToUser);

  // Filter users based on search query
  const filteredUsers =
    users?.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Get role name for a user
  const getRoleName = (user: User) => {
    if (user.roleId) {
      const role = roles?.find((r) => r._id === user.roleId);
      return role?.name || "Unknown Role";
    }
    return user.role || "No Role";
  };

  // Handle role assignment
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId || !currentUser?._id) return;

    try {
      await assignRoleToUser({
        userId: selectedUser._id,
        roleId: selectedRoleId,
        assignedBy: currentUser._id,
      });

      setStatusMessage({
        type: "success",
        message: `Role successfully assigned to ${selectedUser.name}`,
      });

      // Close dialog after successful assignment
      setIsAssignDialogOpen(false);

      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error assigning role:", error);
      setStatusMessage({
        type: "error",
        message: `Failed to assign role: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Role Assignment</h1>
          <p className="text-gray-500 mt-1">
            Assign roles to users to control their permissions
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-md ${statusMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {statusMessage.type === "success" ? (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {statusMessage.message}
            </div>
          ) : (
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              {statusMessage.message}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Users</span>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getRoleName(user)}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedRoleId(user.roleId || null);
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      <UserCog className="h-4 w-4 mr-1" />
                      Assign Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  Select a role to assign to{" "}
                  <strong>{selectedUser.name}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedRoleId?.toString() || ""}
              onValueChange={(value) => setSelectedRoleId(value as Id<"roles">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    <div className="flex items-center gap-2">
                      {role.name}
                      {!role.isCustom && (
                        <Badge variant="outline" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRoleId && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role Permissions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {roles
                    ?.find((r) => r._id === selectedRoleId)
                    ?.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary">
                        {permission}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRoleId}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
