import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Hooks into load creation to record demand data and trigger aggregation
 * This function implements an efficient pipeline for real-time data processing
 * with optimized performance for high-volume scenarios
 * Enhanced with LLM-powered insights and ETA predictions
 */
export const hookIntoLoadCreation = mutation({
  args: {
    loadId: v.id("loads"),
    skipAggregation: v.optional(v.boolean()), // Option to skip aggregation for batch operations
    enableRealTimeUpdates: v.optional(v.boolean()), // Enable real-time updates to clients
    enableNotifications: v.optional(v.boolean()), // Enable demand notifications
    enableLLMInsights: v.optional(v.boolean()), // Enable LLM-powered insights
  },
  handler: async (ctx, args) => {
    // Record the demand data
    const demandDataResult = await recordLoadDemandData(ctx, {
      loadId: args.loadId,
    });

    // Skip aggregation if requested (for batch operations)
    if (args.skipAggregation) {
      // Even if skipping full aggregation, we still want to publish the real-time update
      if (args.enableRealTimeUpdates !== false) {
        await publishRealTimeHeatmapUpdate(ctx, args.loadId, demandDataResult);
      }
      return {
        success: true,
        aggregated: false,
        realTimeUpdated: args.enableRealTimeUpdates !== false,
      };
    }

    // Schedule aggregation (in a real system, this would be done by a scheduled job)
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    // Check if we've already aggregated data for today to avoid redundant processing
    const existingAggregation = await ctx.db
      .query("loadDemandAggregations")
      .withIndex("by_national_time", (q) =>
        q
          .eq("aggregationType", "national")
          .eq("timeframe", "daily")
          .eq("year", now.getFullYear())
          .eq("month", now.getMonth() + 1)
          .eq("day", now.getDate()),
      )
      .first();

    // Only aggregate if we haven't done so recently (within the last hour)
    const shouldAggregate =
      !existingAggregation ||
      existingAggregation.lastUpdated < now.getTime() - 3600000; // 1 hour

    if (shouldAggregate) {
      await aggregateDailyDemandData(ctx, {
        date: today,
      });
      
      // After aggregation, check if we should trigger notifications with LLM insights
      if (args.enableNotifications !== false) {
        try {
          // Import dynamically to avoid circular dependencies
          const { hookIntoDemandUpdates } = await import("./notifications");
          await hookIntoDemandUpdates(ctx, {
            loadId: args.loadId,
            enableNotifications: true,
            enableLLMInsights: args.enableLLMInsights !== false
          });
        } catch (error) {
          console.error("Error triggering demand notifications:", error);
          // Continue even if notifications fail
        }
      }
      
      return {
        success: true,
        aggregated: true,
        realTimeUpdated: args.enableRealTimeUpdates !== false,
      };
    }

    // Even if we don't need to aggregate, we still want to publish the real-time update
    if (args.enableRealTimeUpdates !== false) {
      await publishRealTimeHeatmapUpdate(ctx, args.loadId, demandDataResult);
    }
    
    // Check if we should trigger notifications with LLM insights
    if (args.enableNotifications !== false) {
      try {
        // Import dynamically to avoid circular dependencies
        const { hookIntoDemandUpdates } = await import("./notifications");
        await hookIntoDemandUpdates(ctx, {
          loadId: args.loadId,
          enableNotifications: true,
          enableLLMInsights: args.enableLLMInsights !== false
        });
      } catch (error) {
        console.error("Error triggering demand notifications:", error);
        // Continue even if notifications fail
      }
    }

    return {
      success: true,
      aggregated: false,
      realTimeUpdated: args.enableRealTimeUpdates !== false,
    };
  },
});

/**
 * Records load demand data when a load is created or updated
 * This function captures geographic and temporal data points for heatmap visualization
 * and implements efficient data storage strategies for real-time analytics
 */
