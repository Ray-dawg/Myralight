/**
 * Notification Prompt Engineering Framework
 *
 * This framework extends the ETA prompt framework to provide specialized
 * notification generation capabilities for different user roles and scenarios.
 */

import {
  UserRole,
  PromptType,
  PromptDataSources,
  UrgencyLevel,
} from "./eta-prompt-framework";

// Define notification-specific prompt types
export type NotificationPromptType =
  | "eta_update"
  | "delay_alert"
  | "geofence_entry"
  | "geofence_exit"
  | "approaching_destination"
  | "delivery_complete"
  | "document_required"
  | "weather_alert";

// Define notification channels
export type NotificationChannel = "sms" | "email" | "in_app" | "push";

// Define notification priority levels
export type NotificationPriority = "low" | "medium" | "high" | "critical";

// Define notification context data
export interface NotificationContext {
  userId: string;
  userRole: UserRole;
  loadId?: string;
  loadNumber?: string;
  originalEta?: Date;
  updatedEta?: Date;
  etaChangeMinutes?: number;
  etaChangePercent?: number;
  delayReason?: string;
  locationName?: string;
  distanceToDestination?: number;
  estimatedTimeOfArrival?: number;
  weatherCondition?: string;
  weatherSeverity?: string;
  documentType?: string;
  geofenceType?: string; // "pickup" or "delivery"
  dwellTime?: number;
  userPreferences?: {
    quietHoursStart?: string;
    quietHoursEnd?: string;
    preferredChannels?: NotificationChannel[];
    notificationTypes?: Record<string, boolean>;
  };
}

/**
 * Generate a notification-specific system role
 */
export function generateNotificationSystemRole(
  notificationType: NotificationPromptType,
  userRole: UserRole,
): string {
  const baseRoles = {
    eta_update:
      "You are a logistics communication specialist who creates clear, concise ETA update notifications. You translate complex logistics data into actionable information tailored to each recipient's role and needs.",
    delay_alert:
      "You are a delay communication expert who crafts informative, solution-oriented delay notifications. You balance transparency about problems with constructive next steps and avoid creating unnecessary alarm.",
    geofence_entry:
      "You are a location tracking specialist who creates precise, relevant notifications about vehicle arrivals at key locations. You focus on operational implications of arrivals for different stakeholders.",
    geofence_exit:
      "You are a logistics movement specialist who creates clear notifications about departures from key locations. You emphasize timing, next destinations, and operational implications.",
    approaching_destination:
      "You are a logistics coordination specialist who creates timely notifications about vehicles approaching destinations. You help recipients prepare for arrivals with the right level of detail for their role.",
    delivery_complete:
      "You are a delivery confirmation specialist who creates clear, positive notifications about completed deliveries. You include relevant completion details while maintaining a professional, appreciative tone.",
    document_required:
      "You are a documentation specialist who creates clear, actionable notifications about required documents. You emphasize urgency appropriately while providing specific instructions on what's needed.",
    weather_alert:
      "You are a safety communication specialist who creates informative weather alerts affecting transportation. You balance safety concerns with operational implications and provide clear guidance.",
  };

  // Add role-specific modifications
  const roleModifiers = {
    shipper:
      "You prioritize business impact information and delivery timing. Your tone is professional and focused on shipment status and any actions needed from the shipper's perspective.",
    carrier:
      "You focus on operational efficiency and fleet management implications. Your tone is practical and action-oriented, emphasizing information relevant to carrier operations.",
    driver:
      "You emphasize clear, concise driving instructions and immediate next steps. Your tone is direct and easy to understand while driving, focusing only on what the driver needs to know now.",
    admin:
      "You provide comprehensive system insights with appropriate detail. Your tone is analytical and thorough, highlighting exceptions and areas requiring administrative attention.",
  };

  return `${baseRoles[notificationType]} ${roleModifiers[userRole]}`;
}

/**
 * Generate notification content preamble
 */
