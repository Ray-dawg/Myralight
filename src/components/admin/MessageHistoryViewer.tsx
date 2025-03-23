import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Download,
  Search,
  Filter,
  X,
  FileText,
  MessageSquare,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  message_id: string;
  chat_id: string;
  sender_id: string | null;
  sender_type: string;
  content: string;
  message_type: string;
  related_entity_id?: string;
  related_entity_type?: string;
  metadata: Record<string, any>;
  created_at: string;
  is_archived: boolean;
  current_status?: string;
}

export default function MessageHistoryViewer() {
  const [activeTab, setActiveTab] = useState("search");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatId, setChatId] = useState("");
  const [loadId, setLoadId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [messageTypes, setMessageTypes] = useState<string[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeSystemMessages, setIncludeSystemMessages] = useState(true);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let url = "/api/message-history/search?";
      const params = new URLSearchParams();

      if (searchTerm) params.append("searchTerm", searchTerm);
      if (chatId) params.append("chatIds", chatId);
      if (loadId) params.append("loadIds", loadId);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      if (messageTypes.length > 0)
        params.append("messageTypes", messageTypes.join(","));
      if (includeArchived) params.append("includeArchived", "true");
      if (!includeSystemMessages)
        params.append("includeSystemMessages", "false");

      const response = await fetch(url + params.toString());
      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error searching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      let url = "/api/message-history/export?";
      const params = new URLSearchParams();

      if (chatId) params.append("chatId", chatId);
      if (loadId) params.append("loadId", loadId);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      if (!includeSystemMessages)
        params.append("includeSystemMessages", "false");
      params.append("format", exportFormat);

      // Trigger file download
      window.location.href = url + params.toString();
    } catch (error) {
      console.error("Error exporting messages:", error);
    }
  };

  const handleViewMessageDetails = async (message: Message) => {
    setSelectedMessage(message);
    try {
      // Fetch status history
      const statusResponse = await fetch(
        `/api/message-history/message/${message.message_id}/status`,
      );
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatusHistory(statusData);
      }

      // Fetch attachments
      const attachmentsResponse = await fetch(
        `/api/message-history/message/${message.message_id}/attachments`,
      );
      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json();
        setAttachments(attachmentsData);
      }
    } catch (error) {
      console.error("Error fetching message details:", error);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setChatId("");
    setLoadId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setMessageTypes([]);
    setIncludeArchived(false);
    setIncludeSystemMessages(true);
  };

  const handleArchiveOldMessages = async () => {
    if (
      !confirm("Are you sure you want to archive messages older than 90 days?")
    )
      return;

    setLoading(true);
    try {
      const response = await fetch("/api/message-history/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThanDays: 90 }),
      });

      if (!response.ok) throw new Error("Failed to archive messages");

      const data = await response.json();
      alert(`Successfully archived ${data.archivedCount} messages`);
    } catch (error) {
      console.error("Error archiving messages:", error);
      alert("Failed to archive messages");
    } finally {
      setLoading(false);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "user_message":
        return "bg-blue-100 text-blue-800";
      case "system_message":
        return "bg-gray-100 text-gray-800";
      case "automated_message":
        return "bg-green-100 text-green-800";
      case "notification":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "read":
        return "bg-purple-100 text-purple-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Message History & Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">Search Messages</TabsTrigger>
              <TabsTrigger value="export">Export History</TabsTrigger>
              <TabsTrigger value="archive">Archive Management</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="searchTerm">Search Term</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="searchTerm"
                        placeholder="Search message content..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="chatId">Chat ID</Label>
                    <Input
                      id="chatId"
                      placeholder="Enter chat ID..."
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="loadId">Load ID</Label>
                    <Input
                      id="loadId"
                      placeholder="Enter load ID..."
                      value={loadId}
                      onChange={(e) => setLoadId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="startDate" className="text-xs">
                          Start Date
                        </Label>
                        <DatePicker
                          id="startDate"
                          selected={startDate}
                          onSelect={setStartDate}
                          placeholder="Start date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-xs">
                          End Date
                        </Label>
                        <DatePicker
                          id="endDate"
                          selected={endDate}
                          onSelect={setEndDate}
                          placeholder="End date"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="messageTypes">Message Types</Label>
                    <Select
                      value={messageTypes.join(",")}
                      onValueChange={(value) =>
                        setMessageTypes(value ? value.split(",") : [])
                      }
                    >
                      <SelectTrigger id="messageTypes">
                        <SelectValue placeholder="Select message types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user_message,system_message,automated_message,notification">
                          All Types
                        </SelectItem>
                        <SelectItem value="user_message">
                          User Messages
                        </SelectItem>
                        <SelectItem value="system_message">
                          System Messages
                        </SelectItem>
                        <SelectItem value="automated_message">
                          Automated Messages
                        </SelectItem>
                        <SelectItem value="notification">
                          Notifications
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeArchived"
                        checked={includeArchived}
                        onCheckedChange={(checked) =>
                          setIncludeArchived(!!checked)
                        }
                      />
                      <Label htmlFor="includeArchived">Include Archived</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeSystemMessages"
                        checked={includeSystemMessages}
                        onCheckedChange={(checked) =>
                          setIncludeSystemMessages(!!checked)
                        }
                      />
                      <Label htmlFor="includeSystemMessages">
                        Include System Messages
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSearch}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Search
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      disabled={loading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Search Tips</h3>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Use specific IDs for precise results</li>
                      <li>• Filter by date range to narrow results</li>
                      <li>• Search within message content</li>
                      <li>• Filter by message types for targeted results</li>
                    </ul>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Message Count</h3>
                    <p className="text-2xl font-bold">{messages.length}</p>
                    <p className="text-xs text-muted-foreground">
                      messages found
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="bg-muted p-2 flex justify-between items-center">
                  <h3 className="text-sm font-medium">Search Results</h3>
                  {messages.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Messages Found</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Try adjusting your search filters or search for different
                      content.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className="p-4 hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleViewMessageDetails(message)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={getMessageTypeColor(
                                  message.message_type,
                                )}
                              >
                                {message.message_type}
                              </Badge>
                              {message.current_status && (
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(
                                    message.current_status,
                                  )}
                                >
                                  {message.current_status}
                                </Badge>
                              )}
                              {message.is_archived && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800"
                                >
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(message.created_at),
                                "MMM d, yyyy h:mm a",
                              )}
                            </span>
                          </div>

                          <div className="mb-2">
                            <p className="text-sm font-medium truncate">
                              {message.content}
                            </p>
                          </div>

                          <div className="flex items-center text-xs text-muted-foreground space-x-4">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              <span>
                                {message.sender_id || "System"} (
                                {message.sender_type})
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              <span>Chat: {message.chat_id}</span>
                            </div>
                            {message.related_entity_id && (
                              <div className="flex items-center">
                                <Tag className="h-3 w-3 mr-1" />
                                <span>
                                  {message.related_entity_type}:{" "}
                                  {message.related_entity_id}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {selectedMessage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Message Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Message Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Message ID:</span>{" "}
                            {selectedMessage.message_id}
                          </div>
                          <div>
                            <span className="font-medium">Sender:</span>{" "}
                            {selectedMessage.sender_id || "System"} (
                            {selectedMessage.sender_type})
                          </div>
                          <div>
                            <span className="font-medium">Chat ID:</span>{" "}
                            {selectedMessage.chat_id}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{" "}
                            {format(
                              new Date(selectedMessage.created_at),
                              "PPpp",
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>{" "}
                            {selectedMessage.message_type}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{" "}
                            {selectedMessage.current_status || "Unknown"}
                          </div>
                          {selectedMessage.related_entity_id && (
                            <div>
                              <span className="font-medium">
                                Related Entity:
                              </span>{" "}
                              {selectedMessage.related_entity_type}:{" "}
                              {selectedMessage.related_entity_id}
                            </div>
                          )}
                        </div>

                        <h3 className="text-sm font-medium mt-4 mb-2">
                          Content
                        </h3>
                        <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                          {selectedMessage.content}
                        </div>

                        {Object.keys(selectedMessage.metadata).length > 0 && (
                          <>
                            <h3 className="text-sm font-medium mt-4 mb-2">
                              Metadata
                            </h3>
                            <div className="p-3 bg-muted rounded-md">
                              <pre className="text-xs overflow-auto">
                                {JSON.stringify(
                                  selectedMessage.metadata,
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Status History
                        </h3>
                        {statusHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No status history available
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {statusHistory.map((status) => (
                              <div
                                key={status.id}
                                className="p-2 border rounded-md"
                              >
                                <div className="flex justify-between">
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(status.status)}
                                  >
                                    {status.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(
                                      new Date(status.created_at),
                                      "MMM d, yyyy h:mm a",
                                    )}
                                  </span>
                                </div>
                                {status.actor_id && (
                                  <div className="text-xs mt-1">
                                    <span className="font-medium">By:</span>{" "}
                                    {status.actor_id}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <h3 className="text-sm font-medium mt-4 mb-2">
                          Attachments
                        </h3>
                        {attachments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No attachments
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="p-2 border rounded-md flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {attachment.file_name || "Attachment"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {attachment.attachment_type ||
                                      "Unknown type"}
                                    {attachment.file_size &&
                                      ` • ${Math.round(attachment.file_size / 1024)} KB`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      attachment.attachment_url,
                                      "_blank",
                                    )
                                  }
                                >
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4 pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Export Message History
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Export message history for compliance, record-keeping,
                        or analysis. Choose filters to narrow down the data.
                      </p>

                      <div>
                        <Label htmlFor="exportChatId">Chat ID (Optional)</Label>
                        <Input
                          id="exportChatId"
                          placeholder="Enter chat ID..."
                          value={chatId}
                          onChange={(e) => setChatId(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="exportLoadId">Load ID (Optional)</Label>
                        <Input
                          id="exportLoadId"
                          placeholder="Enter load ID..."
                          value={loadId}
                          onChange={(e) => setLoadId(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="exportStartDate">Start Date</Label>
                          <DatePicker
                            id="exportStartDate"
                            selected={startDate}
                            onSelect={setStartDate}
                            placeholder="Start date"
                          />
                        </div>
                        <div>
                          <Label htmlFor="exportEndDate">End Date</Label>
                          <DatePicker
                            id="exportEndDate"
                            selected={endDate}
                            onSelect={setEndDate}
                            placeholder="End date"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="exportIncludeSystemMessages"
                          checked={includeSystemMessages}
                          onCheckedChange={(checked) =>
                            setIncludeSystemMessages(!!checked)
                          }
                        />
                        <Label htmlFor="exportIncludeSystemMessages">
                          Include System Messages
                        </Label>
                      </div>

                      <div>
                        <Label htmlFor="exportFormat">Export Format</Label>
                        <Select
                          value={exportFormat}
                          onValueChange={(value) =>
                            setExportFormat(value as "csv" | "json")
                          }
                        >
                          <SelectTrigger id="exportFormat">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleExport} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Export Guidelines</h3>

                      <div className="bg-muted p-4 rounded-md space-y-4">
                        <div>
                          <h4 className="text-sm font-medium">
                            DOT Compliance
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            The Department of Transportation requires retention
                            of all communication records related to shipments
                            for at least 3 years.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium">
                            Data Retention
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            All messages are stored indefinitely but may be
                            archived after 90 days for performance reasons.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium">
                            Export Formats
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>
                              CSV: Best for spreadsheet analysis and
                              record-keeping
                            </li>
                            <li>
                              JSON: Preferred for data processing and system
                              integration
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium">
                            Best Practices
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>
                              Export by load ID for complete shipment records
                            </li>
                            <li>Use date ranges to limit export size</li>
                            <li>
                              Regular exports are recommended for backup
                              purposes
                            </li>
                            <li>
                              Store exports securely in compliance with data
                              protection regulations
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="archive" className="space-y-4 pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Archive Management
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Archive older messages to optimize system performance
                        while maintaining compliance with retention
                        requirements.
                      </p>

                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Important Note
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Archiving moves messages to a separate storage area
                          but does not delete them. Archived messages remain
                          searchable when the "Include Archived" option is
                          enabled.
                        </p>
                      </div>

                      <div className="bg-muted p-4 rounded-md">
                        <h4 className="text-sm font-medium">Archive Policy</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc mt-2">
                          <li>
                            Messages older than 90 days are eligible for
                            archiving
                          </li>
                          <li>
                            Archiving is a manual process requiring admin
                            approval
                          </li>
                          <li>
                            Archived messages remain accessible but with
                            slightly slower retrieval times
                          </li>
                          <li>
                            All message metadata and content is preserved in the
                            archive
                          </li>
                        </ul>
                      </div>

                      <Button
                        onClick={handleArchiveOldMessages}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Archive Messages Older Than 90 Days
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Data Lifecycle Management
                      </h3>

                      <div className="bg-muted p-4 rounded-md space-y-4">
                        <div>
                          <h4 className="text-sm font-medium">
                            Active Storage (0-90 days)
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Recent messages are kept in active storage for fast
                            access and frequent querying. These messages are
                            included in all searches by default.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium">
                            Archive Storage (90+ days)
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Older messages are moved to archive storage to
                            optimize system performance. These messages are
                            still accessible but must be explicitly included in
                            searches.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium">
                            Compliance Considerations
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>
                              DOT regulations require 3-year minimum retention
                            </li>
                            <li>
                              All message content and metadata is preserved
                              indefinitely
                            </li>
                            <li>
                              Audit trails are maintained for all system actions
                            </li>
                            <li>
                              Regular backups are performed on both active and
                              archived data
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800">
                          Performance Impact
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Regular archiving helps maintain optimal system
                          performance. Without archiving, search and retrieval
                          operations may become slower as the message database
                          grows.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
