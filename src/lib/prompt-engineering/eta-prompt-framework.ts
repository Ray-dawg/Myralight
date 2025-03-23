/**
 * ETA & Delivery Time Prediction System
 * Prompt Engineering Framework
 *
 * This framework standardizes prompt construction for different system functions,
 * ensuring consistency, effectiveness, and maintainability across the application.
 */

import { User } from "../../types/supabase";

// Define user roles for role-specific prompting
export type UserRole = "shipper" | "carrier" | "driver" | "admin";

// Define prompt types for different system functions
export type PromptType =
  | "eta_prediction"
  | "traffic_interpretation"
  | "notification_generation"
  | "delay_analysis"
  | "route_optimization"
  | "intelligent_route_optimization"
  | "weather_impact"
  | "pattern_recognition"
  | "contextual_information"
  | "delay_pattern_analysis"
  | "driver_preference_analysis"
  | "facility_constraint_analysis"
  | "contextual_routing_advice";

// Define urgency levels for notifications
export type UrgencyLevel = "low" | "medium" | "high" | "critical";

// Define data sources that can be incorporated into prompts
export interface PromptDataSources {
  trafficData?: any;
  weatherData?: any;
  locationData?: any;
  historicalData?: any;
  vehicleData?: any;
  loadData?: any;
  userPreferences?: any;
  routeData?: any;
  etaData?: any;
  driverPreferences?: any;
  facilityConstraints?: any;
  timeOfDayPatterns?: any;
  previousDeliveryData?: any;
  alternativeRoutes?: any;
  facilityInformation?: {
    approachDirections?: string;
    parkingInstructions?: string;
    checkInProcedures?: string;
    loadingDockDetails?: string;
    operatingHours?: string;
    contactInformation?: string;
    knownIssues?: string[];
    securityRequirements?: string;
    amenities?: string[];
    recentFeedback?: string[];
  };
  localKnowledge?: {
    trafficPatterns?: string[];
    constructionZones?: string[];
    problematicIntersections?: string[];
    lowClearances?: string[];
    weightRestrictions?: string[];
    noTruckZones?: string[];
    preferredTruckRoutes?: string[];
    restAreas?: string[];
    fuelStops?: string[];
    localRegulations?: string[];
  };
  driverExperience?: {
    level?: "novice" | "intermediate" | "expert";
    routeFamiliarity?: "none" | "limited" | "familiar" | "expert";
    previousVisits?: number;
    preferredApproaches?: string[];
    previousFeedback?: string[];
    certifications?: string[];
  };
}

// Define the standardized prompt template structure
export interface PromptTemplate {
  version: string;
  type: PromptType;
  systemRole: string;
  contextPreamble: string;
  dataIntegration: string;
  userQuery: string;
  outputFormat: string;
  examples?: string;
  constraints?: string;
}

// Define metrics for evaluating prompt effectiveness
export interface PromptMetrics {
  responseTime: number;
  userSatisfactionRating?: number;
  accuracyScore?: number;
  clarityRating?: number;
  actionabilityScore?: number;
  tokenUsage: number;
}

/**
 * Generate a system role definition based on prompt type and user role
 */
export function generateSystemRole(
  type: PromptType,
  userRole?: UserRole,
): string {
  const baseRoles = {
    eta_prediction:
      "You are an expert logistics analyst specializing in ETA predictions. You combine real-time traffic data, historical patterns, and contextual factors to provide accurate delivery time estimates.",
    traffic_interpretation:
      "You are a traffic analysis specialist with deep expertise in interpreting traffic patterns, congestion data, and their impact on transportation logistics.",
    notification_generation:
      "You are a communication specialist who crafts clear, concise, and actionable notifications about shipment status, delays, and ETAs.",
    delay_analysis:
      "You are a delay analysis expert who identifies root causes of transportation delays and provides actionable insights to mitigate them.",
    route_optimization:
      "You are a route optimization specialist who analyzes current conditions to suggest more efficient routes, considering time, fuel, and other constraints.",
    intelligent_route_optimization:
      "You are a transportation optimization expert specializing in route planning and logistics efficiency. You combine algorithmic approaches with contextual understanding to create optimal routes that account for real-world variables beyond traditional mapping algorithms. You excel at identifying opportunities for route improvements based on historical patterns, driver preferences, facility constraints, and current conditions.",
    weather_impact:
      "You are a weather impact analyst who specializes in interpreting how current and forecasted weather conditions affect transportation and delivery times.",
    pattern_recognition:
      "You are a pattern recognition expert who identifies trends in historical delivery data to improve future predictions and operations.",
    contextual_information:
      "You are a logistics information specialist who provides relevant contextual information to help users understand the current status of their shipments.",
    delay_pattern_analysis:
      "You are a logistics pattern analyst with expertise in transportation optimization and delay prediction. You excel at identifying patterns in delivery data, understanding root causes of delays, and creating systems that can learn from historical performance. Your insights combine statistical analysis with domain knowledge of logistics operations.",
    driver_preference_analysis:
      "You are a driver behavior analyst who specializes in understanding driver preferences, habits, and knowledge to optimize routes based on their expertise and comfort levels. You translate driver feedback and historical behavior into actionable route recommendations.",
    facility_constraint_analysis:
      "You are a facility operations specialist who analyzes constraints such as loading dock availability, operating hours, and check-in procedures to optimize arrival times and reduce wait times at pickup and delivery locations.",
    contextual_routing_advice:
      "You are a transportation logistics advisor with deep expertise in practical route planning for commercial drivers. You understand the complexities of commercial deliveries, including vehicle constraints, regulatory requirements, driver needs, and facility operations. You excel at providing actionable, contextual advice that improves delivery efficiency and complements standard navigation instructions.",
  };

  // Add role-specific modifications if a user role is provided
  if (userRole) {
    const roleModifiers = {
      shipper:
        "You prioritize information about delivery timing, delays, and overall shipment status. Your tone is professional and focused on business impact.",
      carrier:
        "You focus on operational efficiency, route planning, and fleet management. Your tone is practical and action-oriented.",
      driver:
        "You emphasize clear, concise driving instructions, safety considerations, and immediate next steps. Your tone is direct and easy to understand while driving.",
      admin:
        "You provide comprehensive system insights, highlighting exceptions and areas requiring attention. Your tone is analytical and detail-oriented.",
    };

    return `${baseRoles[type]} ${roleModifiers[userRole]}`;
  }

  return baseRoles[type];
}

/**
 * Generate context preamble based on prompt type
 */
export function generateContextPreamble(type: PromptType): string {
  const preambles = {
    eta_prediction:
      "You are analyzing real-time and historical data to predict an accurate estimated time of arrival (ETA). Consider traffic conditions, weather, driver patterns, and vehicle type in your analysis.",
    traffic_interpretation:
      "You are interpreting current traffic data to understand its impact on ongoing deliveries. Focus on identifying congestion patterns, incidents, and their potential effects on ETAs.",
    notification_generation:
      "You are crafting a notification about a shipment's status. The notification should be clear, informative, and appropriate to the recipient's role and the situation's urgency.",
    delay_analysis:
      "You are analyzing the causes of a delivery delay. Consider all potential factors including traffic, weather, loading/unloading issues, driver breaks, and mechanical problems.",
    route_optimization:
      "You are suggesting route optimizations based on current conditions. Consider traffic, construction, weather, fuel efficiency, and delivery time windows.",
    intelligent_route_optimization:
      "You are enhancing routes provided by mapping APIs by incorporating historical delivery data, driver preferences, and facility constraints. Your goal is to suggest more efficient routes tailored to specific delivery scenarios that account for real-world variables beyond what traditional mapping algorithms consider. Analyze patterns from past deliveries, driver feedback, time-of-day factors, and facility-specific constraints to recommend optimal routes with clear explanations for why they're better than the standard routes.",
    weather_impact:
      "You are assessing how current and forecasted weather conditions will impact delivery operations. Consider precipitation, temperature, visibility, and road conditions.",
    pattern_recognition:
      "You are analyzing historical delivery data to identify patterns that can improve future operations. Look for trends in timing, routes, delays, and external factors.",
    contextual_information:
      "You are providing relevant context about a shipment to help the user understand its current status. Include only information that is useful for decision-making.",
    delay_pattern_analysis:
      "You are analyzing historical and real-time delivery data to identify recurring delay patterns, predict potential delays before they occur, and suggest mitigation strategies. Your analysis should consider route characteristics, customer locations, driver behaviors, time factors, weather patterns, and facility constraints. Focus on providing actionable insights that can help prevent or minimize future delays.",
    driver_preference_analysis:
      "You are analyzing driver behavior, feedback, and historical route choices to identify preferences and local knowledge that can improve route efficiency. Consider preferred roads, rest stops, fuel stations, and areas drivers tend to avoid based on their experience.",
    facility_constraint_analysis:
      "You are analyzing facility-specific constraints that affect optimal arrival times and loading/unloading efficiency. Consider dock availability patterns, operating hours, check-in procedures, and historical wait times at different times of day.",
    contextual_routing_advice:
      "You are generating contextual routing advice that complements standard navigation instructions. Your goal is to provide facility-specific guidance, local knowledge, regulatory information, and practical tips tailored to the driver's specific delivery situation and vehicle type. Focus on information that isn't captured in standard navigation apps but is crucial for commercial drivers to know. Consider the driver's experience level and familiarity with the route when crafting your advice.",
  };

  return preambles[type];
}

