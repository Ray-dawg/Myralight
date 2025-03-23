/**
 * Validates a load request
 */
export function validateLoadRequest(data: any): string | null {
  // Check required fields
  if (!data.driver_id) {
    return "Driver ID is required";
  }

  if (data.current_lat === undefined || data.current_lng === undefined) {
    return "Current latitude and longitude are required";
  }

  // Validate latitude and longitude
  if (data.current_lat < -90 || data.current_lat > 90) {
    return "Invalid latitude value (must be between -90 and 90)";
  }

  if (data.current_lng < -180 || data.current_lng > 180) {
    return "Invalid longitude value (must be between -180 and 180)";
  }

  // Validate max_distance if provided
  if (
    data.max_distance !== undefined &&
    (isNaN(data.max_distance) || data.max_distance <= 0)
  ) {
    return "Max distance must be a positive number";
  }

  return null;
}

/**
 * Validates a load status update request
 */
export function validateLoadStatusUpdate(data: any): string | null {
  // Check required fields
  if (!data.load_id) {
    return "Load ID is required";
  }

  if (!data.status) {
    return "Status is required";
  }

  // Validate status
  const validStatuses = [
    "assigned",
    "in_transit",
    "delivered",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(data.status)) {
    return `Invalid status. Must be one of: ${validStatuses.join(", ")}`;
  }

  // Validate location if provided
  if (data.location) {
    if (
      data.location.latitude === undefined ||
      data.location.longitude === undefined
    ) {
      return "Location must include both latitude and longitude";
    }

    if (data.location.latitude < -90 || data.location.latitude > 90) {
      return "Invalid latitude value (must be between -90 and 90)";
    }

    if (data.location.longitude < -180 || data.location.longitude > 180) {
      return "Invalid longitude value (must be between -180 and 180)";
    }
  }

  return null;
}

/**
 * Validates a driver location update request
 */
export function validateDriverLocationUpdate(data: any): string | null {
  // Check required fields
  if (!data.driver_id) {
    return "Driver ID is required";
  }

  if (data.latitude === undefined || data.longitude === undefined) {
    return "Latitude and longitude are required";
  }

  // Validate latitude and longitude
  if (data.latitude < -90 || data.latitude > 90) {
    return "Invalid latitude value (must be between -90 and 90)";
  }

  if (data.longitude < -180 || data.longitude > 180) {
    return "Invalid longitude value (must be between -180 and 180)";
  }

  // Validate heading if provided
  if (
    data.heading !== undefined &&
    (isNaN(data.heading) || data.heading < 0 || data.heading > 360)
  ) {
    return "Invalid heading value (must be between 0 and 360)";
  }

  // Validate speed if provided
  if (data.speed !== undefined && (isNaN(data.speed) || data.speed < 0)) {
    return "Invalid speed value (must be a positive number)";
  }

  return null;
}

/**
 * Validates a load search request
 */
export function validateLoadSearch(data: any): string | null {
  // Validate status if provided
  if (data.status) {
    const validStatuses = [
      "draft",
      "posted",
      "assigned",
      "in_transit",
      "delivered",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(data.status)) {
      return `Invalid status. Must be one of: ${validStatuses.join(", ")}`;
    }
  }

  // Validate date range if provided
  if (data.date_from && data.date_to) {
    const dateFrom = new Date(data.date_from);
    const dateTo = new Date(data.date_to);

    if (isNaN(dateFrom.getTime())) {
      return "Invalid date_from format";
    }

    if (isNaN(dateTo.getTime())) {
      return "Invalid date_to format";
    }

    if (dateFrom > dateTo) {
      return "date_from must be before date_to";
    }
  }

  // Validate pagination parameters if provided
  if (data.page !== undefined) {
    const page = parseInt(data.page);
    if (isNaN(page) || page < 1) {
      return "Page must be a positive integer";
    }
  }

  if (data.limit !== undefined) {
    const limit = parseInt(data.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return "Limit must be between 1 and 100";
    }
  }

  return null;
}