export const recordLoadDemandData = mutation({
  args: {
    loadId: v.id("loads"),
    updateExisting: v.optional(v.boolean()), // Whether to update existing records
  },
  handler: async (ctx, args) => {
    // Get the load data
    const load = await ctx.db.get(args.loadId);
    if (!load) throw new Error("Load not found");

    // Get pickup location
    const pickupLocation = await ctx.db.get(load.pickupLocationId);
    if (!pickupLocation) throw new Error("Pickup location not found");

    // Get delivery location
    const deliveryLocation = await ctx.db.get(load.deliveryLocationId);
    if (!deliveryLocation) throw new Error("Delivery location not found");

    // Record demand data for both pickup and delivery locations
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    const hour = date.getHours();
    const weekNumber = Math.ceil(
      ((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
        new Date(year, 0, 1).getDay() +
        1) /
        7,
    );

    // Calculate pickup location demand data
    const pickupDemandData = {
      latitude: pickupLocation.latitude,
      longitude: pickupLocation.longitude,
      geohash: generateGeohash(
        pickupLocation.latitude,
        pickupLocation.longitude,
      ),
      region: pickupLocation.state,
      timestamp,
      timeframe: "hourly",
      year,
      month,
      day,
      hour,
      weekNumber,
      loadCount: 1,
      totalWeight: load.weight,
      avgRate: load.rate,
      equipmentTypes: [load.equipmentType],
      loadTypes: [load.loadType],
      isAggregated: false,
      sourceLoadIds: [args.loadId],
      createdAt: timestamp,
      updatedAt: timestamp,
      // New fields for enhanced analytics
      demandType: "pickup",
      cityName: pickupLocation.city,
      zipCode: pickupLocation.zipCode,
      hazmatRequired: load.hazmat,
      distanceToDelivery: calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude,
      ),
      commodityType: categorizeCommodity(load.commodity),
      urgencyScore: calculateUrgencyScore(
        load.pickupWindowStart,
        load.pickupWindowEnd,
      ),
      marketSegment: determineMarketSegment(load.commodity, load.weight),
      seasonalFactor: calculateSeasonalFactor(date),
    };

    // Record pickup location demand
    const pickupDemandId = await ctx.db.insert(
      "loadDemandData",
      pickupDemandData,
    );

    // Calculate delivery location demand data
    const deliveryDemandData = {
      latitude: deliveryLocation.latitude,
      longitude: deliveryLocation.longitude,
      geohash: generateGeohash(
        deliveryLocation.latitude,
        deliveryLocation.longitude,
      ),
      region: deliveryLocation.state,
      timestamp,
      timeframe: "hourly",
      year,
      month,
      day,
      hour,
      weekNumber,
      loadCount: 1,
      totalWeight: load.weight,
      avgRate: load.rate,
      equipmentTypes: [load.equipmentType],
      loadTypes: [load.loadType],
      isAggregated: false,
      sourceLoadIds: [args.loadId],
      createdAt: timestamp,
      updatedAt: timestamp,
      // New fields for enhanced analytics
      demandType: "delivery",
      cityName: deliveryLocation.city,
      zipCode: deliveryLocation.zipCode,
      hazmatRequired: load.hazmat,
      distanceToDelivery: 0, // It's the delivery point
      commodityType: categorizeCommodity(load.commodity),
      urgencyScore: calculateUrgencyScore(
        load.deliveryWindowStart,
        load.deliveryWindowEnd,
      ),
      marketSegment: determineMarketSegment(load.commodity, load.weight),
      seasonalFactor: calculateSeasonalFactor(date),
    };

    // Record delivery location demand
    const deliveryDemandId = await ctx.db.insert(
      "loadDemandData",
      deliveryDemandData,
    );

    // Calculate lane data
    const laneData = {
      originGeohash: generateGeohash(
        pickupLocation.latitude,
        pickupLocation.longitude,
        4, // Lower precision for lane analysis
      ),
      destinationGeohash: generateGeohash(
        deliveryLocation.latitude,
        deliveryLocation.longitude,
        4, // Lower precision for lane analysis
      ),
      originRegion: pickupLocation.state,
      destinationRegion: deliveryLocation.state,
      originCity: pickupLocation.city,
      destinationCity: deliveryLocation.city,
      timestamp,
      year,
      month,
      day,
      weekNumber,
      loadCount: 1,
      totalWeight: load.weight,
      avgRate: load.rate,
      distance: calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude,
      ),
      equipmentType: load.equipmentType,
      loadType: load.loadType,
      hazmat: load.hazmat,
      commodityType: categorizeCommodity(load.commodity),
      sourceLoadId: args.loadId,
      createdAt: timestamp,
      updatedAt: timestamp,
      ratePerMile: calculateRatePerMile(
        load.rate,
        calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude,
        ),
      ),
      transitTime: estimateTransitTime(
        calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude,
        ),
        load.loadType,
      ),
      seasonalFactor: calculateSeasonalFactor(date),
      marketDemandScore: calculateMarketDemandScore(pickupLocation.state, date),
    };

    // Record lane data (origin-destination pair)
    const laneDataId = await ctx.db.insert("loadLaneData", laneData);

    // Return all the created data for real-time updates
    return {
      success: true,
      pickupDemand: { id: pickupDemandId, ...pickupDemandData },
      deliveryDemand: { id: deliveryDemandId, ...deliveryDemandData },
      laneData: { id: laneDataId, ...laneData },
      load,
    };
  },
});