/**
 * Format data for integration into prompts
 */
export function formatDataForPrompt(
  data: PromptDataSources,
  type: PromptType,
): string {
  let formattedData = "Here is the relevant data for your analysis:\n\n";
  
  // Add facility information if available and relevant
  if (
    data.facilityInformation &&
    [
      "contextual_routing_advice",
      "intelligent_route_optimization",
      "facility_constraint_analysis"
    ].includes(type)
  ) {
    formattedData += "FACILITY INFORMATION:\n";
    formattedData += `- Approach directions: ${data.facilityInformation.approachDirections || "Not specified"}\n`;
    formattedData += `- Parking instructions: ${data.facilityInformation.parkingInstructions || "Not specified"}\n`;
    formattedData += `- Check-in procedures: ${data.facilityInformation.checkInProcedures || "Not specified"}\n`;
    formattedData += `- Loading dock details: ${data.facilityInformation.loadingDockDetails || "Not specified"}\n`;
    formattedData += `- Operating hours: ${data.facilityInformation.operatingHours || "Not specified"}\n`;
    formattedData += `- Contact information: ${data.facilityInformation.contactInformation || "Not specified"}\n`;
    
    if (data.facilityInformation.knownIssues && data.facilityInformation.knownIssues.length > 0) {
      formattedData += "- Known issues:\n";
      data.facilityInformation.knownIssues.forEach((issue) => {
        formattedData += `  * ${issue}\n`;
      });
    }
    
    formattedData += `- Security requirements: ${data.facilityInformation.securityRequirements || "None specified"}\n`;
    
    if (data.facilityInformation.amenities && data.facilityInformation.amenities.length > 0) {
      formattedData += "- Amenities:\n";
      data.facilityInformation.amenities.forEach((amenity) => {
        formattedData += `  * ${amenity}\n`;
      });
    }
    
    if (data.facilityInformation.recentFeedback && data.facilityInformation.recentFeedback.length > 0) {
      formattedData += "- Recent driver feedback:\n";
      data.facilityInformation.recentFeedback.forEach((feedback) => {
        formattedData += `  * ${feedback}\n`;
      });
    }
    
    formattedData += "\n";
  }
  
  // Add local knowledge if available and relevant
  if (
    data.localKnowledge &&
    [
      "contextual_routing_advice",
      "intelligent_route_optimization",
      "route_optimization"
    ].includes(type)
  ) {
    formattedData += "LOCAL KNOWLEDGE:\n";
    
    if (data.localKnowledge.trafficPatterns && data.localKnowledge.trafficPatterns.length > 0) {
      formattedData += "- Traffic patterns:\n";
      data.localKnowledge.trafficPatterns.forEach((pattern) => {
        formattedData += `  * ${pattern}\n`;
      });
    }
    
    if (data.localKnowledge.constructionZones && data.localKnowledge.constructionZones.length > 0) {
      formattedData += "- Construction zones:\n";
      data.localKnowledge.constructionZones.forEach((zone) => {
        formattedData += `  * ${zone}\n`;
      });
    }
    
    if (data.localKnowledge.problematicIntersections && data.localKnowledge.problematicIntersections.length > 0) {
      formattedData += "- Problematic intersections:\n";
      data.localKnowledge.problematicIntersections.forEach((intersection) => {
        formattedData += `  * ${intersection}\n`;
      });
    }
    
    if (data.localKnowledge.lowClearances && data.localKnowledge.lowClearances.length > 0) {
      formattedData += "- Low clearances:\n";
      data.localKnowledge.lowClearances.forEach((clearance) => {
        formattedData += `  * ${clearance}\n`;
      });
    }
    
    if (data.localKnowledge.weightRestrictions && data.localKnowledge.weightRestrictions.length > 0) {
      formattedData += "- Weight restrictions:\n";
      data.localKnowledge.weightRestrictions.forEach((restriction) => {
        formattedData += `  * ${restriction}\n`;
      });
    }
    
    if (data.localKnowledge.noTruckZones && data.localKnowledge.noTruckZones.length > 0) {
      formattedData += "- No truck zones:\n";
      data.localKnowledge.noTruckZones.forEach((zone) => {
        formattedData += `  * ${zone}\n`;
      });
    }
    
    if (data.localKnowledge.preferredTruckRoutes && data.localKnowledge.preferredTruckRoutes.length > 0) {
      formattedData += "- Preferred truck routes:\n";
      data.localKnowledge.preferredTruckRoutes.forEach((route) => {
        formattedData += `  * ${route}\n`;
      });
    }
    
    if (data.localKnowledge.restAreas && data.localKnowledge.restAreas.length > 0) {
      formattedData += "- Rest areas:\n";
      data.localKnowledge.restAreas.forEach((area) => {
        formattedData += `  * ${area}\n`;
      });
    }
    
    if (data.localKnowledge.fuelStops && data.localKnowledge.fuelStops.length > 0) {
      formattedData += "- Fuel stops:\n";
      data.localKnowledge.fuelStops.forEach((stop) => {
        formattedData += `  * ${stop}\n`;
      });
    }
    
    if (data.localKnowledge.localRegulations && data.localKnowledge.localRegulations.length > 0) {
      formattedData += "- Local regulations:\n";
      data.localKnowledge.localRegulations.forEach((regulation) => {
        formattedData += `  * ${regulation}\n`;
      });
    }
    
    formattedData += "\n";
  }
  
  // Add driver experience if available and relevant
  if (
    data.driverExperience &&
    [
      "contextual_routing_advice",
      "intelligent_route_optimization",
      "driver_preference_analysis"
    ].includes(type)
  ) {
    formattedData += "DRIVER EXPERIENCE:\n";
    formattedData += `- Experience level: ${data.driverExperience.level || "Not specified"}\n`;
    formattedData += `- Route familiarity: ${data.driverExperience.routeFamiliarity || "Not specified"}\n`;
    formattedData += `- Previous visits to this location: ${data.driverExperience.previousVisits || 0}\n`;
    
    if (data.driverExperience.preferredApproaches && data.driverExperience.preferredApproaches.length > 0) {
      formattedData += "- Preferred approaches:\n";
      data.driverExperience.preferredApproaches.forEach((approach) => {
        formattedData += `  * ${approach}\n`;
      });
    }
    
    if (data.driverExperience.previousFeedback && data.driverExperience.previousFeedback.length > 0) {
      formattedData += "- Previous feedback:\n";
      data.driverExperience.previousFeedback.forEach((feedback) => {
        formattedData += `  * ${feedback}\n`;
      });
    }
    
    if (data.driverExperience.certifications && data.driverExperience.certifications.length > 0) {
      formattedData += "- Certifications:\n";
      data.driverExperience.certifications.forEach((certification) => {
        formattedData += `  * ${certification}\n`;
      });
    }
    
    formattedData += "\n";
  }
  
  // Add driver preferences if available and relevant
  if (
    data.driverPreferences &&
    [
      "intelligent_route_optimization",
      "driver_preference_analysis",
      "route_optimization",
      "contextual_routing_advice"
    ].includes(type)
  ) {
    formattedData += "DRIVER PREFERENCES:\n";
    formattedData += `- Preferred routes: ${data.driverPreferences.preferredRoutes?.join(", ") || "None specified"}\n`;
    formattedData += `- Avoided areas: ${data.driverPreferences.avoidedAreas?.join(", ") || "None specified"}\n`;
    formattedData += `- Preferred rest stops: ${data.driverPreferences.preferredRestStops?.join(", ") || "None specified"}\n`;
    formattedData += `- Preferred fuel stations: ${data.driverPreferences.preferredFuelStations?.join(", ") || "None specified"}\n`;
    formattedData += `- Preferred time of travel: ${data.driverPreferences.preferredTimeOfTravel || "Any"}\n`;
    formattedData += "\n";
  }
  
  // Add facility constraints if available and relevant
  if (
    data.facilityConstraints &&
    [
      "intelligent_route_optimization",
      "facility_constraint_analysis",
      "route_optimization"
    ].includes(type)
  ) {
    formattedData += "FACILITY CONSTRAINTS:\n";
    formattedData += `- Pickup facility hours: ${data.facilityConstraints.pickupHours || "Unknown"}\n`;
    formattedData += `- Delivery facility hours: ${data.facilityConstraints.deliveryHours || "Unknown"}\n`;
    formattedData += `- Pickup dock availability: ${data.facilityConstraints.pickupDockAvailability || "Unknown"}\n`;
    formattedData += `- Delivery dock availability: ${data.facilityConstraints.deliveryDockAvailability || "Unknown"}\n`;
    formattedData += `- Average wait time at pickup: ${data.facilityConstraints.avgPickupWaitTime || "Unknown"} minutes\n`;
    formattedData += `- Average wait time at delivery: ${data.facilityConstraints.avgDeliveryWaitTime || "Unknown"} minutes\n`;
    formattedData += "\n";
  }
  
  // Add time of day patterns if available and relevant
  if (
    data.timeOfDayPatterns &&
    [
      "intelligent_route_optimization",
      "route_optimization",
      "eta_prediction"
    ].includes(type)
  ) {
    formattedData += "TIME OF DAY PATTERNS:\n";
    formattedData += `- Morning rush hour impact: ${data.timeOfDayPatterns.morningRushHour || "Unknown"}\n`;
    formattedData += `- Evening rush hour impact: ${data.timeOfDayPatterns.eveningRushHour || "Unknown"}\n`;
    formattedData += `- Best time for pickup area: ${data.timeOfDayPatterns.bestTimeForPickup || "Unknown"}\n`;
    formattedData += `- Best time for delivery area: ${data.timeOfDayPatterns.bestTimeForDelivery || "Unknown"}\n`;
    formattedData += `- School zone impacts: ${data.timeOfDayPatterns.schoolZoneImpacts || "None"}\n`;
    formattedData += "\n";
  }
  
  // Add previous delivery data if available and relevant
  if (
    data.previousDeliveryData &&
    [
      "intelligent_route_optimization",
      "pattern_recognition",
      "delay_analysis"
    ].includes(type)
  ) {
    formattedData += "PREVIOUS DELIVERY DATA:\n";
    formattedData += `- Average delivery time on this route: ${data.previousDeliveryData.avgDeliveryTime || "Unknown"} minutes\n`;
    formattedData += `- Fastest recorded delivery: ${data.previousDeliveryData.fastestDelivery || "Unknown"} minutes\n`;
    formattedData += `- Routes used by fastest deliveries: ${data.previousDeliveryData.fastestRoutes?.join(", ") || "Unknown"}\n`;
    formattedData += `- Common delay points: ${data.previousDeliveryData.commonDelayPoints?.join(", ") || "None identified"}\n`;
    formattedData += `- Successful delivery count: ${data.previousDeliveryData.successfulDeliveryCount || 0}\n`;
    formattedData += "\n";
  }
  
  // Add alternative routes if available and relevant
  if (
    data.alternativeRoutes &&
    [
      "intelligent_route_optimization",
      "route_optimization"
    ].includes(type)
  ) {
    formattedData += "ALTERNATIVE ROUTES:\n";
    if (data.alternativeRoutes.routes && data.alternativeRoutes.routes.length > 0) {
      data.alternativeRoutes.routes.forEach((route: any, index: number) => {
        formattedData += `- Route ${index + 1}:\n`;
        formattedData += `  * Distance: ${route.distance} miles\n`;
        formattedData += `  * Estimated duration: ${route.duration} minutes\n`;
        formattedData += `  * Traffic level: ${route.trafficLevel || "Unknown"}\n`;
        formattedData += `  * Key waypoints: ${route.keyWaypoints?.join(" → ") || "Not specified"}\n`;
      });
    } else {
      formattedData += "- No alternative routes available\n";
    }
    formattedData += "\n";
  }

  // Add traffic data if available and relevant
  if (
    data.trafficData &&
    [
      "eta_prediction",
      "traffic_interpretation",
      "delay_analysis",
      "route_optimization",
    ].includes(type)
  ) {
    formattedData += "TRAFFIC DATA:\n";
    formattedData += `- Current traffic condition: ${data.trafficData.condition}\n`;
    formattedData += `- Congestion level: ${data.trafficData.congestionLevel}/10\n`;
    formattedData += `- Average speed: ${data.trafficData.averageSpeed} mph\n`;
    formattedData += `- Delay minutes: ${data.trafficData.delayMinutes}\n`;

    if (data.trafficData.incidents && data.trafficData.incidents.length > 0) {
      formattedData += "- Incidents:\n";
      data.trafficData.incidents.forEach((incident: any) => {
        formattedData += `  * ${incident.type} (Severity: ${incident.severity})\n`;
      });
    }
    formattedData += "\n";
  }

  // Add weather data if available and relevant
  if (
    data.weatherData &&
    [
      "eta_prediction",
      "weather_impact",
      "delay_analysis",
      "route_optimization",
    ].includes(type)
  ) {
    formattedData += "WEATHER DATA:\n";
    formattedData += `- Current condition: ${data.weatherData.condition}\n`;
    formattedData += `- Temperature: ${data.weatherData.temperature}°F\n`;
    formattedData += `- Precipitation: ${data.weatherData.precipitation} inches\n`;
    formattedData += `- Wind speed: ${data.weatherData.windSpeed} mph\n`;
    formattedData += `- Visibility: ${data.weatherData.visibility} miles\n`;

    if (data.weatherData.alerts && data.weatherData.alerts.length > 0) {
      formattedData += "- Weather alerts:\n";
      data.weatherData.alerts.forEach((alert: any) => {
        formattedData += `  * ${alert.type} (${alert.description})\n`;
      });
    }
    formattedData += "\n";
  }

  // Add location data if available and relevant
  if (
    data.locationData &&
    [
      "eta_prediction",
      "notification_generation",
      "contextual_information",
      "route_optimization",
    ].includes(type)
  ) {
    formattedData += "LOCATION DATA:\n";
    formattedData += `- Current location: ${data.locationData.latitude}, ${data.locationData.longitude}\n`;
    formattedData += `- Distance to destination: ${data.locationData.distanceToDestination} miles\n`;
    formattedData += `- Last updated: ${new Date(data.locationData.timestamp).toLocaleTimeString()}\n`;
    formattedData += "\n";
  }

  // Add historical data if available and relevant
  if (
    data.historicalData &&
    ["eta_prediction", "pattern_recognition", "delay_analysis"].includes(type)
  ) {
    formattedData += "HISTORICAL DATA:\n";
    formattedData += `- Average delivery time on this route: ${data.historicalData.avgDeliveryTime} minutes\n`;
    formattedData += `- Historical delay frequency: ${data.historicalData.delayFrequency}%\n`;
    formattedData += `- Common delay causes: ${data.historicalData.commonDelayCauses.join(", ")}\n`;
    formattedData += "\n";
  }

  // Add vehicle data if available and relevant
  if (
    data.vehicleData &&
    ["eta_prediction", "delay_analysis", "route_optimization"].includes(type)
  ) {
    formattedData += "VEHICLE DATA:\n";
    formattedData += `- Type: ${data.vehicleData.type}\n`;
    formattedData += `- Average speed: ${data.vehicleData.avgSpeed} mph\n`;
    formattedData += `- Current status: ${data.vehicleData.status}\n`;
    formattedData += "\n";
  }

  // Add load data if available and relevant
  if (
    data.loadData &&
    [
      "eta_prediction",
      "notification_generation",
      "contextual_information",
    ].includes(type)
  ) {
    formattedData += "LOAD DATA:\n";
    formattedData += `- Load ID: ${data.loadData.id}\n`;
    formattedData += `- Origin: ${data.loadData.origin}\n`;
    formattedData += `- Destination: ${data.loadData.destination}\n`;
    formattedData += `- Scheduled delivery: ${new Date(data.loadData.scheduledDelivery).toLocaleString()}\n`;
    formattedData += `- Current status: ${data.loadData.status}\n`;
    formattedData += "\n";
  }

  // Add route data if available and relevant
  if (
    data.routeData &&
    ["eta_prediction", "route_optimization", "delay_analysis"].includes(type)
  ) {
    formattedData += "ROUTE DATA:\n";
    formattedData += `- Original ETA: ${new Date(data.routeData.originalEta).toLocaleString()}\n`;
    formattedData += `- Current ETA: ${new Date(data.routeData.currentEta).toLocaleString()}\n`;
    formattedData += `- Remaining distance: ${data.routeData.remainingDistance} miles\n`;
    formattedData += `- Remaining driving time: ${data.routeData.remainingDrivingTime} minutes\n`;
    formattedData += "\n";
  }

  return formattedData;
}