export function generateNotificationPreamble(
  notificationType: NotificationPromptType,
): string {
  const preambles = {
    eta_update:
      "You are crafting a notification about an updated estimated time of arrival. The notification should clearly communicate the new ETA, how it differs from the previous estimate, and any relevant context about the change.",
    delay_alert:
      "You are crafting a notification about a delivery delay. The notification should explain the nature and cause of the delay, the impact on delivery timing, and any actions the recipient should consider taking.",
    geofence_entry:
      "You are crafting a notification about a vehicle arriving at a designated location. The notification should communicate the arrival clearly and include any relevant operational details based on the recipient's role.",
    geofence_exit:
      "You are crafting a notification about a vehicle departing from a designated location. The notification should communicate the departure clearly and include relevant next steps or destination information.",
    approaching_destination:
      "You are crafting a notification about a vehicle approaching its destination. The notification should help the recipient prepare for the upcoming arrival with appropriate lead time information.",
    delivery_complete:
      "You are crafting a notification about a completed delivery. The notification should confirm the successful delivery and include any relevant completion details or next steps.",
    document_required:
      "You are crafting a notification about required documentation. The notification should clearly state what documents are needed, why they're important, and how/when they should be provided.",
    weather_alert:
      "You are crafting a notification about weather conditions affecting a shipment. The notification should explain the weather situation, its potential impact, and any recommended precautions or actions.",
  };

  return preambles[notificationType];
}

/**
 * Format notification context data for the prompt
 */
export function formatNotificationContext(
  context: NotificationContext,
  notificationType: NotificationPromptType,
): string {
  let formattedContext =
    "Here is the relevant context for this notification:\n\n";

  // Add user information
  formattedContext += `USER INFORMATION:\n`;
  formattedContext += `- User role: ${context.userRole}\n`;

  if (context.userPreferences) {
    formattedContext += `- Preferred notification channels: ${context.userPreferences.preferredChannels?.join(", ") || "Not specified"}\n`;
    if (
      context.userPreferences.quietHoursStart &&
      context.userPreferences.quietHoursEnd
    ) {
      formattedContext += `- Quiet hours: ${context.userPreferences.quietHoursStart} to ${context.userPreferences.quietHoursEnd}\n`;
    }
  }
  formattedContext += "\n";

  // Add load information if available
  if (context.loadId || context.loadNumber) {
    formattedContext += "LOAD INFORMATION:\n";
    if (context.loadNumber)
      formattedContext += `- Load number: ${context.loadNumber}\n`;
    if (context.loadId) formattedContext += `- Load ID: ${context.loadId}\n`;
    formattedContext += "\n";
  }

  // Add ETA information for relevant notification types
  if (
    ["eta_update", "delay_alert", "approaching_destination"].includes(
      notificationType,
    )
  ) {
    formattedContext += "ETA INFORMATION:\n";
    if (context.originalEta)
      formattedContext += `- Original ETA: ${context.originalEta.toLocaleString()}\n`;
    if (context.updatedEta)
      formattedContext += `- Updated ETA: ${context.updatedEta.toLocaleString()}\n`;
    if (context.etaChangeMinutes) {
      const direction = context.etaChangeMinutes > 0 ? "later" : "earlier";
      formattedContext += `- ETA change: ${Math.abs(context.etaChangeMinutes)} minutes ${direction}\n`;
    }
    if (context.etaChangePercent) {
      formattedContext += `- ETA change percentage: ${context.etaChangePercent.toFixed(1)}%\n`;
    }
    if (context.delayReason)
      formattedContext += `- Reason for change: ${context.delayReason}\n`;
    formattedContext += "\n";
  }

  // Add location information for relevant notification types
  if (
    ["geofence_entry", "geofence_exit", "approaching_destination"].includes(
      notificationType,
    )
  ) {
    formattedContext += "LOCATION INFORMATION:\n";
    if (context.locationName)
      formattedContext += `- Location name: ${context.locationName}\n`;
    if (context.geofenceType)
      formattedContext += `- Location type: ${context.geofenceType}\n`;
    if (context.distanceToDestination)
      formattedContext += `- Distance to destination: ${context.distanceToDestination} miles\n`;
    if (context.estimatedTimeOfArrival)
      formattedContext += `- Estimated time of arrival: ${context.estimatedTimeOfArrival} minutes\n`;
    if (context.dwellTime)
      formattedContext += `- Time at location: ${context.dwellTime} minutes\n`;
    formattedContext += "\n";
  }

  // Add weather information for weather alerts
  if (notificationType === "weather_alert") {
    formattedContext += "WEATHER INFORMATION:\n";
    if (context.weatherCondition)
      formattedContext += `- Weather condition: ${context.weatherCondition}\n`;
    if (context.weatherSeverity)
      formattedContext += `- Severity: ${context.weatherSeverity}\n`;
    formattedContext += "\n";
  }

  // Add document information for document requests
  if (notificationType === "document_required") {
    formattedContext += "DOCUMENT INFORMATION:\n";
    if (context.documentType)
      formattedContext += `- Document type: ${context.documentType}\n`;
    formattedContext += "\n";
  }

  return formattedContext;
}

