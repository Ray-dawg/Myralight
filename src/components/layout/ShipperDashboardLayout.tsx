import React, { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  LogOut,
  FileText,
  Settings,
  MessageCircle,
  User,
  HelpCircle,
  Package,
  Truck,
  BarChart3,
  AlertCircle,
  CalendarDays,
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
import { Button } from "@/components/ui/button";

interface ShipperDashboardLayoutProps {
  children: ReactNode;
}

export default function ShipperDashboardLayout({
  children,
}: ShipperDashboardLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Package, label: "Shipments", path: "/shipper/shipments" },
    { icon: Truck, label: "Carriers", path: "/shipper/carriers" },
    { icon: CalendarDays, label: "Schedule", path: "/shipper/schedule" },
    { icon: BarChart3, label: "Analytics", path: "/shipper/analytics" },
    { icon: AlertCircle, label: "Alerts", path: "/shipper/alerts" },
    { icon: MessageCircle, label: "Messages", path: "/shipper/messages" },
    { icon: Settings, label: "Settings", path: "/shipper/settings" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="h-full relative">
          {/* Header */}
          <div className="absolute top-6 md:left-32 left-4 right-4 md:right-6 pointer-events-auto">
            <div className="bg-white shadow-lg rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
              <div className="relative w-full md:w-96">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search shipments, carriers..."
                  className="pl-10 h-10 w-full rounded-lg border border-gray-200 bg-white/50 px-4 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto md:ml-auto">
                <div className="relative">
                  <Button variant="ghost" size="icon">
                    <Bell className="w-5 h-5" />
                  </Button>
                </div>
                <div className="relative">
                  <ThemeToggle />
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
                          src="https://api.dicebear.com/7.x/avataaars/svg?seed=shipper"
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
                          <p className="font-medium">Shipper Company</p>
                          <p className="text-xs text-muted-foreground">
                            Logistics Manager
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/shipper/profile")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Company Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/update-profile-picture")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Update Profile Picture</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/shipper/settings")}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/shipper/notifications")}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Notifications</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/shipper/help")}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Help & Support</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/shipper/docs")}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Documentation</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/delete-account")}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Account</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={logout}
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
                  onClick={() => handleNavigation(Item.path)}
                  className={`p-2 rounded-lg transition-colors
                    ${location.pathname === Item.path ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Item.icon className="w-6 h-6 stroke-[1.5]" />
                </button>
              ))}
            </nav>
            <button
              className="text-gray-400 hover:text-gray-600 mt-auto"
              onClick={logout}
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
                  onClick={() => handleNavigation(Item.path)}
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