/**
 * Generates a geohash from latitude and longitude coordinates
 * This is an improved implementation with better precision and error handling
 *
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param precision - Geohash precision (1-12), higher values provide more precision
 * @returns A string geohash representation of the coordinates
 */
function generateGeohash(
  lat: number,
  lng: number,
  precision: number = 6,
): string {
  // Input validation
  if (isNaN(lat) || isNaN(lng)) {
    console.error("Invalid coordinates for geohash", { lat, lng });
    return "0"; // Return a default value for invalid inputs
  }

  // Constrain latitude and longitude to valid ranges
  lat = Math.max(-90, Math.min(90, lat));
  lng = Math.max(-180, Math.min(180, lng));

  // Base32 character map
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

  // Initialize the geohash calculation
  let geohash = "";
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let isEven = true;

  // Calculate geohash to the specified precision
  while (geohash.length < precision) {
    if (isEven) {
      // Process longitude
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        geohash += "1";
        lngRange[0] = mid;
      } else {
        geohash += "0";
        lngRange[1] = mid;
      }
    } else {
      // Process latitude
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        geohash += "1";
        latRange[0] = mid;
      } else {
        geohash += "0";
        latRange[1] = mid;
      }
    }
    isEven = !isEven;

    // Convert bits to base32 character every 5 bits
    if (geohash.length % 5 === 0) {
      let charIndex = 0;
      for (let i = 0; i < 5; i++) {
        charIndex =
          (charIndex << 1) | parseInt(geohash[geohash.length - 5 + i]);
      }
      geohash = geohash.substring(0, geohash.length - 5) + BASE32[charIndex];
    }
  }

  return geohash;
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 0.621371; // Convert to miles
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Helper function to categorize commodity
function categorizeCommodity(commodity: string): string {
  const commodityLower = commodity.toLowerCase();
  if (
    commodityLower.includes("food") ||
    commodityLower.includes("produce") ||
    commodityLower.includes("grocery")
  ) {
    return "food";
  } else if (
    commodityLower.includes("electronics") ||
    commodityLower.includes("computer")
  ) {
    return "electronics";
  } else if (
    commodityLower.includes("furniture") ||
    commodityLower.includes("household")
  ) {
    return "furniture";
  } else if (
    commodityLower.includes("auto") ||
    commodityLower.includes("car") ||
    commodityLower.includes("vehicle")
  ) {
    return "automotive";
  } else if (
    commodityLower.includes("construction") ||
    commodityLower.includes("building")
  ) {
    return "construction";
  } else {
    return "general";
  }
}

// Helper function to calculate urgency score based on time window
function calculateUrgencyScore(windowStart: number, windowEnd: number): number {
  const now = Date.now();
  const timeToStart = windowStart - now;
  const windowDuration = windowEnd - windowStart;

  if (timeToStart < 0) {
    // Past start time but still within window
    if (now < windowEnd) {
      const percentPassed = (now - windowStart) / windowDuration;
      // Urgency increases as we get closer to the end of the window
      return Math.min(10, 10 - 10 * (1 - percentPassed));
    }
    return 10; // Past start time, highest urgency
  }

  // Convert to hours
  const hoursToStart = timeToStart / (1000 * 60 * 60);

  // Consider window duration in urgency calculation
  // Shorter windows are more urgent
  const windowHours = windowDuration / (1000 * 60 * 60);
  const windowFactor = Math.max(0.8, Math.min(1.2, 24 / windowHours)); // Normalize around 24-hour window

  if (hoursToStart < 24) {
    return Math.min(10, 9 * windowFactor); // Less than 24 hours, very urgent
  } else if (hoursToStart < 48) {
    return Math.min(10, 8 * windowFactor); // 1-2 days, urgent
  } else if (hoursToStart < 72) {
    return Math.min(10, 7 * windowFactor); // 2-3 days
  } else if (hoursToStart < 120) {
    return Math.min(10, 6 * windowFactor); // 3-5 days
  } else if (hoursToStart < 168) {
    return Math.min(10, 5 * windowFactor); // 5-7 days
  } else {
    // Scale based on weeks, adjusted by window factor
    const baseScore = Math.max(
      1,
      Math.min(4, 10 - Math.floor(hoursToStart / 168)),
    );
    return Math.min(10, baseScore * windowFactor);
  }
}