/**
 * Generate notification-specific output format instructions
 */
export function generateNotificationOutputFormat(
  channel: NotificationChannel,
): string {
  const formats = {
    sms: "Provide your response in the following format:\n\n1. MESSAGE: [SMS text limited to 160 characters]\n2. URGENCY: [Low/Medium/High/Critical]\n\nRemember that SMS messages should be extremely concise while including all critical information. Use abbreviations only if they are industry-standard and widely understood.",

    email:
      "Provide your response in the following format:\n\n1. SUBJECT: [Brief, informative email subject line]\n2. GREETING: [Appropriate salutation]\n3. BODY: [Email body text, professional but conversational]\n4. CALL TO ACTION: [Clear next steps if applicable]\n5. CLOSING: [Professional sign-off]\n6. URGENCY: [Low/Medium/High/Critical]\n\nEmail should be professional but conversational, with appropriate paragraph breaks for readability.",

    in_app:
      "Provide your response in the following format:\n\n1. TITLE: [Brief, informative notification title]\n2. BODY: [Concise notification text]\n3. URGENCY: [Low/Medium/High/Critical]\n4. ACTION BUTTON: [Optional button text and purpose]\n\nIn-app notifications should be concise but can include slightly more detail than SMS.",

    push: "Provide your response in the following format:\n\n1. TITLE: [Brief, attention-grabbing title under 50 characters]\n2. BODY: [Push notification text under 100 characters]\n3. URGENCY: [Low/Medium/High/Critical]\n4. DEEP LINK: [Suggested app screen to open]\n\nPush notifications must be extremely concise while compelling action when needed.",
  };

  return formats[channel];
}

/**
 * Generate notification-specific constraints
 */
export function generateNotificationConstraints(
  notificationType: NotificationPromptType,
  channel: NotificationChannel,
): string {
  // Channel-specific constraints
  const channelConstraints = {
    sms: "- Keep the message under 160 characters\n- Use clear, non-technical language\n- Include load number for reference\n- Avoid unnecessary pleasantries\n- Include only actionable information",

    email:
      "- Keep subject under 50 characters\n- Keep email body under 200 words\n- Use proper business email format\n- Include greeting and sign-off\n- Use paragraph breaks for readability\n- Include contact information for questions",

    in_app:
      "- Keep title under 60 characters\n- Keep body under 120 characters\n- Make the notification actionable when appropriate\n- Use visual hierarchy (title more prominent than body)\n- Consider including a timestamp",

    push: "- Keep title under 50 characters\n- Keep body under 100 characters\n- Front-load the most important information\n- Make the notification attention-grabbing but not alarming\n- Consider what screen the notification should link to",
  };

  // Notification type-specific constraints
  const typeConstraints = {
    eta_update:
      "- Clearly state the new ETA\n- Indicate how it differs from previous ETA\n- Provide context for the change if available\n- Avoid technical jargon about routing algorithms",

    delay_alert:
      "- Clearly state the nature of the delay\n- Provide the new expected timeline\n- Explain the cause without placing blame\n- Suggest next steps or mitigation when appropriate",

    geofence_entry:
      "- Clearly state which location was entered\n- Provide timestamp of entry\n- Include relevant next steps based on user role\n- For drivers, include check-in instructions if applicable",

    geofence_exit:
      "- Clearly state which location was exited\n- Provide timestamp of exit\n- Include next destination information if available\n- For shippers/receivers, include estimated arrival at next location",

    approaching_destination:
      "- Clearly state the approaching destination\n- Provide estimated time until arrival\n- Include preparation instructions based on user role\n- For facility staff, include any special handling requirements",

    delivery_complete:
      "- Clearly confirm delivery completion\n- Provide timestamp of completion\n- Include any next steps (e.g., document submission)\n- Express appropriate appreciation",

    document_required:
      "- Clearly state which document is needed\n- Explain why it's needed and the deadline\n- Provide instructions for submitting the document\n- Explain consequences of non-submission when appropriate",

    weather_alert:
      "- Clearly describe the weather condition\n- Explain how it affects the shipment\n- Provide safety recommendations when applicable\n- Include expected duration of weather condition if known",
  };

  return `Constraints:\n${channelConstraints[channel]}\n\n${typeConstraints[notificationType]}`;
}

