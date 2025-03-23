import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Send } from "lucide-react";

interface Message {
  id: string;
  sender: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  timestamp: string;
  unread?: boolean;
}

interface Chat {
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

export default function MessagesCenter() {
  const [selectedChat, setSelectedChat] = useState<string | null>("1");
  const [newMessage, setNewMessage] = useState("");

  const [chats] = useState<Chat[]>([
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
  ]);

  const [messages] = useState<Message[]>([
    {
      id: "m1",
      sender: {
        name: "Dispatch Team",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dispatch",
        role: "Dispatcher",
      },
      content:
        "Your next load details have been updated. Please review and confirm.",
      timestamp: "10:30 AM",
    },
    {
      id: "m2",
      sender: {
        name: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=driver",
        role: "Driver",
      },
      content: "Thanks, I'll check them now.",
      timestamp: "10:32 AM",
    },
    {
      id: "m3",
      sender: {
        name: "Dispatch Team",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dispatch",
        role: "Dispatcher",
      },
      content: "Please confirm by 11 AM if possible.",
      timestamp: "10:33 AM",
      unread: true,
    },
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // Add message sending logic here
    setNewMessage("");
  };

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[calc(100vh-8rem)]">
          <div className="grid grid-cols-12 h-full">
            {/* Chat List */}
            <div className="col-span-4 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search messages..." className="pl-10" />
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(100%-73px)]">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedChat === chat.id ? "bg-gray-50" : ""}`}
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
                            <p className="font-medium truncate">
                              {chat.user.name}
                            </p>
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
                          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {chat.unread} new
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="col-span-8 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          chats.find((c) => c.id === selectedChat)?.user.avatar
                        }
                        alt="User"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">
                          {chats.find((c) => c.id === selectedChat)?.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {chats.find((c) => c.id === selectedChat)?.user.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${message.sender.role === "Driver" ? "flex-row-reverse" : ""}`}
                      >
                        <img
                          src={message.sender.avatar}
                          alt={message.sender.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div
                          className={`max-w-[70%] ${message.sender.role === "Driver" ? "bg-blue-500 text-white" : "bg-gray-100"} rounded-lg p-3`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${message.sender.role === "Driver" ? "text-blue-100" : "text-gray-500"}`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a chat to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
