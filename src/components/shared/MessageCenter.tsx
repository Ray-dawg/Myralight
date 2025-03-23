import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatContainer } from "./ChatContainer";
import { Search, Plus, MessageSquare, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { chatService, ChatSession } from "@/lib/chat";
import { useAuth } from "@/lib/auth";

interface MessageCenterProps {}

export function MessageCenter({}: MessageCenterProps) {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch chats and unread counts
  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const userChats = await chatService.getUserChats();
        setChats(userChats);

        // Get unread counts for each chat
        const counts: Record<string, number> = {};
        for (const chat of userChats) {
          const count = await chatService.getUnreadMessageCount(chat.id);
          counts[chat.id] = count;
        }
        setUnreadCounts(counts);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setIsLoading(false);
      }
    };

    fetchChats();

    // Subscribe to new messages to update unread counts
    const subscriptions = chats.map((chat) => {
      return chatService.subscribeToChat(chat.id, (message) => {
        // Update unread count for this chat
        setUnreadCounts((prev) => ({
          ...prev,
          [chat.id]: (prev[chat.id] || 0) + 1,
        }));
      });
    });

    return () => {
      // Clean up subscriptions
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [user]);

  // Mark messages as read when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      chatService
        .markMessagesAsRead(selectedChat)
        .then(() => {
          // Reset unread count for this chat
          setUnreadCounts((prev) => ({
            ...prev,
            [selectedChat]: 0,
          }));
        })
        .catch(console.error);
    }
  }, [selectedChat]);

  const filteredChats = chats.filter(
    (chat) =>
      !searchQuery ||
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatChatTime = (date: string | null) => {
    if (!date) return "";

    const chatDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) {
      return format(chatDate, "h:mm a");
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return format(chatDate, "EEEE");
    } else {
      return format(chatDate, "MMM d");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] border rounded-lg overflow-hidden">
      {/* Chat list sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-2">
            <TabsContent value="all" className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-sm text-muted-foreground">
                    Loading chats...
                  </p>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No messages found
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg mb-1 cursor-pointer hover:bg-muted/50 ${selectedChat === chat.id ? "bg-muted" : ""}`}
                    onClick={() => setSelectedChat(chat.id)}
                  >
                    <div className="flex items-center gap-3">
                      {chat.is_group ? (
                        <div className="relative h-10 w-10 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ) : (
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback>
                            {(chat.name || "Chat")
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-medium text-sm truncate">
                            {chat.name || `Chat ${chat.id.substring(0, 8)}`}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatChatTime(chat.last_message_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.last_message || "No messages yet"}
                        </p>
                      </div>
                    </div>

                    {unreadCounts[chat.id] > 0 && (
                      <div className="flex justify-end mt-1">
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                          {unreadCounts[chat.id]}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-sm text-muted-foreground">
                    Loading chats...
                  </p>
                </div>
              ) : filteredChats.filter((c) => unreadCounts[c.id] > 0).length ===
                0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No unread messages
                  </p>
                </div>
              ) : (
                filteredChats
                  .filter((c) => unreadCounts[c.id] > 0)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg mb-1 cursor-pointer hover:bg-muted/50 ${selectedChat === chat.id ? "bg-muted" : ""}`}
                      onClick={() => setSelectedChat(chat.id)}
                    >
                      {/* Same chat item content as above */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback>
                            {(chat.name || "Chat")
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-medium text-sm truncate">
                              {chat.name || `Chat ${chat.id.substring(0, 8)}`}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatChatTime(chat.last_message_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {chat.last_message || "No messages yet"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end mt-1">
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                          {unreadCounts[chat.id]}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="groups" className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-sm text-muted-foreground">
                    Loading chats...
                  </p>
                </div>
              ) : filteredChats.filter((c) => c.is_group).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <Users className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No group chats found
                  </p>
                </div>
              ) : (
                filteredChats
                  .filter((c) => c.is_group)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg mb-1 cursor-pointer hover:bg-muted/50 ${selectedChat === chat.id ? "bg-muted" : ""}`}
                      onClick={() => setSelectedChat(chat.id)}
                    >
                      {/* Group chat item content */}
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-medium text-sm truncate">
                              {chat.name || `Group ${chat.id.substring(0, 8)}`}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatChatTime(chat.last_message_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {chat.last_message || "No messages yet"}
                          </p>
                        </div>
                      </div>

                      {unreadCounts[chat.id] > 0 && (
                        <div className="flex justify-end mt-1">
                          <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                            {unreadCounts[chat.id]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </TabsContent>
          </ScrollArea>

          <div className="p-4 border-t">
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </Tabs>
      </div>

      {/* Chat container */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatContainer loadId={selectedChat} isFullScreen={false} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No conversation selected
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Select a conversation from the sidebar or start a new one to begin
              messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageCenter;
