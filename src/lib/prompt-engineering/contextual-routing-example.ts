/**
 * Contextual Routing Advice System
 * Example Implementation
 *
 * This file demonstrates how to use the prompt framework to generate
 * contextual routing advice for commercial drivers.
 */

import {
  PromptType,
  UserRole,
  PromptDataSources,
  buildPrompt,
} from "./eta-prompt-framework";

/**
 * Generate contextual routing advice for a specific delivery location
 */
export function generateContextualRoutingAdvice(
  userRole: UserRole = "driver",
  facilityId: string,
  vehicleType: string,
  driverExperienceLevel: "novice" | "intermediate" | "expert" = "intermediate",
  routeFamiliarity: "none" | "limited" | "familiar" | "expert" = "limited",
  previousVisits: number = 0
): string {
  // Define the prompt type
  const promptType: PromptType = "contextual_routing_advice";

  // In a real implementation, this data would come from a database
  // based on the facilityId and other parameters
  const sampleData: PromptDataSources = {
    facilityInformation: {
      approachDirections: "Approach from the north side of Industrial Parkway. The south entrance has a low clearance bridge (12'6\") that's unsuitable for most commercial vehicles.",
      parkingInstructions: "Truck parking is available in Lot C, immediately to the right after entering Gate B. Pull forward to the check-in kiosk first, then proceed to one of the numbered loading bays (1-12).",
      checkInProcedures: "Stop at security gate and present your driver ID and load number. Proceed to check-in kiosk in front of the warehouse. Use the touchscreen to enter your load number and phone number.",
      loadingDockDetails: "Back in at a 45-degree angle as the docks are angled. There's a truck staging area if all docks are full.",
      operatingHours: "Monday-Friday: 6:00 AM - 8:00 PM, Saturday: 7:00 AM - 3:00 PM, Sunday: Closed",
      contactInformation: "Facility Manager: John Smith (555-123-4567), Security Office: 555-123-8910 (staffed 24/7)",
      knownIssues: [
        "Gate B keypad sometimes malfunctions in heavy rain - use call box if unresponsive",
        "Cell reception is poor inside the warehouse - complete any necessary calls beforehand",
        "Dock levelers for bays 7-9 are known to be temperamental - request assistance if needed"
      ],
      securityRequirements: "Photo ID required. All drivers must wear high-visibility vests while outside their vehicle.",
      amenities: [
        "Driver lounge with vending machines, microwave, and TV",
        "Clean restrooms with showers ($5 token from security desk)",
        "Free Wi-Fi available in driver lounge (password: guest2023)"
      ],
      recentFeedback: [
        "Check-in process is faster if you have your BOL and load number ready before arriving",
        "First-time check-in typically takes 15-20 minutes vs. 5-10 for regular drivers",
        "Facility is known for efficient loading/unloading (avg. 45 minutes) if paperwork is in order"
      ]
    },
    localKnowledge: {
      trafficPatterns: [
        "This industrial park experiences heavy congestion between 7-9 AM and 4-6 PM",
        "The left turn from Highway 40 onto Industrial Parkway lacks a dedicated turn lane and can back up during peak hours"
      ],
      constructionZones: [
        "Ongoing construction on Highway 40 between exits 15-17 until October 2023",
        "Lane closures on Industrial Parkway near the main entrance on Tuesdays and Thursdays"
      ],
      problematicIntersections: [
        "The intersection of Industrial Parkway and Commerce Drive has a tight turning radius for large trucks",
        "The traffic light at Highway 40 and Industrial Parkway has a short green cycle during peak hours"
      ],
      lowClearances: [
        "12'6\" bridge on the south entrance to Industrial Parkway",
        "13'0\" underpass on alternate route via Commerce Drive"
      ],
      weightRestrictions: [
        "Weight restriction of 30 tons on Industrial Parkway bridge",
        "15-ton limit on Commerce Drive"
      ],
      noTruckZones: [
        "No commercial vehicles on Residential Avenue between 10 PM and 6 AM",
        "No trucks over 5 tons on Park Street at any time"
      ],
      preferredTruckRoutes: [
        "Highway 40 to Industrial Parkway is the designated truck route",
        "Local drivers often use the Elm Street route to avoid Highway 40 congestion"
      ],
      restAreas: [
        "Truck stop with overnight parking 5 miles west on Highway 40",
        "Rest area with 3-hour limit 2 miles east on Highway 40"
      ],
      fuelStops: [
        "Diesel available at Flying J, 3 miles west on Highway 40",
        "CNG station at Industrial Park entrance"
      ],
      localRegulations: [
        "This facility is within a city noise ordinance zone - no idling for more than 10 minutes",
        "No overnight parking allowed in the facility lot or on surrounding streets"
      ]
    },
    driverExperience: {
      level: driverExperienceLevel,
      routeFamiliarity: routeFamiliarity,
      previousVisits: previousVisits,
      preferredApproaches: previousVisits > 0 ? ["Prefers entering from Highway 40 rather than the back roads"] : [],
      previousFeedback: previousVisits > 0 ? ["Reported difficulty finding the correct entrance on first visit"] : [],
      certifications: ["CDL Class A", "Hazmat Endorsed"]
    },
    vehicleData: {
      type: vehicleType,
      avgSpeed: 55,
      status: "active",
      equipmentDetails: vehicleType === "semi-truck" ? "53' trailer, air ride suspension" : "26' box truck",
      height: vehicleType === "semi-truck" ? "13'6\"" : "12'6\"",
      weight: vehicleType === "semi-truck" ? "80,000 lbs fully loaded" : "26,000 lbs fully loaded"
    },
    loadData: {
      id: "LOAD-12345",
      origin: "Distribution Center, Chicago, IL",
      destination: "Midwest Distribution Center, 123 Industrial Parkway",
      scheduledDelivery: Date.now() + 1000 * 60 * 60 * 2, // 2 hours from now
      status: "in_transit",
      specialInstructions: "Requires liftgate for unloading"
    }
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return prompt;
}

/**
 * Example of how to use the contextual routing advice generator
 */
export function contextualRoutingAdviceExample() {
  // Generate advice for a novice driver
  const noviceDriverPrompt = generateContextualRoutingAdvice(
    "driver",
    "facility-123",
    "semi-truck",
    "novice",
    "none",
    0
  );

  // Generate advice for an experienced driver
  const experiencedDriverPrompt = generateContextualRoutingAdvice(
    "driver",
    "facility-123",
    "semi-truck",
    "expert",
    "familiar",
    5
  );

  // Generate advice for a carrier dispatcher
  const carrierPrompt = generateContextualRoutingAdvice(
    "carrier",
    "facility-123",
    "semi-truck",
    "intermediate",
    "limited",
    2
  );

  return {
    noviceDriverPrompt,
    experiencedDriverPrompt,
    carrierPrompt
  };
}

/**
 * Data structure for storing facility information
 */
export interface FacilityInformation {
  facilityId: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  approachDirections: string;
  parkingInstructions: string;
  checkInProcedures: string;
  loadingDockDetails: string;
  operatingHours: string;
  contactInformation: string;
  knownIssues: string[];
  securityRequirements: string;
  amenities: string[];
  recentFeedback: string[];
  lastUpdated: Date;
  updatedBy: string;
  verificationStatus: "verified" | "unverified" | "needs_review";
}

/**
 * Data structure for storing local knowledge
 */
export interface LocalKnowledge {
  locationId: string;
  trafficPatterns: string[];
  constructionZones: string[];
  problematicIntersections: string[];
  lowClearances: string[];
  weightRestrictions: string[];
  noTruckZones: string[];
  preferredTruckRoutes: string[];
  restAreas: string[];
  fuelStops: string[];
  localRegulations: string[];
  lastUpdated: Date;
  updatedBy: string;
  verificationStatus: "verified" | "unverified" | "needs_review";
}

/**
 * Data structure for driver feedback on routing advice
 */
export interface RoutingAdviceFeedback {
  feedbackId: string;
  driverId: string;
  facilityId: string;
  routeId: string;
  adviceQuality: "very_helpful" | "helpful" | "neutral" | "unhelpful" | "incorrect";
  feedbackText: string;
  suggestedImprovements: string;
  timestamp: Date;
  wasImplemented: boolean;
  implementationNotes?: string;
}

/**
 * Example implementation of a feedback collection system
 */
export function collectRoutingAdviceFeedback(
  driverId: string,
  facilityId: string,
  routeId: string,
  adviceQuality: "very_helpful" | "helpful" | "neutral" | "unhelpful" | "incorrect",
  feedbackText: string,
  suggestedImprovements: string
): RoutingAdviceFeedback {
  // In a real implementation, this would save to a database
  const feedback: RoutingAdviceFeedback = {
    feedbackId: `feedback-${Date.now()}`,
    driverId,
    facilityId,
    routeId,
    adviceQuality,
    feedbackText,
    suggestedImprovements,
    timestamp: new Date(),
    wasImplemented: false
  };

  console.log("Collected feedback:", feedback);
  return feedback