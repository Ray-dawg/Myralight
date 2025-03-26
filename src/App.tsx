import { Suspense, lazy } from "react";
import DocumentCenter from "./components/driver/DocumentCenter";
import EarningsDashboard from "./components/driver/EarningsDashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import CarrierDashboardLayout from "./components/layout/CarrierDashboardLayout";
import ShipperDashboardLayout from "./components/layout/ShipperDashboardLayout";
import AdminDashboardLayout from "./components/layout/AdminDashboardLayout";
import ShipmentsDashboard from "./components/shipper/ShipmentsDashboard";
import ShipperLoadManagement from "./components/shipper/LoadManagement";
import TruckManagement from "./components/driver/TruckManagement";
import TripHistory from "./components/driver/TripHistory";
import MessagesCenter from "./components/driver/MessagesCenter";
import Settings from "./components/driver/Settings";
import LoadDiscovery from "./components/driver/LoadDiscovery";
import DriverMapView from "./components/driver/DriverMapView";
import FleetDashboard from "./components/carrier/FleetDashboard";
import CarrierEarningsDashboard from "./components/carrier/EarningsDashboard";
import CompanySettings from "./components/carrier/CompanySettings";
import DriverProfile from "./components/carrier/DriverProfile";
import DriverManagement from "./components/carrier/DriverManagement";
import FinancialDashboard from "./components/carrier/FinancialDashboard";
import LoadTrackingDashboard from "./components/carrier/LoadTrackingDashboard";
import DriverDashboard from "./components/driver/DriverDashboard";
import ClaimsManagement from "./components/carrier/ClaimsManagement";
import HelpSupport from "./components/driver/HelpSupport";
import Documentation from "./components/driver/Documentation";
import Profile from "./components/driver/Profile";
import Notifications from "./components/driver/Notifications";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminLoadManagement from "./components/admin/LoadManagement";
import PermissionManagement from "./components/admin/PermissionManagement";
import ClaimSupport from "./components/admin/ClaimSupport";
import ApiManagement from "./components/admin/ApiManagement";
import UserFinancialManagement from "./components/admin/UserFinancialManagement";
import DocumentManager from "./components/admin/DocumentManager";
import BatchOperations from "./components/admin/BatchOperations";
import SystemHealth from "./components/admin/SystemHealth";
import SecurityDashboard from "./components/admin/SecurityDashboard";
import DataDashboard from "./components/admin/DataDashboard";
import UsersDashboard from "./components/admin/UsersDashboard";
import AdminSettings from "./components/admin/AdminSettings";
import AdminLoadCreation from "./components/admin/LoadCreation";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import { shipperRoutes } from "./App.routes";
import RateManagement from "./components/shipper/RateManagement";
import ShippingReports from "./components/shipper/ShippingReports";
import Analytics from "./components/shipper/Analytics";
import CarrierDirectory from "./components/shipper/CarrierDirectory";
import Schedule from "./components/shipper/Schedule";
import Alerts from "./components/shipper/Alerts";
import ShipperLoadCreation from "./components/shipper/LoadCreation";
import Home from "./components/home";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import EmailVerification from "./components/auth/EmailVerification";
import DeleteAccount from "./components/auth/DeleteAccount";
import ProfilePictureUpload from "./components/auth/ProfilePictureUpload";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import AuthGuard from "./components/auth/AuthGuard";
import { AuthProvider } from "./lib/auth.tsx";
import { ThemeProvider } from "./components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import routes from "tempo-routes";

