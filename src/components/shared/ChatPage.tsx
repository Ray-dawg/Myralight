import React from "react";
import { ChatContainer } from "./ChatContainer";

interface ChatPageProps {
  loadId: string;
}

export function ChatPage({ loadId }: ChatPageProps) {
  return (
    <div className="container mx-auto py-6">
      <ChatContainer loadId={loadId} isFullScreen />
    </div>
  );
}