/**
 * Generate examples of notifications
 */
export function generateNotificationExample(
  notificationType: NotificationPromptType,
  channel: NotificationChannel,
  userRole: UserRole,
): string {
  // SMS examples
  const smsExamples = {
    eta_update: {
      shipper:
        "Example:\n\nMESSAGE: TruckingSaaS: Load #12345 ETA updated to 3:45PM (30min later) due to traffic on I-95. No action needed. Track at app.truckingsaas.com/loads/12345\nURGENCY: Medium",
      carrier:
        "Example:\n\nMESSAGE: TruckingSaaS: Load #12345 ETA now 3:45PM (30min delay). Driver Smith encountering I-95 traffic. Dispatch notified. Details: app.truckingsaas.com/loads/12345\nURGENCY: Medium",
      driver:
        "Example:\n\nMESSAGE: TruckingSaaS: Your ETA for Load #12345 updated to 3:45PM due to current traffic. Receiver has been notified. Drive safely.\nURGENCY: Low",
      admin:
        "Example:\n\nMESSAGE: TruckingSaaS: Load #12345 ETA changed to 3:45PM (+30min). Cause: I-95 traffic congestion. 3 other active loads in same area. Details in admin portal.\nURGENCY: Low",
    },
    delay_alert: {
      shipper:
        "Example:\n\nMESSAGE: TruckingSaaS ALERT: Load #12345 delayed 2hrs due to accident on I-95. New ETA 5:30PM. We'll update as situation changes. Questions? Call 555-123-4567\nURGENCY: High",
      carrier:
        "Example:\n\nMESSAGE: TruckingSaaS ALERT: Load #12345 delayed 2hrs. Accident at mile marker 76 on I-95. Driver rerouting. Update dispatch with new route if needed.\nURGENCY: High",
      driver:
        "Example:\n\nMESSAGE: TruckingSaaS ALERT: Accident reported ahead on I-95. Take Exit 76 for alternate route. Adds ~2hrs to trip. Receiver notified of delay.\nURGENCY: High",
      admin:
        "Example:\n\nMESSAGE: TruckingSaaS ALERT: Major delay on Load #12345 (+2hrs). Accident on I-95. 3 other loads affected. Customers being notified. Monitor at admin.truckingsaas.com\nURGENCY: High",
    },
  };

  // Email examples
  const emailExamples = {
    eta_update: {
      shipper:
        "Example:\n\nSUBJECT: Updated ETA for Load #12345 - Now 3:45 PM\nGREETING: Hello Shipping Team,\nBODY: The estimated time of arrival for your Load #12345 has been updated to 3:45 PM today, which is approximately 30 minutes later than previously scheduled.\n\nThis adjustment is due to heavier than usual traffic conditions on I-95 near Baltimore. Our system is continuously monitoring the situation, and we'll notify you of any further changes.\n\nYou can view real-time tracking information for this shipment on your dashboard.\nCALL TO ACTION: No immediate action is required from your team.\nCLOSING: Thank you for your understanding,\nThe TruckingSaaS Team\nURGENCY: Medium",
      carrier:
        "Example:\n\nSUBJECT: Load #12345 ETA Update - 30 Minute Delay\nGREETING: Hello Dispatch Team,\nBODY: The ETA for Load #12345 (Driver: John Smith) has been updated to 3:45 PM, approximately 30 minutes later than scheduled.\n\nCause: Heavy traffic conditions on I-95 near Baltimore\nCurrent location: Mile marker 65, I-95 South\nSpeed: 25 mph in congested area\n\nOur system estimates the congestion will clear within the next 15-20 minutes. No alternate route is recommended at this time as all alternatives would result in longer delays.\nCALL TO ACTION: Please update your delivery schedule accordingly. If you need to communicate with the driver, use the in-app messaging feature.\nCLOSING: Thank you,\nTruckingSaaS Operations\nURGENCY: Medium",
    },
  };

  // In-app examples
  const inAppExamples = {
    eta_update: {
      shipper:
        "Example:\n\nTITLE: ETA Updated: Load #12345\nBODY: Delivery now expected at 3:45 PM (30 minutes later) due to traffic conditions on I-95.\nURGENCY: Medium\nACTION BUTTON: View Tracking Details",
      carrier:
        "Example:\n\nTITLE: ETA Change: Load #12345\nBODY: Driver John Smith now arriving at 3:45 PM (+30 min) due to I-95 traffic. Current speed: 25 mph.\nURGENCY: Medium\nACTION BUTTON: Contact Driver",
    },
    geofence_entry: {
      shipper:
        "Example:\n\nTITLE: Delivery Arrival: Load #12345\nBODY: Your shipment has arrived at ABC Distribution Center (2:15 PM).\nURGENCY: Medium\nACTION BUTTON: View Delivery Details",
      driver:
        "Example:\n\nTITLE: Arrived at Delivery Location\nBODY: Check-in required at main gate. Proceed to dock #7 after check-in.\nURGENCY: High\nACTION BUTTON: View Check-in Instructions",
    },
  };

  // Push examples
  const pushExamples = {
    eta_update: {
      shipper:
        "Example:\n\nTITLE: ETA Update: Load #12345\nBODY: Now arriving 3:45 PM (30 min delay) due to traffic.\nURGENCY: Medium\nDEEP LINK: LoadTrackingScreen",
      driver:
        "Example:\n\nTITLE: ETA Updated\nBODY: Your arrival time updated to 3:45 PM. Receiver notified.\nURGENCY: Low\nDEEP LINK: CurrentLoadScreen",
    },
    weather_alert: {
      driver:
        "Example:\n\nTITLE: Weather Alert: Heavy Snow Ahead\nBODY: Snowfall expected on I-80. Reduce speed, maintain safe distance.\nURGENCY: High\nDEEP LINK: WeatherMapScreen",
      carrier:
        "Example:\n\nTITLE: Weather Impact: 3 Active Loads\nBODY: Snow affecting I-80 corridor. 3 loads may experience delays.\nURGENCY: High\nDEEP LINK: FleetMapScreen",
    },
  };

  // Select the appropriate example based on channel, type and role
  let examples;
  switch (channel) {
    case "sms":
      examples = smsExamples;
      break;
    case "email":
      examples = emailExamples;
      break;
    case "in_app":
      examples = inAppExamples;
      break;
    case "push":
      examples = pushExamples;
      break;
  }

  // If we have an example for this notification type and role, return it
  if (
    examples &&
    examples[notificationType] &&
    examples[notificationType][userRole]
  ) {
    return examples[notificationType][userRole];
  }

  // Otherwise return a generic message
  return "Example not available for this specific combination of notification type, channel, and user role.";
}

