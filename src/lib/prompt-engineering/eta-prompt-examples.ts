/**
 * ETA & Delivery Time Prediction System
 * Prompt Engineering Examples
 *
 * This file contains concrete examples of the prompt framework applied to key scenarios.
 */

import {
  PromptType,
  UserRole,
  PromptDataSources,
  buildPrompt,
  createPromptTemplate,
  customizePromptTemplate,
  promptLibrary,
} from "./eta-prompt-framework";

/**
 * Example 1: Traffic Delay Interpretation Prompt
 *
 * This example shows how to build a prompt for interpreting traffic data
 * and its impact on a shipment's ETA.
 */
export function trafficDelayInterpretationExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "traffic_interpretation";
  const userRole: UserRole = "carrier";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    trafficData: {
      condition: "heavy",
      congestionLevel: 8,
      averageSpeed: 25,
      delayMinutes: 45,
      incidents: [
        {
          type: "accident",
          severity: "major",
          clearanceTime: 60,
        },
      ],
    },
    locationData: {
      latitude: 40.7128,
      longitude: -74.006,
      distanceToDestination: 120,
      timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    },
    routeData: {
      originalEta: Date.now() + 1000 * 60 * 120, // 2 hours from now
      currentEta: Date.now() + 1000 * 60 * 165, // 2 hours 45 minutes from now
      remainingDistance: 120,
      remainingDrivingTime: 165,
    },
    loadData: {
      id: "LOAD-12345",
      origin: "Philadelphia, PA",
      destination: "Boston, MA",
      scheduledDelivery: Date.now() + 1000 * 60 * 180, // 3 hours from now
      status: "in_transit",
    },
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return {
    title: "Traffic Delay Interpretation Prompt",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Example 2: Shipper Notification Generation Prompt
 *
 * This example shows how to build a prompt for generating a notification
 * about a shipment's status for a shipper.
 */
export function shipperNotificationGenerationExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "notification_generation";
  const userRole: UserRole = "shipper";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    trafficData: {
      condition: "moderate",
      congestionLevel: 6,
      averageSpeed: 45,
      delayMinutes: 25,
      incidents: [],
    },
    weatherData: {
      condition: "rain",
      temperature: 58,
      precipitation: 0.2,
      windSpeed: 12,
      visibility: 5,
      alerts: [],
    },
    locationData: {
      latitude: 33.749,
      longitude: -84.388,
      distanceToDestination: 45,
      timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
    },
    loadData: {
      id: "LOAD-67890",
      origin: "Atlanta, GA",
      destination: "Charlotte, NC",
      scheduledDelivery: Date.now() + 1000 * 60 * 90, // 1.5 hours from now
      status: "in_transit",
    },
    routeData: {
      originalEta: Date.now() + 1000 * 60 * 60, // 1 hour from now
      currentEta: Date.now() + 1000 * 60 * 85, // 1 hour 25 minutes from now
      remainingDistance: 45,
      remainingDrivingTime: 85,
    },
  };

  // Create a template and then customize it
  const template = createPromptTemplate(promptType);
  const prompt = customizePromptTemplate(template, userRole, sampleData, true);

  return {
    title: "Shipper Notification Generation Prompt",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Example 3: Delivery Pattern Analysis Prompt
 *
 * This example shows how to build a prompt for analyzing patterns
 * in historical delivery data to improve future operations.
 */
export function deliveryPatternAnalysisExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "pattern_recognition";
  const userRole: UserRole = "admin";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    historicalData: {
      avgDeliveryTime: 185,
      delayFrequency: 22,
      commonDelayCauses: [
        "dock congestion",
        "traffic on I-95",
        "weather delays",
        "driver breaks",
      ],
      // Additional historical data would be included here
      deliveryTimesByDayOfWeek: {
        monday: 205,
        tuesday: 175,
        wednesday: 180,
        thursday: 185,
        friday: 210,
        saturday: 165,
        sunday: 155,
      },
      deliveryTimesByTimeOfDay: {
        morning: 195,
        afternoon: 175,
        evening: 180,
        night: 160,
      },
      seasonalFactors: {
        winter: 1.15,
        spring: 1.05,
        summer: 1.0,
        fall: 1.1,
      },
    },
    loadData: {
      id: "PATTERN-ANALYSIS",
      origin: "Chicago, IL",
      destination: "Indianapolis, IN",
      scheduledDelivery: Date.now() + 1000 * 60 * 60 * 24, // 24 hours from now
      status: "scheduled",
    },
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return {
    title: "Delivery Pattern Analysis Prompt",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Example 4: Route Optimization Suggestion Prompt
 *
 * This example shows how to build a prompt for suggesting route
 * optimizations based on current conditions.
 */
export function routeOptimizationSuggestionExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "route_optimization";
  const userRole: UserRole = "driver";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    trafficData: {
      condition: "heavy",
      congestionLevel: 9,
      averageSpeed: 15,
      delayMinutes: 55,
      incidents: [
        {
          type: "construction",
          severity: "major",
          clearanceTime: 240, // 4 hours
        },
      ],
    },
    weatherData: {
      condition: "clear",
      temperature: 72,
      precipitation: 0,
      windSpeed: 5,
      visibility: 10,
      alerts: [],
    },
    locationData: {
      latitude: 37.7749,
      longitude: -122.4194,
      distanceToDestination: 85,
      timestamp: Date.now() - 1000 * 60 * 1, // 1 minute ago
    },
    vehicleData: {
      type: "semi-truck",
      avgSpeed: 55,
      status: "active",
      fuelLevel: 0.75,
      hoursOfServiceRemaining: 4.5,
    },
    loadData: {
      id: "LOAD-54321",
      origin: "San Francisco, CA",
      destination: "Sacramento, CA",
      scheduledDelivery: Date.now() + 1000 * 60 * 120, // 2 hours from now
      status: "in_transit",
    },
    routeData: {
      originalEta: Date.now() + 1000 * 60 * 90, // 1.5 hours from now
      currentEta: Date.now() + 1000 * 60 * 145, // 2 hours 25 minutes from now
      remainingDistance: 85,
      remainingDrivingTime: 145,
    },
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return {
    title: "Route Optimization Suggestion Prompt",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Example 5: Weather Impact Assessment Prompt
 *
 * This example shows how to build a prompt for assessing the impact
 * of weather conditions on a shipment.
 */
export function weatherImpactAssessmentExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "weather_impact";
  const userRole: UserRole = "carrier";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    weatherData: {
      condition: "snow",
      temperature: 28,
      precipitation: 0.5,
      windSpeed: 25,
      visibility: 2,
      alerts: [
        {
          type: "winter_storm_warning",
          description:
            "Heavy snow and blowing snow expected. Total snow accumulations of 6-10 inches.",
        },
      ],
    },
    locationData: {
      latitude: 41.8781,
      longitude: -87.6298,
      distanceToDestination: 220,
      timestamp: Date.now() - 1000 * 60 * 3, // 3 minutes ago
    },
    routeData: {
      originalEta: Date.now() + 1000 * 60 * 60 * 4, // 4 hours from now
      currentEta: Date.now() + 1000 * 60 * 60 * 6, // 6 hours from now
      remainingDistance: 220,
      remainingDrivingTime: 360,
    },
    loadData: {
      id: "LOAD-98765",
      origin: "Chicago, IL",
      destination: "Detroit, MI",
      scheduledDelivery: Date.now() + 1000 * 60 * 60 * 5, // 5 hours from now
      status: "in_transit",
    },
    vehicleData: {
      type: "semi-truck",
      avgSpeed: 55,
      status: "active",
      equipmentDetails: "Chains available",
    },
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return {
    title: "Weather Impact Assessment Prompt",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Example 6: ETA Prediction with Confidence Levels
 *
 * This example shows how to build a prompt for generating an ETA prediction
 * with appropriate confidence levels based on available data.
 */
export function etaPredictionWithConfidenceExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "eta_prediction";
  const userRole: UserRole = "shipper";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    trafficData: {
      condition: "moderate",
      congestionLevel: 5,
      averageSpeed: 50,
      delayMinutes: 15,
      incidents: [],
    },
    weatherData: {
      condition: "partly_cloudy",
      temperature: 65,
      precipitation: 0,
      windSpeed: 8,
      visibility: 10,
      alerts: [],
    },
    locationData: {
      latitude: 39.9526,
      longitude: -75.1652,
      distanceToDestination: 95,
      timestamp: Date.now() - 1000 * 60 * 4, // 4 minutes ago
    },
    historicalData: {
      avgDeliveryTime: 110,
      delayFrequency: 15,
      commonDelayCauses: ["traffic", "dock congestion"],
    },
    vehicleData: {
      type: "box truck",
      avgSpeed: 60,
      status: "active",
    },
    loadData: {
      id: "LOAD-24680",
      origin: "Philadelphia, PA",
      destination: "New York, NY",
      scheduledDelivery: Date.now() + 1000 * 60 * 120, // 2 hours from now
      status: "in_transit",
    },
    routeData: {
      originalEta: Date.now() + 1000 * 60 * 100, // 1 hour 40 minutes from now
      currentEta: Date.now() + 1000 * 60 * 115, // 1 hour 55 minutes from now
      remainingDistance: 95,
      remainingDrivingTime: 115,
    },
    etaData: {
      confidenceLevel: "medium",
      varianceMinutes: 15,
      historicalAccuracy: 0.85,
    },
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return {
    title: "ETA Prediction with Confidence Levels",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Example 7: Delay Analysis for Driver
 *
 * This example shows how to build a prompt for analyzing the causes of a delay
 * and providing actionable guidance to a driver.
 */
export function delayAnalysisForDriverExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "delay_analysis";
  const userRole: UserRole = "driver";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    trafficData: {
      condition: "severe",
      congestionLevel: 9,
      averageSpeed: 10,
      delayMinutes: 75,
      incidents: [
        {
          type: "multi_vehicle_accident",
          severity: "critical",
          clearanceTime: 120, // 2 hours
        },
      ],
    },
    weatherData: {
      condition: "rain",
      temperature: 55,
      precipitation: 0.8,
      windSpeed: 15,
      visibility: 4,
      alerts: [],
    },
    locationData: {
      latitude: 34.0522,
      longitude: -118.2437,
      distanceToDestination: 25,
      timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
    },
    vehicleData: {
      type: "semi-truck",
      avgSpeed: 55,
      status: "delayed",
      hoursOfServiceRemaining: 2.5,
    },
    loadData: {
      id: "LOAD-13579",
      origin: "San Diego, CA",
      destination: "Los Angeles, CA",
      scheduledDelivery: Date.now() - 1000 * 60 * 30, // 30 minutes ago (already late)
      status: "delayed",
    },
    routeData: {
      originalEta: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      currentEta: Date.now() + 1000 * 60 * 90, // 1 hour 30 minutes from now
      remainingDistance: 25,
      remainingDrivingTime: 90,
    },
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return {
    title: "Delay Analysis for Driver",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Example 8: Contextual Information for Admin
 *
 * This example shows how to build a prompt for providing comprehensive
 * contextual information about a shipment for an admin user.
 */
export function contextualInformationForAdminExample() {
  // Define the prompt type and user role
  const promptType: PromptType = "contextual_information";
  const userRole: UserRole = "admin";

  // Sample data that would come from real-time systems
  const sampleData: PromptDataSources = {
    trafficData: {
      condition: "light",
      congestionLevel: 3,
      averageSpeed: 65,
      delayMinutes: 5,
      incidents: [],
    },
    weatherData: {
      condition: "clear",
      temperature: 72,
      precipitation: 0,
      windSpeed: 6,
      visibility: 10,
      alerts: [],
    },
    locationData: {
      latitude: 32.7767,
      longitude: -96.797,
      distanceToDestination: 150,
      timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    },
    historicalData: {
      avgDeliveryTime: 180,
      delayFrequency: 12,
      commonDelayCauses: ["traffic", "dock congestion"],
      carrierPerformance: {
        onTimeDeliveryRate: 0.92,
        avgDelayMinutes: 22,
        safetyRating: "excellent",
      },
    },
    vehicleData: {
      type: "semi-truck",
      avgSpeed: 62,
      status: "active",
      maintenanceStatus: "good",
      lastInspection: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    },
    loadData: {
      id: "LOAD-97531",
      origin: "Dallas, TX",
      destination: "Oklahoma City, OK",
      scheduledDelivery: Date.now() + 1000 * 60 * 180, // 3 hours from now
      status: "in_transit",
      priority: "high",
      customer: "ABC Manufacturing",
      specialInstructions: "Requires liftgate for unloading",
    },
    routeData: {
      originalEta: Date.now() + 1000 * 60 * 165, // 2 hours 45 minutes from now
      currentEta: Date.now() + 1000 * 60 * 170, // 2 hours 50 minutes from now
      remainingDistance: 150,
      remainingDrivingTime: 170,
      plannedStops: [
        {
          location: "Rest Area I-35 Mile 72",
          estimatedArrival: Date.now() + 1000 * 60 * 60, // 1 hour from now
          duration: 30, // 30 minutes
        },
      ],
    },
  };

  // Build the complete prompt
  const prompt = buildPrompt(promptType, userRole, sampleData, true);

  return {
    title: "Contextual Information for Admin",
    promptType,
    userRole,
    data: sampleData,
    prompt,
  };
}

/**
 * Get all examples for documentation or testing
 */
export function getAllExamples() {
  return [
    trafficDelayInterpretationExample(),
    shipperNotificationGenerationExample(),
    deliveryPatternAnalysisExample(),
    routeOptimizationSuggestionExample(),
    weatherImpactAssessmentExample(),
    etaPredictionWithConfidenceExample(),
    delayAnalysisForDriverExample(),
    contextualInformationForAdminExample(),
  ];
}
