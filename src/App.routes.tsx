import { Route } from "react-router-dom";
import ShipmentDetails from "./components/shipper/ShipmentDetails";
import ShipperDashboardLayout from "./components/layout/ShipperDashboardLayout";
import LoadManagement from "./components/shipper/LoadManagement";
import DocumentCenter from "./components/shared/DocumentCenter";
import MessagesPage from "./components/shared/MessagesPage";
import ShipperMessagesCenter from "./components/shipper/MessagesCenter";
import DriverMessagesCenter from "./components/driver/MessagesCenter";
import CarrierMessagesCenter from "./components/carrier/MessagesCenter";
import AdminMessagesCenter from "./components/admin/MessagesCenter";
import AdminDashboardLayout from "./components/layout/AdminDashboardLayout";

export const shipperRoutes = [
  <Route
    key="shipment-details"
    path="/shipper/shipments/:id"
    element={
      <ShipperDashboardLayout>
        <ShipmentDetails />
      </ShipperDashboardLayout>
    }
  />,
  <Route
    key="load-management"
    path="/shipper/loads"
    element={
      <ShipperDashboardLayout>
        <LoadManagement />
      </ShipperDashboardLayout>
    }
  />,
  <Route
    key="document-center"
    path="/shipper/documents"
    element={
      <ShipperDashboardLayout>
        <DocumentCenter />
      </ShipperDashboardLayout>
    }
  />,
  <Route key="messages" path="/messages" element={<MessagesPage />} />,
  <Route
    key="messages-load"
    path="/messages/:loadId"
    element={<MessagesPage />}
  />,
  <Route
    key="shipper-messages"
    path="/shipper/messages"
    element={
      <ShipperDashboardLayout>
        <ShipperMessagesCenter />
      </ShipperDashboardLayout>
    }
  />,
  <Route
    key="shipper-messages-load"
    path="/shipper/messages/:loadId"
    element={
      <ShipperDashboardLayout>
        <ShipperMessagesCenter />
      </ShipperDashboardLayout>
    }
  />,
  <Route
    key="driver-messages"
    path="/driver/messages"
    element={<DriverMessagesCenter />}
  />,
  <Route
    key="driver-messages-load"
    path="/driver/messages/:loadId"
    element={<DriverMessagesCenter />}
  />,
  <Route
    key="carrier-messages"
    path="/carrier/messages"
    element={<CarrierMessagesCenter />}
  />,
  <Route
    key="carrier-messages-load"
    path="/carrier/messages/:loadId"
    element={<CarrierMessagesCenter />}
  />,
  <Route
    key="admin-messages"
    path="/admin/messages"
    element={<AdminMessagesCenter />}
  />,
];