/**
 * Generate user query based on prompt type and user role
 */
export function generateUserQuery(
  type: PromptType,
  userRole: UserRole,
): string {
  const queries = {
    eta_prediction: {
      shipper:
        "When will my shipment arrive? Please provide an accurate ETA with confidence level and explain any changes from the original schedule.",
      carrier:
        "What's the updated ETA for this load? Include factors affecting the prediction and any operational adjustments we should make.",
      driver:
        "What's my updated arrival time? Keep it brief and tell me if I need to adjust my driving to meet the schedule.",
      admin:
        "Provide a detailed ETA analysis for this shipment, including confidence intervals and all factors affecting the prediction.",
    },
    intelligent_route_optimization: {
      shipper:
        "Based on historical data and current conditions, what's the optimal route for this shipment that might improve upon the standard mapping API suggestion?",
      carrier:
        "Analyze our historical delivery data and current conditions to suggest the most efficient route for this load, potentially improving upon the standard mapping API route.",
      driver:
        "Based on your experience and our delivery history, is there a better route than what the GPS is suggesting? Give me specific turn-by-turn directions if there is.",
      admin:
        "Provide a comprehensive analysis of potential route optimizations beyond standard mapping APIs, incorporating historical data, driver feedback, and facility constraints.",
    },
    contextual_routing_advice: {
      shipper:
        "What facility-specific information should I share with my driver for this delivery location?",
      carrier:
        "What contextual routing advice should we provide to our driver for this specific delivery, considering the vehicle type and facility constraints?",
      driver:
        "I'm heading to this delivery location. What should I know about the facility, local conditions, and regulations that my GPS won't tell me?",
      admin:
        "Provide comprehensive contextual routing advice for this delivery location that we can add to our knowledge base for future deliveries.",
    },
    
    driver_preference_analysis: {
      shipper:
        "How can we incorporate driver preferences to improve delivery efficiency for this shipment?",
      carrier:
        "Analyze driver feedback and behavior patterns to identify route preferences that could improve efficiency and driver satisfaction.",
      driver:
        "Based on your previous routes and feedback, what route adjustments would better match your preferences while maintaining efficiency?",
      admin:
        "Provide a detailed analysis of how driver preferences affect route efficiency and identify opportunities to incorporate driver knowledge into standard routes.",
    },
    facility_constraint_analysis: {
      shipper:
        "What facility constraints should we consider when scheduling pickup and delivery times for this shipment?",
      carrier:
        "Analyze facility constraints at pickup and delivery locations to optimize arrival times and minimize wait times.",
      driver:
        "What's the best time to arrive at the pickup and delivery facilities to avoid wait times based on their operating patterns?",
      admin:
        "Provide a comprehensive analysis of facility constraints affecting this shipment and recommend scheduling adjustments to improve efficiency.",
    },
    delay_pattern_analysis: {
      shipper:
        "What recurring delay patterns affect my shipments and how can I adjust my shipping strategy to minimize their impact?",
      carrier:
        "What delay patterns are emerging across our fleet operations and what operational changes should we implement to address them?",
      driver:
        "What delay patterns should I be aware of on my regular routes and how can I adjust my driving to avoid them?",
      admin:
        "Provide a comprehensive analysis of system-wide delay patterns, their root causes, and strategic recommendations for improving on-time performance.",
    },
    traffic_interpretation: {
      shipper:
        "How is current traffic affecting my shipment? Will it cause delays?",
      carrier:
        "Analyze current traffic conditions affecting our fleet and recommend any dispatch adjustments needed.",
      driver:
        "What traffic issues should I be aware of ahead? Give me specific locations and how to navigate them.",
      admin:
        "Provide a comprehensive traffic analysis for all active routes, highlighting critical congestion points and system-wide impacts.",
    },
    notification_generation: {
      shipper:
        "Create a notification about my shipment's current status that I can share with my team.",
      carrier:
        "Draft a status update for our customer about their shipment, explaining any changes or issues.",
      driver:
        "Create a quick status update I can send to dispatch about my current situation.",
      admin:
        "Generate appropriate notifications for all stakeholders about this shipment's status, customized by role.",
    },
    delay_analysis: {
      shipper: "Why is my shipment delayed and when will it arrive now?",
      carrier:
        "Analyze the cause of this delay and recommend how to prevent similar issues in the future.",
      driver: "What's causing my delay and what should I do next?",
      admin:
        "Provide a root cause analysis of this delay with statistical comparison to similar shipments and systematic recommendations.",
    },
    route_optimization: {
      shipper:
        "Is there a better route that could get my shipment delivered faster?",
      carrier:
        "Recommend route optimizations for this load to improve efficiency and on-time delivery.",
      driver:
        "Is there a better route I should take from my current location? Keep it simple and safe.",
      admin:
        "Analyze all possible route alternatives and provide a cost-benefit analysis of each option.",
    },
    weather_impact: {
      shipper: "How will current weather conditions affect my delivery time?",
      carrier:
        "Assess weather impacts on our active fleet and recommend operational adjustments.",
      driver:
        "What weather conditions should I prepare for on my route and how should I adjust my driving?",
      admin:
        "Provide a comprehensive weather impact analysis for all regions with active shipments and recommend system-wide adjustments.",
    },
    pattern_recognition: {
      shipper:
        "Based on historical data, when are my shipments most likely to face delays on this route?",
      carrier:
        "Identify patterns in our delivery performance that we can use to improve operations.",
      driver:
        "What patterns should I be aware of on this route to avoid common issues?",
      admin:
        "Analyze historical performance patterns across all routes and carriers to identify systematic improvement opportunities.",
    },
    contextual_information: {
      shipper:
        "Give me all the relevant information about my shipment's current status in a concise format.",
      carrier:
        "Provide a complete operational briefing on this load and any special considerations.",
      driver: "What do I need to know about this load and my next steps?",
      admin:
        "Compile a comprehensive status report on this shipment with all relevant operational, commercial, and historical context.",
    },
  };

  return queries[type][userRole];
}