// Helper function to determine market segment
function determineMarketSegment(commodity: string, weight: number): string {
  const commodityType = categorizeCommodity(commodity);

  if (weight > 40000) {
    return "heavy_freight";
  } else if (weight > 20000) {
    return "medium_freight";
  } else if (weight > 10000) {
    return "light_freight";
  } else if (commodityType === "food" && weight < 10000) {
    return "perishable_small";
  } else if (commodityType === "electronics") {
    return "high_value";
  } else {
    return "general_freight";
  }
}

// Helper function to calculate seasonal factor
function calculateSeasonalFactor(date: Date): number {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Holiday season (November-December)
  if (month === 11 || month === 12) {
    // Higher demand closer to holidays
    if (month === 12 && day > 15) {
      return 1.4; // Pre-Christmas surge
    }
    return 1.3;
  }

  // Summer peak (June-August)
  if (month >= 6 && month <= 8) {
    // July 4th period
    if (month === 7 && day >= 1 && day <= 7) {
      return 1.25;
    }
    return 1.2;
  }

  // Spring produce season (March-May)
  if (month >= 3 && month <= 5) {
    return 1.15;
  }

  // January slowdown
  if (month === 1) {
    return 0.9;
  }

  // February transition
  if (month === 2) {
    return 0.95;
  }

  // September back-to-school
  if (month === 9) {
    return 1.1;
  }

  // October pre-holiday buildup
  if (month === 10) {
    return 1.15;
  }

  // Default - normal season
  return 1.0;
}

// Helper function to calculate rate per mile
function calculateRatePerMile(
  rate: number | undefined,
  distance: number,
): number {
  if (!rate || !distance || distance === 0) {
    return 0;
  }
  return Math.round((rate / distance) * 100) / 100; // Round to 2 decimal places
}

// Helper function to estimate transit time in hours
function estimateTransitTime(distance: number, loadType: string): number {
  let avgSpeedMph = 55; // Default average speed

  if (loadType === "expedited") {
    avgSpeedMph = 65;
  } else if (loadType === "ltl") {
    avgSpeedMph = 45; // LTL typically makes multiple stops
  }

  const drivingHours = distance / avgSpeedMph;
  const restStops = Math.floor(drivingHours / 8); // Assume a rest stop every 8 hours
  const restHours = restStops * 10; // 10 hours of rest per stop (DOT regulations)

  return Math.ceil(drivingHours + restHours);
}

