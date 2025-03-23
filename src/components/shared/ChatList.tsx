import React, { useState } from "react";
import { MessageSquare, Truck, Package, Building } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ChatRoom {
  id: string;
  user: {
    name: string;
    avatar: string;
    role: string;
    online?: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface ChatListProps {
  onSelectChat?: (chatId: string) => void;
  className?: string;
}

export function ChatList({ onSelectChat, className = "" }: ChatListProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>("1");

  // Mock data for demonstration
  const chats: ChatRoom[] = [
    {
      id: "1",
      user: {
        name: "Dispatch Team",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dispatch",
        role: "Dispatcher",
        online: true,
      },
      lastMessage: "Your next load details have been updated.",
      timestamp: "10:30 AM",
      unread: 2,
    },
    {
      id: "2",
      user: {
        name: "Fleet Manager",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager",
        role: "Manager",
        online: true,
      },
      lastMessage: "Great job on the last delivery!",
      timestamp: "Yesterday",
      unread: 0,
    },
    {
      id: "3",
      user: {
        name: "Support Team",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=support",
        role: "Support",
        online: false,
      },
      lastMessage: "Your ticket has been resolved.",
      timestamp: "Yesterday",
      unread: 0,
    },
  ];

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    if (onSelectChat) {
      onSelectChat(chatId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "driver":
        return <Truck className="h-4 w-4" />;
      case "shipper":
        return <Package className="h-4 w-4" />;
      case "carrier":
      case "dispatcher":
      case "manager":
        return <Building className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium">Messages</h3>
        <p className="text-sm text-muted-foreground">
          Your active conversations
        </p>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
          <p>No active conversations</p>
          <p className="text-sm">
            Messages related to your loads will appear here
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedChat === chat.id ? "bg-primary/10" : "hover:bg-muted"}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src={chat.user.avatar}
                      alt={chat.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    {chat.user.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium truncate">{chat.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {chat.user.role}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {chat.timestamp}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <div className="mt-1">
                        <Badge variant="default" className="text-xs">
                          {chat.unread} new
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
