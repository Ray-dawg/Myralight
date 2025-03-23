import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";
import { format } from "date-fns";

interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  timestamp?: string;
  read?: boolean;
  onClose: (id: string) => void;
  onClick?: (id: string) => void;
}

const notificationVariants = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

export const Notification = ({
  id,
  title,
  message,
  type = "info",
  timestamp,
  read = false,
  onClose,
  onClick,
}: NotificationProps) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColors = {
    success: "bg-green-50 border-green-100",
    error: "bg-red-50 border-red-100",
    warning: "bg-yellow-50 border-yellow-100",
    info: "bg-blue-50 border-blue-100",
  };

  const textColors = {
    success: "text-green-800",
    error: "text-red-800",
    warning: "text-yellow-800",
    info: "text-blue-800",
  };

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          variants={notificationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`${bgColors[type]} border rounded-lg p-4 shadow-lg max-w-sm w-full cursor-pointer`}
          onClick={handleClick}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <h3 className={`font-medium ${textColors[type]}`}>{title}</h3>
              <p className="text-sm mt-1 text-gray-600">{message}</p>
              {timestamp && (
                <p className="text-xs mt-1 text-gray-500">
                  {format(new Date(timestamp), "MMM d, h:mm a")}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="-mt-1 -mr-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                onClose(id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const NotificationContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">{children}</div>
);

export const NotificationBell = ({ className }: { className?: string }) => {
  const [notifications, setNotifications] = React.useState<NotificationProps[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  // Mock data - in a real app, this would come from your API
  React.useEffect(() => {
    // Simulate getting notifications
    const mockNotifications = [
      {
        id: "1",
        title: "New message",
        message: "You have a new message from John Doe",
        type: "info" as const,
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: "2",
        title: "Load status updated",
        message: "Load #12345 status changed to In Transit",
        type: "success" as const,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, []);

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleClick = (id: string) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    // Update unread count
    setUnreadCount((prev) => {
      const notification = notifications.find((n) => n.id === id);
      return notification && !notification.read ? prev - 1 : prev;
    });

    // Close popover
    setOpen(false);

    // Navigate or perform action (in a real app)
    console.log(`Clicked notification ${id}`);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-8"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notifications
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${!notification.read ? "bg-gray-50 dark:bg-gray-900" : ""}`}
                  onClick={() => handleClick(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notification.message}
                      </p>
                      {notification.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {format(
                            new Date(notification.timestamp),
                            "MMM d, h:mm a",
                          )}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
