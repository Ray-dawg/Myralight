import React, { useState } from "react";
import { ChatList } from "./ChatList";
import { MessageCenter } from "./MessageCenter";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>("1");

  const handleSelectChat = (loadId: string) => {
    setSelectedLoadId(loadId);
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="p-4">
            <ChatList onSelectChat={handleSelectChat} />
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-[600px] flex flex-col">
            {selectedLoadId ? (
              <>
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium">
                    Load #{selectedLoadId}
                  </h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MessageCenter loadId={selectedLoadId} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">
                  Select a conversation
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a conversation from the list to view messages related
                  to that load.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
