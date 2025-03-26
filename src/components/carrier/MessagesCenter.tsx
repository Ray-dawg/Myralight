import React, { useState } from "react";
import { ChatList } from "../shared/ChatList";
import { MessageCenter } from "../shared/MessageCenter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, Users, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import CarrierDashboardLayout from "../layout/CarrierDashboardLayout";

function MessagesCenterContent() {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>("1");
  const [searchQuery, setSearchQuery] = useState("");

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
        <h1 className="text-xl font-bold">Fleet Communications</h1>
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
            <Tabs defaultValue="loads" className="mb-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="loads">By Load</TabsTrigger>
                <TabsTrigger value="drivers">By Driver</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative mb-4">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search loads or drivers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                    <div>
                      <h2 className="text-lg font-medium">
                        Load #{selectedLoadId}
                      </h2>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>John Doe (Driver), ABC Shipping</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Assign Driver
                      </Button>
                      <Button variant="outline" size="sm">
                        Load Details
                      </Button>
                    </div>
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
                  from your drivers and shippers.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CarrierMessagesCenter() {
  return (
    <CarrierDashboardLayout>
      <MessagesCenterContent />
    </CarrierDashboardLayout>
  );
}