/**
 * Generate output format instructions based on prompt type
 */
export function generateOutputFormat(type: PromptType): string {
  const formats = {
    eta_prediction:
      "Provide your response in the following format:\n\n1. PREDICTED ETA: [Date and time]\n2. CONFIDENCE LEVEL: [High/Medium/Low]\n3. FACTORS AFFECTING ETA: [Bullet points of key factors]\n4. EXPLANATION: [Brief explanation of the prediction]\n5. RECOMMENDATIONS: [Optional suggestions]",
      
    intelligent_route_optimization:
      "Provide your response in the following format:\n\n1. OPTIMIZATION SUMMARY: [Brief overview of your route recommendation]\n2. STANDARD ROUTE: [Brief description of the mapping API route]\n3. OPTIMIZED ROUTE: [Detailed turn-by-turn directions for your recommended route]\n4. BENEFITS: [Specific advantages of your route compared to the standard route]\n5. REASONING: [Explanation of why this route is better, referencing historical data, driver preferences, or facility constraints]\n6. TIME SAVINGS: [Estimated minutes saved]\n7. DISTANCE IMPACT: [Increase or decrease in miles]\n8. CONFIDENCE LEVEL: [High/Medium/Low with explanation]\n9. VISUAL GUIDANCE: [Key landmarks or reference points to help the driver]\n10. POTENTIAL CHALLENGES: [Any issues the driver should be aware of on this route]",
      
    contextual_routing_advice:
      "Provide your response in the following format:\n\n1. FACILITY APPROACH: [Specific directions for approaching the facility, including best entrance for commercial vehicles]\n2. PARKING & LOADING: [Instructions for where to park and how to access loading/unloading areas]\n3. CHECK-IN PROCEDURES: [Step-by-step process for checking in at the facility]\n4. LOCAL KNOWLEDGE: [Information about the area that isn't in navigation apps but is important for drivers]\n5. REGULATORY NOTES: [Any special regulations, restrictions, or requirements for this location]\n6. DRIVER TIPS: [Practical advice tailored to the driver's experience level]\n7. POTENTIAL CHALLENGES: [Common issues drivers face at this location and how to handle them]\n8. AMENITIES: [Available facilities for drivers such as restrooms, food options, etc.]\n9. EMERGENCY CONTACTS: [Who to contact if issues arise]\n10. VISUAL LANDMARKS: [Key visual cues to help identify correct locations]",
      
      
    driver_preference_analysis:
      "Provide your response in the following format:\n\n1. PREFERENCE SUMMARY: [Overview of identified driver preferences]\n2. KEY PREFERENCES: [List of specific preferences with supporting evidence]\n3. IMPACT ANALYSIS: [How these preferences affect route efficiency and driver satisfaction]\n4. RECOMMENDED ADJUSTMENTS: [Specific route modifications based on preferences]\n5. IMPLEMENTATION APPROACH: [How to incorporate these preferences into routing systems]\n6. EXPECTED BENEFITS: [Anticipated improvements in efficiency, satisfaction, or retention]",
      
    facility_constraint_analysis:
      "Provide your response in the following format:\n\n1. CONSTRAINT SUMMARY: [Overview of key facility constraints]\n2. PICKUP FACILITY ANALYSIS: [Detailed analysis of pickup location constraints]\n3. DELIVERY FACILITY ANALYSIS: [Detailed analysis of delivery location constraints]\n4. OPTIMAL ARRIVAL WINDOWS: [Recommended arrival times to minimize wait times]\n5. SCHEDULING RECOMMENDATIONS: [Specific scheduling adjustments to accommodate constraints]\n6. COORDINATION STRATEGIES: [Suggestions for better coordination with facilities]\n7. EXPECTED WAIT TIME REDUCTION: [Estimated minutes saved by following recommendations]",

    delay_pattern_analysis:
      "Provide your response in the following format:\n\n1. PATTERN SUMMARY: [Brief overview of identified delay patterns]\n2. RECURRING PATTERNS: [List of specific recurring patterns with frequency and impact]\n3. ROOT CAUSES: [Analysis of underlying causes for each pattern]\n4. PREDICTION MODEL: [How these patterns can predict future delays with confidence levels]\n5. MITIGATION STRATEGIES: [Role-specific actionable recommendations to address patterns]\n6. MONITORING METRICS: [Key indicators to track for measuring improvement]",

    traffic_interpretation:
      "Provide your response in the following format:\n\n1. TRAFFIC SUMMARY: [Brief overview of current conditions]\n2. IMPACT ASSESSMENT: [How traffic affects the shipment/route]\n3. DELAY PREDICTION: [Expected delay in minutes/hours if any]\n4. ALTERNATIVE ROUTES: [If applicable]\n5. RECOMMENDATIONS: [Actions to take based on traffic conditions]",

    notification_generation:
      "Provide your response in the following format:\n\n1. NOTIFICATION TITLE: [Brief, informative title]\n2. NOTIFICATION BODY: [Clear, concise message with essential information]\n3. URGENCY LEVEL: [Low/Medium/High/Critical]\n4. RECOMMENDED ACTIONS: [What the recipient should do next]\n5. ADDITIONAL CONTEXT: [Optional background information]",

    delay_analysis:
      "Provide your response in the following format:\n\n1. DELAY SUMMARY: [Brief overview of the delay]\n2. ROOT CAUSES: [Primary and secondary factors causing the delay]\n3. IMPACT ASSESSMENT: [How the delay affects delivery and operations]\n4. UPDATED ETA: [New expected arrival time]\n5. PREVENTIVE MEASURES: [How to avoid similar delays in the future]",

    route_optimization:
      "Provide your response in the following format:\n\n1. OPTIMIZATION SUMMARY: [Brief overview of recommendations]\n2. RECOMMENDED ROUTE: [Clear description of the suggested route]\n3. BENEFITS: [Time saved, distance reduced, etc.]\n4. CONSIDERATIONS: [Any trade-offs or special factors to consider]\n5. IMPLEMENTATION STEPS: [How to implement the recommendation]",

    weather_impact:
      "Provide your response in the following format:\n\n1. WEATHER SUMMARY: [Current and forecasted conditions]\n2. IMPACT ASSESSMENT: [How weather affects the shipment/route]\n3. RISK LEVEL: [Low/Medium/High/Critical]\n4. EXPECTED DELAYS: [Estimated additional time due to weather]\n5. SAFETY RECOMMENDATIONS: [Precautions and adjustments]",

    pattern_recognition:
      "Provide your response in the following format:\n\n1. PATTERN SUMMARY: [Brief overview of identified patterns]\n2. KEY TRENDS: [Detailed description of significant trends]\n3. CAUSAL FACTORS: [What drives these patterns]\n4. PREDICTIVE INSIGHTS: [What these patterns suggest for the future]\n5. RECOMMENDED ACTIONS: [How to leverage or mitigate these patterns]",

    contextual_information:
      "Provide your response in the following format:\n\n1. STATUS SUMMARY: [Current shipment status in one sentence]\n2. KEY DETAILS: [Essential information about the shipment]\n3. RECENT UPDATES: [Any changes since last check]\n4. NEXT MILESTONES: [Upcoming events in the shipment journey]\n5. POTENTIAL ISSUES: [Any concerns to be aware of]",
  };

  return formats[type];
}

