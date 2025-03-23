import React, { useState, useEffect } from 'react';
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Truck, MapPin, Clock, AlertTriangle, Info, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

interface ContextualRoutingAdviceProps {
  facilityId: string;
  loadId: string;
  vehicleType: string;
  driverExperience?: "novice" | "intermediate" | "expert";
  onFeedbackSubmit?: (feedback: {
    quality: string;
    comments: string;
    suggestions: string;
  }) => void;
}

const ContextualRoutingAdvice: React.FC<ContextualRoutingAdviceProps> = ({
  facilityId,
  loadId,
  vehicleType,
  driverExperience = "intermediate",
  onFeedbackSubmit
}) => {
  const [activeTab, setActiveTab] = useState("advice");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackQuality, setFeedbackQuality] = useState("");
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackSuggestions, setFeedbackSuggestions] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Mock data - in a real implementation, this would come from an API call
  const adviceData = {
    facilityApproach: "Approach from the north side of Industrial Parkway. The south entrance has a low clearance bridge (12'6\") that's unsuitable for most commercial vehicles. Use the dedicated truck entrance at Gate B, which is 0.3 miles past the main entrance. Look for the blue and white 'Truck Entrance' sign.",
    parkingAndLoading: "Truck parking is available in Lot C, immediately to the right after entering Gate B. Pull forward to the check-in kiosk first, then proceed to one of the numbered loading bays (1-12). Back in at a 45-degree angle as the docks are angled. There's a truck staging area if all docks are full.",
    checkInProcedures: "1. Stop at security gate and present your driver ID and load number\n2. Proceed to check-in kiosk in front of the warehouse\n3. Use the touchscreen to enter your load number and phone number\n4. Wait for text message with dock assignment (typically 5-10 minutes)\n5. Proceed to assigned dock and check in with dock supervisor",
    localKnowledge: "- This industrial park experiences heavy congestion between 7-9 AM and 4-6 PM\n- The left turn from Highway 40 onto Industrial Parkway lacks a dedicated turn lane and can back up during peak hours\n- Local drivers often use the Elm Street route to avoid the Highway 40 congestion\n- The facility is in a high-theft area - secure your vehicle if leaving it unattended",
    regulatoryNotes: "- This facility is within a city noise ordinance zone - no idling for more than 10 minutes\n- Weight restriction of 30 tons on Industrial Parkway bridge\n- No overnight parking allowed in the facility lot or on surrounding streets\n- Hazmat loads require additional paperwork available at the security office",
    driverTips: "- Restrooms are available inside the main building, first door on right after entering\n- Check-in process is faster if you have your BOL and load number ready before arriving\n- If assigned docks 10-12, be aware of tight turning radius - approach from the far lane\n- Facility is known for efficient loading/unloading (avg. 45 minutes) if paperwork is in order",
    potentialChallenges: "- Gate B keypad sometimes malfunctions in heavy rain - use call box if unresponsive\n- Cell reception is poor inside the warehouse - complete any necessary calls beforehand\n- First-time check-in typically takes 15-20 minutes vs. 5-10 for regular drivers\n- Dock levelers for bays 7-9 are known to be temperamental - request assistance if needed",
    amenities: "- Driver lounge with vending machines, microwave, and TV\n- Clean restrooms with showers ($5 token from security desk)\n- Food options: vending machines on-site, diner 0.5 miles east on Industrial Parkway\n- Free Wi-Fi available in driver lounge (password: guest2023)",
    emergencyContacts: "- Facility Manager: John Smith (555-123-4567)\n- Security Office: 555-123-8910 (staffed 24/7)\n- Dock Supervisor: 555-123-5678 (6 AM - 10 PM)\n- Local Non-Emergency Police: 555-123-9876",
    visualLandmarks: "- Large blue water tower visible from Highway 40\n- Red 'Midwest Distribution Center' sign at the main entrance\n- Gate B has yellow and black striped guardrails\n- Loading area has distinctive green metal roof visible from access road"
  };

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleFeedbackSubmit = () => {
    if (onFeedbackSubmit) {
      onFeedbackSubmit({
        quality: feedbackQuality,
        comments: feedbackComments,
        suggestions: feedbackSuggestions
      });
    }
    
    // Reset form and hide feedback panel
    setFeedbackQuality("");
    setFeedbackComments("");
    setFeedbackSuggestions("");
    setShowFeedback(false);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            <span>Loading Routing Advice...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            <span>Facility Routing Advice</span>
          </CardTitle>
          <Badge variant={driverExperience === "novice" ? "destructive" : driverExperience === "expert" ? "success" : "secondary"}>
            {driverExperience.charAt(0).toUpperCase() + driverExperience.slice(1)} Driver
          </Badge>
        </div>
        <CardDescription>
          <div className="flex items-center mt-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Midwest Distribution Center (Facility ID: {facilityId})</span>
          </div>
          <div className="flex items-center mt-1">
            <Clock className="h-4 w-4 mr-1" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mx-4">
          <TabsTrigger value="advice">Routing Advice</TabsTrigger>
          <TabsTrigger value="details">Facility Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="advice" className="p-4">
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Critical Information</h4>
                  <p className="text-sm text-amber-700">Approach from the north side only. South entrance has a 12'6" clearance unsuitable for most commercial vehicles.</p>
                </div>
              </div>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="approach">
                <AccordionTrigger className="font-medium">Facility Approach</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">{adviceData.facilityApproach}</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="parking">
                <AccordionTrigger className="font-medium">Parking & Loading</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">{adviceData.parkingAndLoading}</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="checkin">
                <AccordionTrigger className="font-medium">Check-In Procedures</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.checkInProcedures}</div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="local">
                <AccordionTrigger className="font-medium">Local Knowledge</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.localKnowledge}</div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="regulatory">
                <AccordionTrigger className="font-medium">Regulatory Notes</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.regulatoryNotes}</div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="tips">
                <AccordionTrigger className="font-medium">Driver Tips</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.driverTips}</div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="challenges">
                <AccordionTrigger className="font-medium">Potential Challenges</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.potentialChallenges}</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="p-4">
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="amenities">
                <AccordionTrigger className="font-medium">Amenities</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.amenities}</div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="emergency">
                <AccordionTrigger className="font-medium">Emergency Contacts</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.emergencyContacts}</div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="landmarks">
                <AccordionTrigger className="font-medium">Visual Landmarks</AccordionTrigger>
                <AccordionContent>
                  <div className="text-gray-700 whitespace-pre-line">{adviceData.visualLandmarks}</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <CardFooter className="flex flex-col space-y-4 p-4">
        {!showFeedback ? (
          <div className="flex justify-between w-full">
            <div className="flex items-center text-sm text-gray-500">
              <Info className="h-4 w-4 mr-1" /