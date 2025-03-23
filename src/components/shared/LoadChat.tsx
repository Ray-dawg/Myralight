import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatService, ChatMessage } from "@/lib/chat";
import { supabase } from "@/lib/supabase";

interface LoadChatProps {
  loadId: string;
  userType: "shipper" | "carrier" | "driver";
}

export default function LoadChat({ loadId, userType }: LoadChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const subscription = chatService.subscribeToLoadChat(loadId, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    await chatService.sendMessage({
      load_id: loadId,
      sender_id: user.id,
      sender_type: userType,
      message: newMessage.trim(),
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[400px] bg-background border rounded-lg p-4">
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender_id === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <span className="text-xs opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