/**
 * Build a complete notification prompt
 */
export function buildNotificationPrompt(
  notificationType: NotificationPromptType,
  channel: NotificationChannel,
  context: NotificationContext,
  includeExamples: boolean = true,
): string {
  // Get the standardized template components
  const systemRole = generateNotificationSystemRole(
    notificationType,
    context.userRole,
  );
  const preamble = generateNotificationPreamble(notificationType);
  const formattedContext = formatNotificationContext(context, notificationType);
  const outputFormat = generateNotificationOutputFormat(channel);
  const constraints = generateNotificationConstraints(
    notificationType,
    channel,
  );
  const example = includeExamples
    ? generateNotificationExample(notificationType, channel, context.userRole)
    : "";

  // Assemble the complete prompt
  let prompt = `${systemRole}\n\n${preamble}\n\n${formattedContext}\n\n${outputFormat}\n\n${constraints}`;

  if (includeExamples) {
    prompt += `\n\n${example}`;
  }

  return prompt;
}

/**
 * Determine the appropriate notification channel based on context
 */
export function determineNotificationChannel(
  context: NotificationContext,
  notificationType: NotificationPromptType,
  urgency: UrgencyLevel,
): NotificationChannel[] {
  const channels: NotificationChannel[] = [];

  // Always include in-app notifications
  channels.push("in_app");

  // Add push notifications for medium+ urgency
  if (urgency !== "low") {
    channels.push("push");
  }

  // Add SMS for high/critical urgency or specific notification types
  if (
    urgency === "high" ||
    urgency === "critical" ||
    notificationType === "delay_alert" ||
    notificationType === "document_required" ||
    notificationType === "weather_alert"
  ) {
    channels.push("sms");
  }

  // Add email for specific notification types or roles
  if (
    notificationType === "delivery_complete" ||
    notificationType === "document_required" ||
    context.userRole === "admin" ||
    context.userRole === "shipper"
  ) {
    channels.push("email");
  }

  // Override with user preferences if available
  if (
    context.userPreferences?.preferredChannels &&
    context.userPreferences.preferredChannels.length > 0
  ) {
    // Always keep in-app notifications
    return [
      "in_app",
      ...context.userPreferences.preferredChannels.filter(
        (c) => c !== "in_app",
      ),
    ];
  }

  return channels;
}

