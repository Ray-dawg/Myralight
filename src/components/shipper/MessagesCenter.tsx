import React, { useState } from "react";
import { ChatList } from "../shared/ChatList";
import { MessageCenter } from "../shared/MessageCenter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ShipperMessagesCenter() {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>("1");
  const [activeTab, setActiveTab] = useState("all");

  const handleSelectChat = (loadId: string) => {
    setSelectedLoadId(loadId);
  };

  const handleBack = () => {
    setSelectedLoadId(null);
  };

  // Mobile view handling
  const isMobileView = window.innerWidth < 768;

  return (
    <div className="container mx-auto py-4 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Messages</h1>
        {selectedLoadId && isMobileView && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chat list - hidden on mobile when a chat is selected */}
        <div
          className={`md:col-span-1 ${selectedLoadId && isMobileView ? "hidden" : "block"}`}
        >
          <Card className="p-4">
            <Tabs
              defaultValue="all"
              className="mb-4"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium">
                {activeTab === "all"
                  ? "All Conversations"
                  : activeTab === "active"
                    ? "Active Loads"
                    : "Archived Loads"}
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>

            <ChatList onSelectChat={handleSelectChat} />
          </Card>
        </div>

        {/* Message center - shown on mobile only when a chat is selected */}
        <div
          className={`md:col-span-2 ${!selectedLoadId && isMobileView ? "hidden" : "block"}`}
        >
          <Card className="h-[600px] flex flex-col">
            {selectedLoadId ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium">
                      Load #{selectedLoadId}
                    </h2>
                    <Button variant="outline" size="sm">
                      View Load Details
                    </Button>
                  </div>
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
                  Choose a load from the list to view and respond to messages
                  from drivers and carriers.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