/**
 * Generate constraints based on prompt type
 */
export function generateConstraints(type: PromptType): string {
  const constraints = {
    eta_prediction:
      "Constraints:\n- Provide time estimates in the local time zone of the delivery location\n- Express confidence levels based on data quality and completeness\n- Prioritize accuracy over precision when data is limited\n- Consider regulatory constraints like hours of service for drivers",
      
    intelligent_route_optimization:
      "Constraints:\n- Only suggest alternative routes when there's clear evidence they're better than the standard route\n- Ensure all route suggestions comply with vehicle type restrictions (weight limits, height clearances, etc.)\n- Consider driver hours of service limitations in your recommendations\n- Balance time savings against potential increases in distance or fuel consumption\n- Prioritize driver safety and comfort in all recommendations\n- Provide specific, actionable directions that a driver can easily follow\n- Consider the confidence level of your recommendation based on the quality and quantity of supporting data\n- Acknowledge when the standard mapping API route is already optimal",
      
    contextual_routing_advice:
      "Constraints:\n- Focus on information that complements rather than replaces standard navigation\n- Tailor advice to the driver's experience level (more detailed for novices, more concise for experts)\n- Prioritize safety-critical information above convenience factors\n- Include only verified information about facilities and local conditions\n- Ensure all regulatory information is current and applicable to the specific vehicle type\n- Keep instructions clear, concise, and easy to follow while driving\n- Adapt detail level based on the complexity of the facility and approach\n- Acknowledge when information might be incomplete or uncertain\n- Avoid overwhelming the driver with too much information at once",
      
      
    driver_preference_analysis:
      "Constraints:\n- Base preference identification on concrete evidence, not assumptions\n- Distinguish between preferences that improve efficiency and those that don't\n- Consider how preferences might vary based on time of day, weather, or season\n- Acknowledge the limitations of available data on driver preferences\n- Prioritize preferences that have the strongest evidence of positive impact\n- Consider how preferences might conflict with other optimization goals",
      
    facility_constraint_analysis:
      "Constraints:\n- Base recommendations on actual facility operating patterns, not just stated hours\n- Consider how constraints might vary by day of week or season\n- Account for appointment scheduling systems and their flexibility\n- Recognize the difference between average wait times and worst-case scenarios\n- Consider how facility constraints interact with driver hours of service\n- Acknowledge when data is insufficient to make high-confidence recommendations",

    delay_pattern_analysis:
      "Constraints:\n- Focus on patterns that are statistically significant and actionable\n- Distinguish between systemic patterns and one-time anomalies\n- Consider seasonal variations and cyclical patterns\n- Prioritize patterns with the highest business impact\n- Ensure recommendations are practical and implementable\n- Tailor insights to the specific user role and their sphere of influence",

    traffic_interpretation:
      "Constraints:\n- Focus only on traffic issues that materially impact the route\n- Distinguish between recurring congestion and unexpected incidents\n- Consider time of day and day of week patterns\n- Prioritize actionable insights over general observations",

    notification_generation:
      "Constraints:\n- Keep notifications under 160 characters for SMS compatibility\n- Use clear, non-technical language\n- Include only actionable information\n- Match urgency level to actual situation severity\n- Avoid alarming language unless situation is critical",

    delay_analysis:
      "Constraints:\n- Distinguish between controllable and uncontrollable factors\n- Quantify delay impact whenever possible\n- Focus on most significant causes rather than exhaustive list\n- Provide specific rather than general recommendations\n- Consider contractual and service level agreement implications",

    route_optimization:
      "Constraints:\n- Consider driver hours of service limitations\n- Respect vehicle type restrictions on suggested routes\n- Balance time savings against fuel efficiency\n- Account for required stops and break times\n- Ensure suggestions comply with company routing policies",

    weather_impact:
      "Constraints:\n- Focus on weather conditions relevant to the specific vehicle type\n- Consider both immediate and upcoming forecast in recommendations\n- Prioritize safety over schedule adherence\n- Account for regional differences in weather response (e.g., snow handling)\n- Include visibility impacts for nighttime driving",

    pattern_recognition:
      "Constraints:\n- Distinguish correlation from causation in identified patterns\n- Consider seasonal and cyclical factors\n- Account for data limitations and potential biases\n- Focus on actionable patterns rather than interesting but impractical insights\n- Quantify confidence levels for identified patterns",

    contextual_information:
      "Constraints:\n- Include only verified information, not speculation\n- Prioritize recent updates over historical information\n- Tailor detail level to recipient role\n- Focus on exceptions and deviations from plan\n- Maintain confidentiality of sensitive business information",
  };

  return constraints[type];
}

/**
 * Generate examples based on prompt type
 */
