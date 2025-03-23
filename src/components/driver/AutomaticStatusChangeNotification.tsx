import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface AutomaticStatusChangeNotificationProps {
  status?: "assigned" | "in_transit" | "at_pickup" | "at_delivery" | null;
  previousStatus?:
    | "assigned"
    | "in_transit"
    | "at_pickup"
    | "at_delivery"
    | null;
  loadId?: string;
  locationName?: string;
  timestamp?: Date;
  onDismiss?: () => void;
}

const AutomaticStatusChangeNotification: React.FC<
  AutomaticStatusChangeNotificationProps
> = ({
  status,
  previousStatus,
  loadId = "Unknown",
  locationName = "location",
  timestamp = new Date(),
  onDismiss,
}) => {
  const { toast } = useToast();
  const [visible, setVisible] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Reset visibility when status changes
    setVisible(true);

    // Check if we have notification permission
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }

    // Show toast notification
    if (status && previousStatus && status !== previousStatus) {
      toast({
        title: `Status Updated: ${formatStatus(status)}`,
        description: `Your load status has been automatically updated at ${locationName}.`,
        variant: "default",
      });

      // Show browser notification if permission granted
      if (hasPermission) {
        try {
          const notification = new Notification("Status Updated", {
            body: `Your load status has been automatically updated to ${formatStatus(status)} at ${locationName}.`,
            icon: "/vite.svg", // Replace with your app icon
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (error) {
          console.error("Error showing notification:", error);
        }
      }
    }
  }, [status, previousStatus, locationName, toast, hasPermission]);

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === "granted");

      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive status change notifications.",
        });
      }
    }
  };

  // If no status change or notification dismissed, don't show anything
  if (!status || !previousStatus || status === previousStatus || !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Status Automatically Updated
            </h3>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              <p>
                Load #{loadId} status changed from{" "}
                <span className="font-medium">
                  {formatStatus(previousStatus)}
                </span>{" "}
                to <span className="font-medium">{formatStatus(status)}</span>
              </p>
              <p className="mt-1">
                Location: <span className="font-medium">{locationName}</span>
              </p>
              <p className="mt-1">
                Time:{" "}
                <span className="font-medium">{formatTime(timestamp)}</span>
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex-shrink-0 ml-4 bg-white dark:bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={handleDismiss}
        >
          <span className="sr-only">Close</span>
          <X className="h-5 w-5" />
        </button>
      </div>

      {!hasPermission && "Notification" in window && (
        <div className="mt-3 flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="text-xs"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={requestNotificationPermission}
            className="text-xs"
          >
            Enable Notifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default AutomaticStatusChangeNotification;
