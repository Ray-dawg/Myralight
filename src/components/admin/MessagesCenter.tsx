import React, { useState } from "react";
import { MessageCenter } from "../shared/MessageCenter";
import AdminDashboardLayout from "../layout/AdminDashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, Filter, Users, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { chatService } from "@/lib/chat";

export function AdminMessagesCenterContent() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch users
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // This would be replaced with an actual API call to get users
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          // Fallback mock data for development
          setUsers([
            {
              id: "1",
              name: "Admin User",
              role: "admin",
              last_active: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Shipper Company",
              role: "shipper",
              last_active: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Carrier Service",
              role: "carrier",
              last_active: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: "4",
              name: "Driver One",
              role: "driver",
              last_active: new Date(Date.now() - 172800000).toISOString(),
            },
            {
              id: "5",
              name: "Support Team",
              role: "admin",
              last_active: new Date(Date.now() - 3600000).toISOString(),
            },
          ]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        // Fallback mock data
        setUsers([
          {
            id: "1",
            name: "Admin User",
            role: "admin",
            last_active: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Shipper Company",
            role: "shipper",
            last_active: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Carrier Service",
            role: "carrier",
            last_active: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "4",
            name: "Driver One",
            role: "driver",
            last_active: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: "5",
            name: "Support Team",
            role: "admin",
            last_active: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  const handleCreateChat = async (userId: string) => {
    try {
      // Create a new chat with the selected user
      const chatId = await chatService.createChat({
        participants: [user?.id || "", userId],
        is_group: false,
        name: users.find((u) => u.id === userId)?.name || "New Chat",
      });

      setSelectedUser(chatId);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "admin") return matchesSearch && user.role === "admin";
    if (activeTab === "shipper")
      return matchesSearch && user.role === "shipper";
    if (activeTab === "carrier")
      return matchesSearch && user.role === "carrier";
    if (activeTab === "driver") return matchesSearch && user.role === "driver";
    return matchesSearch;
  });

  // Mobile view handling
  const isMobileView = window.innerWidth < 768;

  return (
    <div className="container mx-auto py-4 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Admin Message Center</h1>
        {selectedUser && isMobileView && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User list - hidden on mobile when a chat is selected */}
        <div
          className={`md:col-span-1 ${selectedUser && isMobileView ? "hidden" : "block"}`}
        >
          <Card className="p-4">
            <Tabs
              defaultValue="all"
              className="mb-4"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="shipper">Shipper</TabsTrigger>
                <TabsTrigger value="carrier">Carrier</TabsTrigger>
                <TabsTrigger value="driver">Driver</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative mb-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-sm text-muted-foreground">
                    Loading users...
                  </p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <Users className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No users found
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-lg mb-1 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-medium text-sm truncate">
                            {user.name}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.last_active).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>

            <div className="p-4 border-t mt-4">
              <Button className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Group Chat
              </Button>
            </div>
          </Card>
        </div>

        {/* Message center - shown on mobile only when a chat is selected */}
        <div
          className={`md:col-span-2 ${!selectedUser && isMobileView ? "hidden" : "block"}`}
        >
          <Card className="h-[600px] flex flex-col">
            {selectedUser ? (
              <div className="flex-1 overflow-hidden">
                <MessageCenter />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">
                  Select a user to message
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a user from the list to view and send messages. As an
                  admin, you can message any user in the system.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminMessagesCenter() {
  return (
    <AdminDashboardLayout>
      <AdminMessagesCenterContent />
    </AdminDashboardLayout>
  );
}