export function generateExamples(type: PromptType): string {
  const examples = {
    eta_prediction:
      "Example:\n\nPREDICTED ETA: June 15, 2023, 2:45 PM EDT\nCONFIDENCE LEVEL: Medium\nFACTORS AFFECTING ETA:\n- Heavy traffic on I-95 near Baltimore (+25 minutes)\n- Light rain conditions reducing average speed (-10 minutes)\n- Driver ahead of HOS limits (+15 minutes)\nEXPLANATION: The original ETA was 1:45 PM, but current traffic conditions and weather have added approximately 30 minutes to the journey. The driver will also need a short break to stay within hours of service regulations.\nRECOMMENDATIONS: Consider alerting the receiving facility about the updated arrival time.",
      
    intelligent_route_optimization:
      "Example:\n\nOPTIMIZATION SUMMARY: An alternative route using local roads can save approximately 25 minutes compared to the standard highway route due to construction delays and historical traffic patterns.\n\nSTANDARD ROUTE: I-95 South to Exit 7, then Route 1 to destination (37 miles, estimated 55 minutes in current conditions)\n\nOPTIMIZED ROUTE:\n1. From current location, continue 2 miles on Main Street\n2. Turn right onto Oak Avenue and continue for 3.5 miles\n3. Turn left onto River Road (look for the gas station at this intersection)\n4. Follow River Road for 7 miles until it intersects with County Road 513\n5. Turn right onto CR-513 and continue for 4 miles\n6. Turn left onto Industrial Parkway (just after the railroad crossing)\n7. Destination will be on your right after 1.2 miles\n\nBENEFITS:\n- Avoids major construction zone on I-95 between exits 4-6\n- Bypasses historically congested shopping district during peak hours\n- Uses roads frequently traveled by local delivery drivers with good results\n- Includes roads with higher speed limits than alternative surface streets\n\nREASONING: Historical delivery data shows this route consistently outperforms the standard route between 3-6 PM on weekdays. Five previous deliveries using this route averaged 28 minutes faster than GPS-recommended routes. Additionally, three regular drivers for this route have provided positive feedback on this alternative, noting the construction zone on I-95 often causes unpredictable delays not fully reflected in real-time traffic data.\n\nTIME SAVINGS: Approximately 25 minutes (45% improvement)\n\nDISTANCE IMPACT: +2.3 miles compared to standard route\n\nCONFIDENCE LEVEL: High - Based on 5 recent deliveries and consistent driver feedback, plus current construction reports\n\nVISUAL GUIDANCE:\n- The turn onto River Road is immediately after a distinctive red barn\n- Railroad crossing on CR-513 has a flashing yellow light\n- Industrial Parkway entrance has a large blue water tower visible from a distance\n\nPOTENTIAL CHALLENGES:\n- Railroad crossing on CR-513 occasionally has train activity around 4:30 PM\n- The right turn onto Industrial Parkway can be easy to miss - look for the water tower",
      
    contextual_routing_advice:
      "Example:\n\nFACILITY APPROACH:\nApproach from the north side of Industrial Parkway. The south entrance has a low clearance bridge (12'6\") that's unsuitable for most commercial vehicles. Use the dedicated truck entrance at Gate B, which is 0.3 miles past the main entrance. Look for the blue and white 'Truck Entrance' sign.\n\nPARKING & LOADING:\nTruck parking is available in Lot C, immediately to the right after entering Gate B. Pull forward to the check-in kiosk first, then proceed to one of the numbered loading bays (1-12). Back in at a 45-degree angle as the docks are angled. There's a truck staging area if all docks are full.\n\nCHECK-IN PROCEDURES:\n1. Stop at security gate and present your driver ID and load number\n2. Proceed to check-in kiosk in front of the warehouse\n3. Use the touchscreen to enter your load number and phone number\n4. Wait for text message with dock assignment (typically 5-10 minutes)\n5. Proceed to assigned dock and check in with dock supervisor\n\nLOCAL KNOWLEDGE:\n- This industrial park experiences heavy congestion between 7-9 AM and 4-6 PM\n- The left turn from Highway 40 onto Industrial Parkway lacks a dedicated turn lane and can back up during peak hours\n- Local drivers often use the Elm Street route to avoid the Highway 40 congestion\n- The facility is in a high-theft area - secure your vehicle if leaving it unattended\n\nREGULATORY NOTES:\n- This facility is within a city noise ordinance zone - no idling for more than 10 minutes\n- Weight restriction of 30 tons on Industrial Parkway bridge\n- No overnight parking allowed in the facility lot or on surrounding streets\n- Hazmat loads require additional paperwork available at the security office\n\nDRIVER TIPS:\n- Restrooms are available inside the main building, first door on right after entering\n- Check-in process is faster if you have your BOL and load number ready before arriving\n- If assigned docks 10-12, be aware of tight turning radius - approach from the far lane\n- Facility is known for efficient loading/unloading (avg. 45 minutes) if paperwork is in order\n\nPOTENTIAL CHALLENGES:\n- Gate B keypad sometimes malfunctions in heavy rain - use call box if unresponsive\n- Cell reception is poor inside the warehouse - complete any necessary calls beforehand\n- First-time check-in typically takes 15-20 minutes vs. 5-10 for regular drivers\n- Dock levelers for bays 7-9 are known to be temperamental - request assistance if needed\n\nAMENITIES:\n- Driver lounge with vending machines, microwave, and TV\n- Clean restrooms with showers ($5 token from security desk)\n- Food options: vending machines on-site, diner 0.5 miles east on Industrial Parkway\n- Free Wi-Fi available in driver lounge (password: guest2023)\n\nEMERGENCY CONTACTS:\n- Facility Manager: John Smith (555-123-4567)\n- Security Office: 555-123-8910 (staffed 24/7)\n- Dock Supervisor: 555-123-5678 (6 AM - 10 PM)\n- Local Non-Emergency Police: 555-123-9876\n\nVISUAL LANDMARKS:\n- Large blue water tower visible from Highway 40\n- Red 'Midwest Distribution Center' sign at the main entrance\n- Gate B has yellow and black striped guardrails\n- Loading area has distinctive green metal roof visible from access road",
      
      
    driver_preference_analysis:
      "Example:\n\nPREFERENCE SUMMARY: Analysis of Driver #42's route history and feedback reveals consistent preferences for specific highways, rest stops, and time-of-day patterns that could improve route efficiency and satisfaction.\n\nKEY PREFERENCES:\n1. Consistently chooses I-76 over I-476 when both are viable options (selected in 87% of cases)\n2. Prefers the Pilot Travel Center at exit 215 for rest breaks (used in 92% of routes requiring breaks)\n3. Tends to avoid downtown Philadelphia between 7-9 AM (detoured in 78% of cases)\n4. Prefers routes with fewer turns and lane changes even when slightly longer (feedback from 3 post-delivery surveys)\n5. Consistently performs better on routes using US-30 versus local alternatives (11% faster delivery times)\n\nIMPACT ANALYSIS:\n- Route choices show driver leverages local knowledge of traffic patterns not captured in mapping APIs\n- Rest stop preference allows for more predictable break timing and duration\n- Preference for simpler routes with fewer turns correlates with fewer navigation errors\n- Avoiding downtown during peak hours has resulted in more consistent delivery times\n\nRECOMMENDED ADJUSTMENTS:\n1. Set I-76 as preferred route over I-476 when estimated time difference is less than 10 minutes\n2. Plan required breaks to coincide with preferred rest stop location when within 15 minutes of optimal break time\n3. Automatically route around downtown Philadelphia during 7-9 AM unless time savings exceeds 20 minutes\n4. Prioritize routes with fewer turns and lane changes when time difference is minimal\n\nIMPLEMENTATION APPROACH:\n1. Create driver-specific routing profile in the navigation system\n2. Add preferred and avoided road segments to the driver's profile\n3. Implement time-of-day specific routing rules for downtown avoidance\n4. Add route complexity as a factor in route selection algorithm\n\nEXPECTED BENEFITS:\n- Estimated 7-12 minute average time savings per delivery based on historical performance\n- Improved driver satisfaction based on alignment with demonstrated preferences\n- More predictable delivery times due to consistent routing and break patterns\n- Reduced navigation errors and associated delays",
      
    facility_constraint_analysis:
      "Example:\n\nCONSTRAINT SUMMARY: Analysis of the pickup and delivery facilities reveals specific operational patterns that significantly impact optimal arrival times and can reduce wait times by up to 45 minutes when properly accommodated.\n\nPICKUP FACILITY ANALYSIS:\n- Official hours: Monday-Friday 6 AM - 6 PM\n- Actual gate opening time consistently 6:15-6:30 AM despite stated 6 AM opening\n- Peak congestion periods: 7:30-9:30 AM and 3:30-5:30 PM\n- Average wait times: 45 minutes during peak, 15 minutes during off-peak\n- Check-in process requires paper documentation and takes 12-18 minutes\n- Only 2 of 5 loading docks operational before 7 AM\n- Shift change at 2 PM causes 15-20 minute processing delays\n\nDELIVERY FACILITY ANALYSIS:\n- Official hours: Monday-Saturday 7 AM - 8 PM\n- Lunch break from 12-1 PM with reduced staff and longer processing times\n- Peak congestion periods: 10 AM-12 PM and 1-3 PM\n- Average wait times: 55 minutes during peak, 20 minutes during off-peak\n- Appointment system often overbooks 11 AM-1 PM slot by 30-40%\n- Fastest processing observed between 7-8 AM and 6-8 PM\n- Delivery documentation can be pre-submitted electronically to reduce check-in time\n\nOPTIMAL ARRIVAL WINDOWS:\n- Pickup facility: 9:45-11:30 AM or 12:30-2:45 PM\n- Delivery facility: 7:00-8:30 AM or 3:15-5:45 PM\n\nSCHEDULING RECOMMENDATIONS:\n1. Schedule pickup for 10:30 AM to avoid morning rush and ensure all docks are operational\n2. Pre-submit delivery documentation electronically the day before\n3. Plan for delivery arrival at 3:30 PM to avoid lunch slowdown and afternoon peak\n4. Build in 15-minute buffer for pickup and 20-minute buffer for delivery\n5. Avoid scheduling delivery on Thursdays when historical data shows 30% longer wait times\n\nCOORDINATION STRATEGIES:\n1. Call pickup facility 30 minutes before arrival to confirm dock availability\n2. Request specific dock #3 or #4 at delivery facility (historically 24% faster processing)\n3. Establish relationship with receiving manager at delivery facility for priority processing\n4. Submit all paperwork electronically 24 hours in advance when possible\n\nEXPECTED WAIT TIME REDUCTION: 45-60 minutes total (25 minutes at pickup, 30 minutes at delivery)"

    delay_pattern_analysis:
      "Example:\n\nPATTERN SUMMARY: Analysis of 6 months of delivery data reveals consistent delays for Monday morning deliveries to Northeast distribution centers, particularly during winter months.\n\nRECURRING PATTERNS:\n1. Monday Morning Congestion (Frequency: 78%, Avg Delay: 42 min)\n   - Most pronounced at facilities in Boston, NYC, and Philadelphia\n   - Primarily affects deliveries scheduled between 7-10 AM\n   - Pattern intensifies during first week of each month (+15 min)\n\n2. Weather-Related Delays (Frequency: 35%, Avg Delay: 95 min)\n   - I-95 corridor particularly vulnerable to precipitation\n   - Snow accumulation >2 inches creates predictable delays\n   - Secondary roads more impacted than highways\n\n3. Driver-Specific Patterns (Frequency: 22%, Avg Delay: 28 min)\n   - 4 drivers consistently experience longer delivery times\n   - Pattern most evident on routes with multiple stops\n   - Correlates with less than 1 year of route experience\n\nROOT CAUSES:\n1. Monday Morning Congestion:\n   - Weekend backlog of administrative processing\n   - Reduced receiving staff on Monday mornings\n   - Competing deliveries from multiple carriers\n\n2. Weather-Related Delays:\n   - Insufficient route planning for weather conditions\n   - Fixed delivery schedules regardless of forecast\n   - Limited alternative routing options\n\n3. Driver-Specific Patterns:\n   - Insufficient familiarity with facility check-in procedures\n   - Suboptimal route selection between stops\n   - Longer dwell times at customer locations\n\nPREDICTION MODEL:\n- Monday deliveries to Northeast DCs have 82% probability of delay (high confidence)\n- Each inch of forecasted snow increases delay probability by 12% (medium confidence)\n- New drivers (<1 year experience) have 65% higher delay risk (medium confidence)\n- Combined factors create compound risk (e.g., new driver + Monday + snow = 94% delay probability)\n\nMITIGATION STRATEGIES:\n\nFor Shippers:\n- Reschedule critical Northeast deliveries to Tuesday-Thursday\n- Build 45-minute buffer into Monday delivery appointments\n- Request priority unloading for time-sensitive shipments\n\nFor Carriers:\n- Assign experienced drivers to Northeast Monday routes\n- Implement pre-weekend coordination calls with receiving facilities\n- Develop weather-specific routing alternatives\n\nFor Drivers:\n- Depart 30 minutes earlier for Monday deliveries\n- Document facility-specific check-in procedures\n- Maintain communication with dispatch about facility congestion\n\nFor Admins:\n- Implement dynamic scheduling based on pattern analysis\n- Develop facility-specific protocols for high-risk delivery windows\n- Create incentive program for pattern-breaking performance\n\nMONITORING METRICS:\n- Monday on-time delivery percentage\n- Weather-related delay minutes per route\n- Driver-specific delay pattern reduction\n- Facility congestion reports by day/time",

    traffic_interpretation:
      "Example:\n\nTRAFFIC SUMMARY: Moderate to heavy congestion on I-10 westbound with a reported accident at mile marker 225.\nIMPACT ASSESSMENT: The current route passes directly through the affected area, which is causing stop-and-go traffic for approximately 3 miles.\nDELAY PREDICTION: 35-45 minutes based on current clearance efforts and traffic volume.\nALTERNATIVE ROUTES: Taking Exit 220 to Route 90 and rejoining I-10 at Exit 230 could save approximately 20 minutes.\nRECOMMENDATIONS: Reroute via Route 90 if the driver can safely take the upcoming Exit 220 within the next 5 minutes.",

    notification_generation:
      "Example:\n\nNOTIFICATION TITLE: Delivery Delay Alert - Order #12345\nNOTIFICATION BODY: Your shipment is running 45 minutes behind schedule due to highway construction. New ETA is 3:15 PM. No action required.\nURGENCY LEVEL: Medium\nRECOMMENDED ACTIONS: No immediate action needed. Consider informing receiving personnel of the updated arrival time.\nADDITIONAL CONTEXT: Construction on I-75 is expected to continue through Friday. Future shipments on this route may experience similar delays.",

    delay_analysis:
      "Example:\n\nDELAY SUMMARY: Shipment #45678 is currently 3.5 hours behind schedule.\nROOT CAUSES:\n- Primary: Unexpected road closure on I-40 due to accident (2 hours)\n- Secondary: Loading delay at origin facility (1 hour)\n- Contributing: Driver break coincided with peak traffic period (30 minutes)\nIMPACT ASSESSMENT: The delay will cause the shipment to arrive after receiving hours at the destination facility, potentially requiring overnight storage.\nUPDATED ETA: June 16, 2023, 7:30 AM EDT (next day delivery)\nPREVENTIVE MEASURES:\n- Implement real-time route monitoring to detect road closures earlier\n- Schedule loading at origin facility 1 hour earlier for this lane\n- Adjust driver dispatch time to avoid peak traffic periods",

    route_optimization:
      "Example:\n\nOPTIMIZATION SUMMARY: An alternative route can save 45 minutes and 32 miles while avoiding current construction zones.\nRECOMMENDED ROUTE: From current location, take Exit 42 to Route 301 North, continue for 28 miles, then take Route 216 West to rejoin I-95 at Exit 35.\nBENEFITS:\n- Time saved: 45 minutes\n- Distance reduced: 32 miles\n- Fuel savings: Approximately 5 gallons\n- Avoids two known construction zones with variable delays\nCONSIDERATIONS: Route 301 has a lower speed limit (55 mph vs. 70 mph), but significantly less congestion. There are two available rest stops on this route.\nIMPLEMENTATION STEPS:\n1. Driver should take upcoming Exit 42 (approximately 3 miles ahead)\n2. Update dispatch about route change\n3. Inform customer about potential earlier arrival",

    weather_impact:
      "Example:\n\nWEATHER SUMMARY: Heavy snowfall (2-3 inches per hour) along I-80 in Wyoming with high winds (30-35 mph) reducing visibility to less than 1/4 mile.\nIMPACT ASSESSMENT: Current conditions make travel hazardous for all vehicles, especially high-profile trucks. Road closures are possible within the next 2-3 hours.\nRISK LEVEL: High\nEXPECTED DELAYS: 3-5 hours minimum, with potential for overnight delay if roads are closed.\nSAFETY RECOMMENDATIONS:\n1. Driver should seek safe parking at the nearest truck stop or rest area immediately\n2. Do not attempt to continue through Wyoming until storm passes\n3. Update dispatch every 2 hours on local conditions\n4. Monitor Wyoming DOT alerts for road closure information",

    pattern_recognition:
      "Example:\n\nPATTERN SUMMARY: Analysis of 6 months of delivery data shows consistent delays for Monday deliveries to Northeast region facilities.\nKEY TRENDS:\n- Monday deliveries to Boston, NYC, and Philadelphia are 2.3x more likely to be delayed than other weekdays\n- Average delay duration is 68 minutes longer on Mondays vs. other weekdays\n- Pattern is most pronounced for deliveries scheduled between 7-10 AM\n- No significant difference observed for afternoon deliveries\nCAUSAL FACTORS:\n- Receiving facilities have limited staff on Monday mornings (7-10 AM)\n- Weekend backlog of administrative processing creates check-in bottlenecks\n- Higher overall delivery volume on Mondays (+22% compared to other weekdays)\nPREDICTIVE INSIGHTS: Without intervention, Monday morning deliveries will continue to experience delays of 60+ minutes 78% of the time.\nRECOMMENDED ACTIONS:\n1. Reschedule non-urgent Monday deliveries to Monday afternoon or Tuesday morning\n2. For critical Monday morning deliveries, add 90-minute buffer to expected arrival time\n3. Implement pre-arrival notification system to expedite check-in process",

    contextual_information:
      "Example:\n\nSTATUS SUMMARY: Shipment #34567 is in transit and currently on schedule for delivery today at 2:15 PM EDT.\nKEY DETAILS:\n- Current location: I-76 near Harrisburg, PA (as of 10:30 AM EDT)\n- Remaining distance: 127 miles\n- Cargo: 18 pallets of refrigerated pharmaceuticals\n- Temperature: Maintaining required 38°F (within specification)\n- Carrier: Express Logistics, Truck #EL-789, Driver: Michael Chen\nRECENT UPDATES:\n- Passed weigh station inspection at 9:45 AM with no issues\n- Successfully navigated around construction zone with minimal delay\nNEXT MILESTONES:\n- Estimated arrival at destination city: 1:30 PM EDT\n- Delivery appointment time: 2:00-2:30 PM EDT\nPOTENTIAL ISSUES:\n- Weather radar shows possibility of thunderstorms along route between 12-1 PM\n- Destination facility has reported dock congestion today",
  };

  return examples[type];
}