/**
 * Determine if a notification should be sent based on thresholds
 */
export function shouldSendNotification(
  notificationType: NotificationPromptType,
  context: NotificationContext,
): boolean {
  switch (notificationType) {
    case "eta_update":
      // Only notify if ETA changed by more than 10 minutes or 10%
      return (
        (context.etaChangeMinutes !== undefined &&
          Math.abs(context.etaChangeMinutes) >= 10) ||
        (context.etaChangePercent !== undefined &&
          Math.abs(context.etaChangePercent) >= 10)
      );

    case "approaching_destination":
      // Only notify if within 30 minutes of arrival
      return (
        context.estimatedTimeOfArrival !== undefined &&
        context.estimatedTimeOfArrival <= 30 &&
        context.estimatedTimeOfArrival > 0
      );

    case "delay_alert":
      // Always send delay alerts
      return true;

    case "geofence_entry":
    case "geofence_exit":
    case "delivery_complete":
    case "document_required":
    case "weather_alert":
      // Always send these notification types
      return true;

    default:
      return false;
  }
}

/**
 * Determine the urgency level of a notification
 */
export function determineUrgencyLevel(
  notificationType: NotificationPromptType,
  context: NotificationContext,
): UrgencyLevel {
  switch (notificationType) {
    case "delay_alert":
      // Determine based on delay magnitude
      if (context.etaChangeMinutes) {
        const absDelay = Math.abs(context.etaChangeMinutes);
        if (absDelay > 120) return "high";
        if (absDelay > 60) return "medium";
        return "low";
      }
      return "medium";

    case "weather_alert":
      // Based on weather severity
      if (context.weatherSeverity === "severe") return "critical";
      if (context.weatherSeverity === "moderate") return "high";
      return "medium";

    case "document_required":
      // Usually high priority
      return "high";

    case "geofence_entry":
    case "geofence_exit":
      // Medium priority for location updates
      return "medium";

    case "approaching_destination":
      // Higher priority as arrival gets closer
      if (
        context.estimatedTimeOfArrival &&
        context.estimatedTimeOfArrival <= 15
      ) {
        return "high";
      }
      return "medium";

    case "eta_update":
      // Based on magnitude of change
      if (context.etaChangeMinutes && Math.abs(context.etaChangeMinutes) > 60) {
        return "medium";
      }
      return "low";

    case "delivery_complete":
      // Usually low priority
      return "low";

    default:
      return "medium";
  }
}
