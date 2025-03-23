import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { chatService, ChatMessage } from "@/lib/chat";

interface ChatContainerProps {
  loadId: string;
  isFullScreen?: boolean;
}

export function ChatContainer({
  loadId,
  isFullScreen = false,
}: ChatContainerProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "error"
  >("connected");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      try {
        const msgs = await chatService.getMessages(loadId);
        setMessages(msgs);
      } catch (error) {
        console.error("Error loading messages:", error);
        setConnectionStatus("error");
      }
    };
    loadMessages();

    // Subscribe to new messages
    const unsubscribe = chatService.subscribeToLoadChat(loadId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [loadId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await chatService.sendMessage({
        load_id: loadId,
        sender_id: user.id,
        sender_type: user.role || "shipper",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setConnectionStatus("error");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    clearTimeout(typingTimeoutRef.current);
    setIsTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    try {
      const file = e.target.files[0];
      // TODO: Implement file upload
      console.log("File selected:", file.name);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  return (
    <div
      className={`flex flex-col bg-background border rounded-lg overflow-hidden ${isFullScreen ? "h-screen" : "h-[500px]"}`}
    >
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="font-medium">Load #{loadId} Chat</h3>
        <span className="text-xs text-muted-foreground">
          {messages.length} messages
        </span>
      </div>

      {connectionStatus === "error" && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 text-center">
          Connection error. Please check your internet connection.
        </div>
      )}

      <div className="flex-1 flex flex-col" ref={scrollAreaRef}>
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isCurrentUser = msg.sender_id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>
                          {msg.sender_type.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="space-y-1 max-w-[75%]">
                      {!isCurrentUser && (
                        <p className="text-xs text-muted-foreground">
                          {msg.sender_type.charAt(0).toUpperCase() +
                            msg.sender_type.slice(1)}
                        </p>
                      )}

                      <div
                        className={`rounded-lg p-3 ${isCurrentUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}
                      >
                        {msg.attachments && msg.attachments.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm">{msg.message}</p>
                            <a
                              href={msg.attachments[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline flex items-center"
                            >
                              <Paperclip className="h-3 w-3 mr-1" />
                              View attachment
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground text-right">
                        {formatTime(msg.created_at)}
                        {msg.status && isCurrentUser && (
                          <span className="ml-1">
                            {msg.status === "sending" && "•"}
                            {msg.status === "sent" && "✓"}
                            {msg.status === "delivered" && "✓✓"}
                            {msg.status === "read" && "✓✓"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="typing-indicator">•••</div>
                  <span>Someone is typing</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-3 border-t bg-background">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!user || connectionStatus === "error"}
            className="flex-1"
          />

          <label htmlFor="file-upload" className="cursor-pointer">
            <Paperclip className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={!user || connectionStatus === "error"}
            />
          </label>

          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={
              !user || !newMessage.trim() || connectionStatus === "error"
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