/**
 * Build a complete prompt based on type, role, and available data
 */
export function buildPrompt(
  type: PromptType,
  userRole: UserRole,
  data: PromptDataSources,
  includeExamples: boolean = false,
): string {
  // Get the standardized template components
  const systemRole = generateSystemRole(type, userRole);
  const contextPreamble = generateContextPreamble(type);
  const formattedData = formatDataForPrompt(data, type);
  const userQuery = generateUserQuery(type, userRole);
  const outputFormat = generateOutputFormat(type);
  const constraints = generateConstraints(type);
  const examples = includeExamples ? generateExamples(type) : "";

  // Assemble the complete prompt
  let prompt = `${systemRole}\n\n${contextPreamble}\n\n${formattedData}\n\n${userQuery}\n\n${outputFormat}\n\n${constraints}`;

  if (includeExamples) {
    prompt += `\n\n${examples}`;
  }

  return prompt;
}

/**
 * Create a prompt template that can be reused and customized
 */
export function createPromptTemplate(type: PromptType): PromptTemplate {
  return {
    version: "1.0",
    type,
    systemRole: generateSystemRole(type),
    contextPreamble: generateContextPreamble(type),
    dataIntegration: "[DATA_PLACEHOLDER]", // Will be replaced with actual data
    userQuery: "[QUERY_PLACEHOLDER]", // Will be replaced with role-specific query
    outputFormat: generateOutputFormat(type),
    constraints: generateConstraints(type),
    examples: generateExamples(type),
  };
}