// Helper function to calculate market demand score with improved accuracy
function calculateMarketDemandScore(region: string, date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0-6, where 0 is Sunday
  const seasonalFactor = calculateSeasonalFactor(date);
  const hour = date.getHours();

  // Enhanced region factors based on historical data analysis
  const regionFactors: Record<string, number> = {
    CA: 1.3,
    TX: 1.2,
    FL: 1.15,
    NY: 1.25,
    IL: 1.1,
    GA: 1.18,
    PA: 1.05,
    OH: 1.08,
    MI: 1.02,
    NC: 1.12,
    // Default for other states
  };

  // Day of week factors (mid-week typically has higher demand)
  const dayOfWeekFactors: Record<number, number> = {
    0: 0.85, // Sunday
    1: 1.1, // Monday
    2: 1.15, // Tuesday
    3: 1.2, // Wednesday
    4: 1.15, // Thursday
    5: 1.05, // Friday
    6: 0.8, // Saturday
  };

  // Time of day factors (business hours have higher demand)
  const hourFactors: Record<number, number> = {
    0: 0.6, // 12 AM
    1: 0.5,
    2: 0.4,
    3: 0.3,
    4: 0.4,
    5: 0.5,
    6: 0.7,
    7: 0.9,
    8: 1.1, // 8 AM
    9: 1.2,
    10: 1.3,
    11: 1.3,
    12: 1.2, // 12 PM
    13: 1.3,
    14: 1.3,
    15: 1.2,
    16: 1.1,
    17: 1.0, // 5 PM
    18: 0.9,
    19: 0.8,
    20: 0.7,
    21: 0.7,
    22: 0.6,
    23: 0.6, // 11 PM
  };

  const regionFactor = regionFactors[region] || 1.0;
  const dayFactor = dayOfWeekFactors[dayOfWeek] || 1.0;
  const hourFactor = hourFactors[hour] || 1.0;

  // Calculate base score out of 10
  let baseScore = 5; // Average demand

  // Adjust based on region, season, day of week, and time of day
  baseScore *= regionFactor;
  baseScore *= seasonalFactor;
  baseScore *= dayFactor;
  baseScore *= hourFactor;

  // Add a small random factor to simulate real-world variability (±5%)
  const randomFactor = 0.95 + Math.random() * 0.1;
  baseScore *= randomFactor;

  // Cap at 10
  return Math.min(10, Math.round(baseScore * 10) / 10);
}

/**
 * Aggregates hourly data into daily summaries with optimized performance
 * This function processes raw load demand data points and creates aggregated views
 * for efficient heatmap rendering and analytics
 */
