import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { automatedMessageService } from "@/services/automated-message.service";
import { emitEvent, EventTypes } from "@/lib/events";

interface SystemMessageExampleProps {
  loadId: string;
}

export default function SystemMessageExample({
  loadId,
}: SystemMessageExampleProps) {
  const [messageType, setMessageType] = useState<string>("load_assigned");
  const [eventType, setEventType] = useState<EventTypes>(
    EventTypes.LOAD_ASSIGNED,
  );
  const [previewMessage, setPreviewMessage] = useState<string>("");

  // Sample data for different event types
  const sampleData = {
    [EventTypes.LOAD_ASSIGNED]: {
      load_id: loadId,
      driver_id: "driver-123",
      carrier_id: "carrier-456",
      load_details: {
        reference_number: "LD-12345",
        pickup_location: "Chicago, IL",
        pickup_date: "2023-06-15T08:00:00Z",
        delivery_location: "Detroit, MI",
        delivery_date: "2023-06-16T14:00:00Z",
        cargo_description: "Electronics - 10 pallets",
      },
    },
    [EventTypes.DOCUMENT_UPLOADED]: {
      document_id: "doc-789",
      document_type: "BOL",
      uploader_id: "driver-123",
      load_id: loadId,
      document_name: "Bill of Lading - LD-12345.pdf",
    },
    [EventTypes.SHIPMENT_STATUS_CHANGE]: {
      load_id: loadId,
      new_status: "IN_TRANSIT",
      previous_status: "PICKED_UP",
      updated_by_id: "driver-123",
      location: "Gary, IN",
      timestamp: new Date().toISOString(),
    },
    [EventTypes.PAYMENT_ISSUED]: {
      payment_id: "pmt-101112",
      amount: 1250.75,
      load_id: loadId,
      payee_id: "driver-123",
      payment_method: "Direct Deposit",
      invoice_number: "INV-5678",
    },
  };

  // Message type options based on event type
  const messageTypeOptions = {
    [EventTypes.LOAD_ASSIGNED]: [
      { value: "load_assigned", label: "Load Assigned (to Driver)" },
      {
        value: "load_assigned_to_driver",
        label: "Load Assigned (to Dispatcher)",
      },
    ],
    [EventTypes.DOCUMENT_UPLOADED]: [
      { value: "document_uploaded", label: "Document Uploaded" },
    ],
    [EventTypes.SHIPMENT_STATUS_CHANGE]: [
      { value: "shipment_status_picked_up", label: "Status: Picked Up" },
      { value: "shipment_status_in_transit", label: "Status: In Transit" },
      { value: "shipment_status_delivered", label: "Status: Delivered" },
      { value: "shipment_status_delayed", label: "Status: Delayed" },
    ],
    [EventTypes.PAYMENT_ISSUED]: [
      { value: "payment_issued", label: "Payment Issued (to Payee)" },
      {
        value: "payment_issued_to_driver",
        label: "Payment Issued (to Carrier Admin)",
      },
    ],
  };

  // Update message type when event type changes
  const handleEventTypeChange = (value: string) => {
    const newEventType = value as EventTypes;
    setEventType(newEventType);

    // Set first message type for this event
    const firstMessageType = messageTypeOptions[newEventType][0].value;
    setMessageType(firstMessageType);

    // Update preview
    updatePreview(firstMessageType, newEventType);
  };

  // Update preview when message type changes
  const handleMessageTypeChange = (value: string) => {
    setMessageType(value);
    updatePreview(value, eventType);
  };

  // Generate preview message
  const updatePreview = (msgType: string, evtType: EventTypes) => {
    const template = automatedMessageService.getMessageTemplate(msgType);
    const data = sampleData[evtType];

    // For specific message types, we need to prepare the template data
    let templateData: Record<string, any> = {};

    switch (msgType) {
      case "load_assigned":
        templateData = {
          load_number: data.load_details.reference_number,
          pickup_location: data.load_details.pickup_location,
          pickup_date: data.load_details.pickup_date,
          delivery_location: data.load_details.delivery_location,
          delivery_date: data.load_details.delivery_date,
          cargo_details: data.load_details.cargo_description,
        };
        break;

      case "load_assigned_to_driver":
        templateData = {
          driver_name: "John Doe",
          load_number: data.load_details.reference_number,
          pickup_date: data.load_details.pickup_date,
        };
        break;

      case "document_uploaded":
        templateData = {
          document_type: data.document_type,
          document_name: data.document_name,
          load_number: "LD-12345",
          uploader_name: "John Doe",
          requires_action: true,
        };
        break;

      case "shipment_status_picked_up":
      case "shipment_status_in_transit":
      case "shipment_status_delivered":
      case "shipment_status_delayed":
        templateData = {
          load_number: "LD-12345",
          status: automatedMessageService.formatStatus(data.new_status),
          location: data.location,
          timestamp: automatedMessageService.formatTimestamp(data.timestamp),
          updated_by: "John Doe",
        };
        break;

      case "payment_issued":
        templateData = {
          amount: automatedMessageService.formatCurrency(data.amount),
          load_number: "LD-12345",
          payment_method: data.payment_method,
          invoice_number: data.invoice_number,
          payment_date: new Date().toISOString(),
        };
        break;

      case "payment_issued_to_driver":
        templateData = {
          driver_name: "John Doe",
          amount: automatedMessageService.formatCurrency(data.amount),
          load_number: "LD-12345",
          invoice_number: data.invoice_number,
        };
        break;
    }

    const message = automatedMessageService.applyTemplate(
      template,
      templateData,
    );
    setPreviewMessage(message);
  };

  // Trigger the event
  const triggerEvent = () => {
    emitEvent(eventType, sampleData[eventType]);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>System Message Generator</CardTitle>
        <CardDescription>
          Preview and trigger automated system messages for testing
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Message Preview</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/20">
              <h3 className="font-medium mb-2">Message Preview:</h3>
              <div className="p-3 bg-background rounded border">
                {previewMessage ||
                  "Select an event type and message type to preview"}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Select value={eventType} onValueChange={handleEventTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EventTypes.LOAD_ASSIGNED}>
                      Load Assigned
                    </SelectItem>
                    <SelectItem value={EventTypes.DOCUMENT_UPLOADED}>
                      Document Uploaded
                    </SelectItem>
                    <SelectItem value={EventTypes.SHIPMENT_STATUS_CHANGE}>
                      Shipment Status Change
                    </SelectItem>
                    <SelectItem value={EventTypes.PAYMENT_ISSUED}>
                      Payment Issued
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Type</label>
                <Select
                  value={messageType}
                  onValueChange={handleMessageTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTypeOptions[eventType]?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => updatePreview(messageType, eventType)}
        >
          Refresh Preview
        </Button>
        <Button onClick={triggerEvent}>Trigger Event</Button>
      </CardFooter>
    </Card>
  );
}