/**
 * Customize a prompt template for a specific use case
 */
export function customizePromptTemplate(
  template: PromptTemplate,
  userRole: UserRole,
  data: PromptDataSources,
  includeExamples: boolean = false,
): string {
  // Update system role with role-specific information
  const systemRole = generateSystemRole(template.type, userRole);

  // Format the data for this prompt type
  const formattedData = formatDataForPrompt(data, template.type);

  // Get the role-specific user query
  const userQuery = generateUserQuery(template.type, userRole);

  // Assemble the customized prompt
  let prompt = `${systemRole}\n\n${template.contextPreamble}\n\n${formattedData}\n\n${userQuery}\n\n${template.outputFormat}\n\n${template.constraints}`;

  if (includeExamples) {
    prompt += `\n\n${template.examples}`;
  }

  return prompt;
}

/**
 * Track and log prompt performance metrics
 */
export function trackPromptPerformance(
  promptType: PromptType,
  userRole: UserRole,
  metrics: PromptMetrics,
): void {
  // In a real implementation, this would log to a database or analytics system
  console.log(
    `Prompt Performance Metrics:\n- Type: ${promptType}\n- User Role: ${userRole}\n- Response Time: ${metrics.responseTime}ms\n- Token Usage: ${metrics.tokenUsage}\n- User Satisfaction: ${metrics.userSatisfactionRating || "N/A"}\n- Accuracy: ${metrics.accuracyScore || "N/A"}\n- Clarity: ${metrics.clarityRating || "N/A"}\n- Actionability: ${metrics.actionabilityScore || "N/A"}`,
  );
}

/**
 * Version a prompt template for tracking and improvement
 */
export function versionPromptTemplate(
  template: PromptTemplate,
  versionNumber: string,
  changes: string,
): PromptTemplate {
  return {
    ...template,
    version: versionNumber,
    // In a real implementation, you might add metadata about the changes
    // and store previous versions in a database
  };
}

/**
 * Library of reusable prompt components for common scenarios
 */
export const promptLibrary = {
  // Traffic delay components
  trafficDelay: {
    minor:
      "The route is experiencing minor traffic delays that may add 5-15 minutes to the journey. This is within normal variance and doesn't significantly impact the ETA.",
    moderate:
      "Moderate traffic congestion is affecting the route, adding approximately 15-30 minutes to the journey. The ETA has been adjusted accordingly.",
    severe:
      "Severe traffic conditions are significantly impacting the route, adding 30+ minutes to the journey. The ETA has been substantially adjusted.",
    accident:
      "A reported accident is blocking [NUMBER] lanes on [ROAD_NAME] near [LOCATION]. Emergency services are on scene. Estimated clearance time is [TIME].",
    construction:
      "Scheduled construction on [ROAD_NAME] has reduced available lanes from [ORIGINAL] to [CURRENT] for approximately [DISTANCE] miles.",
  },

  // Weather impact components
  weatherImpact: {
    rain: {
      light:
        "Light rain is falling along the route. This has minimal impact on travel time but requires standard wet-road precautions.",
      moderate:
        "Moderate rainfall is affecting visibility and road conditions, reducing average speeds by approximately 5-10 mph.",
      heavy:
        "Heavy rainfall is significantly reducing visibility and creating potential hydroplaning conditions. Speeds are reduced by 10-20 mph for safety.",
    },
    snow: {
      light:
        "Light snow is falling but not accumulating significantly on roadways. Minimal impact on travel time with standard winter driving precautions.",
      moderate:
        "Moderate snowfall with 1-3 inches of accumulation on roadways. Plows are active but speeds are reduced by 10-15 mph for safety.",
      heavy:
        "Heavy snowfall with 3+ inches of accumulation and continuing precipitation. Road conditions are hazardous with significantly reduced speeds.",
    },
    fog: {
      light:
        "Patchy fog is present in some areas but visibility remains above 1/4 mile. Minimal impact on travel time.",
      moderate:
        "Moderate fog is reducing visibility to approximately 1/4 mile in some areas, requiring reduced speeds.",
      heavy:
        "Dense fog is severely limiting visibility to less than 1/4 mile, requiring significantly reduced speeds for safety.",
    },
    wind: {
      moderate:
        "Moderate crosswinds (15-25 mph) may affect high-profile vehicles but have minimal impact on most traffic.",
      strong:
        "Strong crosswinds (25-40 mph) are affecting high-profile vehicles and may cause lane control difficulties.",
      severe:
        "Severe winds (40+ mph) are creating hazardous conditions for all vehicles, especially high-profile trucks.",
    },
  },

  // Urgency indicators for notifications
  urgencyIndicators: {
    low: "This is an informational update that requires no immediate action.",
    medium: "This update may require attention within the next few hours.",
    high: "This situation requires prompt attention and potential action.",
    critical:
      "This is an urgent situation requiring immediate attention and action.",
  },

  // ETA confidence levels
  etaConfidence: {
    high: "This ETA prediction has high confidence (±10 minutes) based on comprehensive real-time data and stable conditions.",
    medium:
      "This ETA prediction has medium confidence (±20 minutes) due to some variable factors or incomplete data.",
    low: "This ETA prediction has low confidence (±45 minutes or more) due to highly variable conditions or limited data.",
  },

  // Delivery status descriptions
  deliveryStatus: {
    onTime:
      "The shipment is progressing as scheduled and is expected to arrive within the planned delivery window.",
    slightDelay:
      "The shipment is experiencing a slight delay but is still expected to arrive within the planned delivery window.",
    significantDelay:
      "The shipment is experiencing a significant delay and is expected to arrive outside the planned delivery window.",
    expedited:
      "The shipment is moving faster than scheduled and may arrive earlier than the planned delivery window.",
    atRisk:
      "The shipment's on-time delivery is at risk due to current conditions and may require intervention.",
  },
};