export const aggregateDailyDemandData = mutation({
  args: {
    date: v.optional(v.number()), // Optional specific date to aggregate
    forceRefresh: v.optional(v.boolean()), // Force recalculation even if aggregation exists
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const targetDate = args.date || now;
    const date = new Date(targetDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Get all hourly data for the specified day
    const hourlyData = await ctx.db
      .query("loadDemandData")
      .withIndex("by_timeframe_date", (q) =>
        q
          .eq("timeframe", "hourly")
          .eq("year", year)
          .eq("month", month)
          .eq("day", day),
      )
      .collect();

    // Group by geohash
    const geohashGroups: Record<string, typeof hourlyData> = {};
    for (const data of hourlyData) {
      if (!geohashGroups[data.geohash]) {
        geohashGroups[data.geohash] = [];
      }
      geohashGroups[data.geohash].push(data);
    }

    // Aggregate by geohash
    for (const [geohash, dataPoints] of Object.entries(geohashGroups)) {
      if (dataPoints.length === 0) continue;

      const firstPoint = dataPoints[0];
      let totalLoads = 0;
      let totalWeight = 0;
      let totalRate = 0;
      let totalUrgencyScore = 0;
      let totalMarketDemandScore = 0;
      let totalSeasonalFactor = 0;
      const equipmentCounts: Record<string, number> = {};
      const loadTypeCounts: Record<string, number> = {};
      const commodityTypeCounts: Record<string, number> = {};
      const hazmatCounts = { true: 0, false: 0 };
      const demandTypeCounts = { pickup: 0, delivery: 0 };

      for (const point of dataPoints) {
        totalLoads += point.loadCount;
        totalWeight += point.totalWeight || 0;
        totalRate += (point.avgRate || 0) * point.loadCount;
        totalUrgencyScore += point.urgencyScore || 0;
        totalMarketDemandScore += point.marketDemandScore || 0;
        totalSeasonalFactor += point.seasonalFactor || 0;

        // Count equipment types
        if (point.equipmentTypes) {
          for (const type of point.equipmentTypes) {
            equipmentCounts[type] = (equipmentCounts[type] || 0) + 1;
          }
        }

        // Count load types
        if (point.loadTypes) {
          for (const type of point.loadTypes) {
            loadTypeCounts[type] = (loadTypeCounts[type] || 0) + 1;
          }
        }

        // Count commodity types
        if (point.commodityType) {
          commodityTypeCounts[point.commodityType] =
            (commodityTypeCounts[point.commodityType] || 0) + 1;
        }

        // Count hazmat loads
        if (point.hazmatRequired !== undefined) {
          hazmatCounts[point.hazmatRequired ? "true" : "false"] += 1;
        }

        // Count demand types
        if (point.demandType) {
          demandTypeCounts[point.demandType as "pickup" | "delivery"] += 1;
        }
      }

      // Calculate averages
      const avgRate = totalLoads > 0 ? totalRate / totalLoads : 0;
      const avgUrgencyScore =
        totalLoads > 0 ? totalUrgencyScore / totalLoads : 0;
      const avgMarketDemandScore =
        totalLoads > 0 ? totalMarketDemandScore / totalLoads : 0;
      const avgSeasonalFactor =
        totalLoads > 0 ? totalSeasonalFactor / totalLoads : 0;

      // Check if an aggregation already exists for this geohash and day
      const existingAgg = await ctx.db
        .query("loadDemandAggregations")
        .withIndex("by_geohash_time", (q) =>
          q
            .eq("aggregationType", "geohash")
            .eq("geohash", geohash)
            .eq("timeframe", "daily")
            .eq("year", year)
            .eq("month", month)
            .eq("day", day),
        )
        .first();

      if (existingAgg) {
        // Update existing aggregation
        await ctx.db.patch(existingAgg._id, {
          totalLoads,
          totalWeight,
          avgRate,
          equipmentBreakdown: equipmentCounts,
          loadTypeBreakdown: loadTypeCounts,
          commodityTypeBreakdown: commodityTypeCounts,
          hazmatBreakdown: hazmatCounts,
          demandTypeBreakdown: demandTypeCounts,
          avgUrgencyScore,
          avgMarketDemandScore,
          avgSeasonalFactor,
          lastUpdated: now,
          dataPoints: dataPoints.length,
        });
      } else {
        // Create new aggregation
        await ctx.db.insert("loadDemandAggregations", {
          aggregationType: "geohash",
          geohash,
          regionId: firstPoint.region,
          cityName: firstPoint.cityName,
          zipCode: firstPoint.zipCode,
          timeframe: "daily",
          year,
          month,
          day,
          totalLoads,
          totalWeight,
          avgRate,
          equipmentBreakdown: equipmentCounts,
          loadTypeBreakdown: loadTypeCounts,
          commodityTypeBreakdown: commodityTypeCounts,
          hazmatBreakdown: hazmatCounts,
          demandTypeBreakdown: demandTypeCounts,
          avgUrgencyScore,
          avgMarketDemandScore,
          avgSeasonalFactor,
          lastUpdated: now,
          dataPoints: dataPoints.length,
          latitude: firstPoint.latitude,
          longitude: firstPoint.longitude,
        });
      }
    }

    // Also aggregate by region
    const regionGroups: Record<string, typeof hourlyData> = {};
    for (const data of hourlyData) {
      if (!data.region) continue;
      if (!regionGroups[data.region]) {
        regionGroups[data.region] = [];
      }
      regionGroups[data.region].push(data);
    }

    // Aggregate by region
    for (const [region, dataPoints] of Object.entries(regionGroups)) {
      if (dataPoints.length === 0) continue;

      let totalLoads = 0;
      let totalWeight = 0;
      let totalRate = 0;
      let totalUrgencyScore = 0;
      let totalMarketDemandScore = 0;
      let totalSeasonalFactor = 0;
      const equipmentCounts: Record<string, number> = {};
      const loadTypeCounts: Record<string, number> = {};
      const commodityTypeCounts: Record<string, number> = {};
      const hazmatCounts = { true: 0, false: 0 };
      const demandTypeCounts = { pickup: 0, delivery: 0 };
      const cityBreakdown: Record<string, number> = {};

      for (const point of dataPoints) {
        totalLoads += point.loadCount;
        totalWeight += point.totalWeight || 0;
        totalRate += (point.avgRate || 0) * point.loadCount;
        totalUrgencyScore += point.urgencyScore || 0;
        totalMarketDemandScore += point.marketDemandScore || 0;
        totalSeasonalFactor += point.seasonalFactor || 0;

        // Count equipment types
        if (point.equipmentTypes) {
          for (const type of point.equipmentTypes) {
            equipmentCounts[type] = (equipmentCounts[type] || 0) + 1;
          }
        }

        // Count load types
        if (point.loadTypes) {
          for (const type of point.loadTypes) {
            loadTypeCounts[type] = (loadTypeCounts[type] || 0) + 1;
          }