import TooltipProvider from "./components/layout/TooltipProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            }
          >
            <div>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/delete-account" element={<DeleteAccount />} />
                <Route
                  path="/update-profile-picture"
                  element={<ProfilePictureUpload />}
                />

                {/* Shipper Routes */}
                {shipperRoutes}

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AuthGuard allowedRoles={["admin"]}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AdminDashboardLayout>
                            <AdminDashboard />
                          </AdminDashboardLayout>
                        </TooltipTrigger>
                        <TooltipContent>Admin Dashboard</TooltipContent>
                      </Tooltip>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/admin/permissions"
                  element={
                    <AdminDashboardLayout>
                      <PermissionManagement />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/claims"
                  element={
                    <AdminDashboardLayout>
                      <ClaimSupport />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/api"
                  element={
                    <AdminDashboardLayout>
                      <ApiManagement />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/financial"
                  element={
                    <AdminDashboardLayout>
                      <UserFinancialManagement />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/documents"
                  element={
                    <AdminDashboardLayout>
                      <DocumentManager />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/batch"
                  element={
                    <AdminDashboardLayout>
                      <BatchOperations />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/load-creation"
                  element={
                    <AdminDashboardLayout>
                      <AdminLoadCreation />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/system-health"
                  element={
                    <AdminDashboardLayout>
                      <SystemHealth />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/security"
                  element={
                    <AdminDashboardLayout>
                      <SecurityDashboard />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/data"
                  element={
                    <AdminDashboardLayout>
                      <DataDashboard />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminDashboardLayout>
                      <UsersDashboard />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminDashboardLayout>
                      <AdminSettings />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/profile"
                  element={
                    <AdminDashboardLayout>
                      <Profile />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <AdminDashboardLayout>
                      <Notifications />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/help"
                  element={
                    <AdminDashboardLayout>
                      <HelpSupport />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/docs"
                  element={
                    <AdminDashboardLayout>
                      <Documentation />
                    </AdminDashboardLayout>
                  }
                />
                <Route
                  path="/admin/loads"
                  element={
                    <AdminDashboardLayout>
                      <AdminLoadManagement />
                    </AdminDashboardLayout>
                  }
                />

                {/* Driver Routes */}
                <Route
                  path="/driver"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <DriverDashboard />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/documents"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <DocumentCenter />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/earnings"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <EarningsDashboard />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/navigation"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <DriverMapView driverId="driver-123" />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/truck"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <TruckManagement />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/history"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <TripHistory />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/messages"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <MessagesCenter />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/settings"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <Settings />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/profile"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <Profile />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/notifications"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <Notifications />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/help"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <HelpSupport />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/driver/docs"
                  element={
                    <AuthGuard allowedRoles={["driver", "admin"]}>
                      <DashboardLayout>
                        <Documentation />
                      </DashboardLayout>
                    </AuthGuard>
                  }
                />

                {/* Carrier Routes */}
                <Route
                  path="/carrier"
                  element={
                    <AuthGuard allowedRoles={["carrier", "admin"]}>
                      <CarrierDashboardLayout>
                        <FleetDashboard />
                      </CarrierDashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/carrier/fleet"
                  element={
                    <CarrierDashboardLayout>
                      <FleetDashboard />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/tracking"
                  element={
                    <CarrierDashboardLayout>
                      <LoadTrackingDashboard />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/analytics"
                  element={
                    <CarrierDashboardLayout>
                      <FinancialDashboard />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/drivers"
                  element={
                    <CarrierDashboardLayout>
                      <DriverManagement />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/earnings"
                  element={
                    <CarrierDashboardLayout>
                      <CarrierEarningsDashboard />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/settings"
                  element={
                    <CarrierDashboardLayout>
                      <CompanySettings />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/drivers/:id"
                  element={
                    <CarrierDashboardLayout>
                      <DriverProfile />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/documents"
                  element={
                    <CarrierDashboardLayout>
                      <DocumentCenter />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/messages"
                  element={
                    <CarrierDashboardLayout>
                      <MessagesCenter />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/claims"
                  element={
                    <CarrierDashboardLayout>
                      <ClaimsManagement />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/help"
                  element={
                    <CarrierDashboardLayout>
                      <HelpSupport />
                    </CarrierDashboardLayout>
                  }
                />
                <Route
                  path="/carrier/docs"
                  element={
                    <CarrierDashboardLayout>
                      <Documentation />
                    </CarrierDashboardLayout>
                  }
                />

                {/* Shipper Routes */}
                <Route
                  path="/shipper"
                  element={
                    <AuthGuard allowedRoles={["shipper", "admin"]}>
                      <ShipperDashboardLayout>
                        <ShipmentsDashboard />
                      </ShipperDashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/shipper/shipments"
                  element={
                    <ShipperDashboardLayout>
                      <ShipmentsDashboard />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/loads"
                  element={
                    <ShipperDashboardLayout>
                      <ShipperLoadManagement />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/messages"
                  element={
                    <ShipperDashboardLayout>
                      <MessagesCenter />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/settings"
                  element={
                    <ShipperDashboardLayout>
                      <Settings />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/rates"
                  element={
                    <ShipperDashboardLayout>
                      <RateManagement />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/reports"
                  element={
                    <ShipperDashboardLayout>
                      <ShippingReports />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/profile"
                  element={
                    <ShipperDashboardLayout>
                      <Profile />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/notifications"
                  element={
                    <ShipperDashboardLayout>
                      <Notifications />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/help"
                  element={
                    <ShipperDashboardLayout>
                      <HelpSupport />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/docs"
                  element={
                    <ShipperDashboardLayout>
                      <Documentation />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/analytics"
                  element={
                    <ShipperDashboardLayout>
                      <Analytics />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/carriers"
                  element={
                    <ShipperDashboardLayout>
                      <CarrierDirectory />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/schedule"
                  element={
                    <ShipperDashboardLayout>
                      <Schedule />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/alerts"
                  element={
                    <ShipperDashboardLayout>
                      <Alerts />
                    </ShipperDashboardLayout>
                  }
                />
                <Route
                  path="/shipper/load-creation"
                  element={
                    <ShipperDashboardLayout>
                      <ShipperLoadCreation />
                    </ShipperDashboardLayout>
                  }
                />
              </Routes>
              {import.meta.env.VITE_TEMPO && useRoutes(routes)}
              <Toaster />
            </div>
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
