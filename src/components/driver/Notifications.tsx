import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, MapPin, AlertTriangle, DollarSign } from "lucide-react";

interface Notification {
  id: string;
  type: "load" | "weather" | "payment" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "load",
      title: "New Load Available",
      message: "A new load matching your preferences is available.",
      timestamp: "5 minutes ago",
      read: false,
    },
    {
      id: "2",
      type: "weather",
      title: "Weather Alert",
      message: "Severe weather conditions expected on your route.",
      timestamp: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      type: "payment",
      title: "Payment Processed",
      message: "Your payment for load #L-1234 has been processed.",
      timestamp: "2 hours ago",
      read: true,
    },
  ]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "load":
        return <MapPin className="h-5 w-5 text-blue-500" />;
      case "weather":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {notifications.filter((n) => !n.read).length} unread notifications
            </p>
          </div>
          <Button variant="outline">Mark All as Read</Button>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? "opacity-75" : ""}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <Badge className="bg-blue-100 text-blue-800">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {notification.timestamp}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
