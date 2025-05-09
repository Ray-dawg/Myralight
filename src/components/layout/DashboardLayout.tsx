import React, { ReactNode, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Bell,
  Search,
  LogOut,
  Clock,
  MapPin,
  Navigation,
  LayoutDashboard,
  FileText,
  DollarSign,
  Settings,
  MessageCircle,
  History,
  Truck,
  User,
  HelpCircle,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState("Navigation");
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New load available", unread: true },
    { id: 2, message: "Weather alert ahead", unread: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { icon: FileText, label: "Documents", path: "/driver/documents" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/driver" },
    { icon: Truck, label: "Truck", path: "/driver/truck" },
    { icon: Navigation, label: "Navigation", path: "/driver/navigation" },
    { icon: DollarSign, label: "Earnings", path: "/driver/earnings" },
    { icon: History, label: "History", path: "/driver/history" },
    { icon: MessageCircle, label: "Messages", path: "/driver/messages" },
    { icon: Settings, label: "Settings", path: "/driver/settings" },
  ];

  const handleNavigation = (path: string, label: string) => {
    setActiveNav(label);
    navigate(path);
  };

  const handleNotificationClick = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, unread: false } : notif,
      ),
    );
  };

  const handleLogout = () => {
    try {
      // Call logout directly without async/await
      logout();
      // No need for success toast or navigation here
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen relative overflow-hidden">
      {/* UI Layer */}
      <div className="absolute inset-0">
        <div className="h-full relative">
          {/* Header */}
          <div className="absolute top-6 md:left-32 left-4 right-4 md:right-6 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
              <div className="relative w-full md:w-96">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search destinations, stops..."
                  className="pl-10 h-10 w-full rounded-lg border border-gray-200 bg-white/50 px-4 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto md:ml-auto">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  8h Remaining
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Chicago, IL
                </Badge>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.some((n) => n.unread) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border p-2 z-50">
                      {notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`w-full text-left p-3 rounded-lg mb-1 ${
                            notif.unread ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          {notif.message}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <img
                          src="https://api.dicebear.com/7.x/avataaars/svg?seed=driver"
                          alt="Profile"
                          className="w-8 h-8 rounded-full"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">John Doe</p>
                          <p className="text-xs text-muted-foreground">
                            Driver
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/driver/profile")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/driver/settings")}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/driver/notifications")}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Notifications</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/driver/help")}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Help & Support</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/driver/docs")}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Documentation</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="absolute left-4 top-6 w-20 bg-white hidden md:flex flex-col items-center py-6 space-y-8 rounded-3xl shadow-lg pointer-events-auto">
            <div className="w-12 h-12 bg-blue-600 rounded-full"></div>
            <nav className="flex flex-col items-center space-y-8 flex-grow">
              {navItems.map((Item) => (
                <button
                  key={Item.label}
                  onClick={() => handleNavigation(Item.path, Item.label)}
                  className={`p-2 rounded-lg transition-colors
                    ${
                      location.pathname === Item.path
                        ? "text-blue-600"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <Item.icon className="w-6 h-6 stroke-[1.5]" />
                </button>
              ))}
            </nav>
            <button
              className="text-gray-400 hover:text-gray-600 mt-auto"
              onClick={handleLogout}
            >
              <LogOut className="w-6 h-6 stroke-[1.5]" />
            </button>
          </aside>

          {/* Mobile Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden pointer-events-auto z-50">
            <nav className="flex justify-around items-center py-3">
              {navItems.slice(0, 5).map((Item) => (
                <button
                  key={Item.label}
                  onClick={() => handleNavigation(Item.path, Item.label)}
                  className={`p-2 rounded-lg transition-colors
                    ${location.pathname === Item.path ? "text-blue-600" : "text-gray-400"}`}
                >
                  <Item.icon className="w-6 h-6 stroke-[1.5]" />
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="pt-28 md:pl-28 h-full overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
