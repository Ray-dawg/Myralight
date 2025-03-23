/**
 * ETA & Delivery Time Prediction System
 * Data Pipeline Architecture
 *
 * This module defines the comprehensive data pipeline for collecting, processing,
 * and preparing data from multiple sources for LLM-enhanced ETA predictions.
 */

import axios from "axios";
import { logger } from "../../api/utils/logger";
import { MAPBOX_ACCESS_TOKEN } from "../mapbox";
import { HereFleetService } from "../../api/services/here-fleet.service";
import { RouteOptimizationService, RouteResponse } from "../../api/services/route-optimization.service";

// Define data source types
export type DataSourceType = 
  | "driver_location"
  | "here_fleet"
  | "mapbox_directions"
  | "historical_data"
  | "weather_data"
  | "traffic_data"
  | "special_events";

// Define data collection frequency
export type CollectionFrequency = 
  | "realtime"
  | "minute"
  | "five_minutes"
  | "fifteen_minutes"
  | "hourly"
  | "daily";

// Define data source configuration
export interface DataSourceConfig {
  type: DataSourceType;
  endpoint?: string;
  apiKey?: string;
  frequency: CollectionFrequency;
  timeout: number; // in milliseconds
  retryCount: number;
  cacheExpiry: number; // in milliseconds
  fallbackStrategy: FallbackStrategy;
  transformationFunction?: (data: any) => any;
  validationRules?: ValidationRule[];
}

// Define fallback strategies
export type FallbackStrategy = 
  | "use_cached"
  | "use_alternative_source"
  | "use_historical_average"
  | "skip_source";

// Define validation rule
export interface ValidationRule {
  field: string;
  rule: "required" | "min" | "max" | "range" | "format" | "custom";
  value?: any;
  customValidator?: (value: any) => boolean;
  errorMessage: string;
}

// Define pipeline stage
export interface PipelineStage {
  name: string;
  description: string;
  inputSources: DataSourceType[];
  processingFunction: (data: Record<DataSourceType, any>) => any;
  outputFormat: any;
  errorHandler: (error: Error, data?: any) => any;
}

// Define data quality metrics
export interface DataQualityMetrics {
  completeness: number; // 0-1 representing percentage of required fields
  accuracy: number; // 0-1 representing confidence in data accuracy
  timeliness: number; // 0-1 representing how recent the data is
  consistency: number; // 0-1 representing internal data consistency
}

// Define pipeline execution result
export interface PipelineExecutionResult {
  success: boolean;
  data?: any;
  error?: Error;
  metrics: {
    executionTimeMs: number;
    dataQuality: DataQualityMetrics;
    sourcesUsed: DataSourceType[];
    fallbacksTriggered: DataSourceType[];
  };
  timestamp: Date;
}

/**
 * ETA Data Pipeline Manager
 * 
 * Manages the entire data pipeline process from collection to LLM preparation
 */
export class ETADataPipeline {
  private static instance: ETADataPipeline;
  private dataSources: Map<DataSourceType, DataSourceConfig>;
  private pipelineStages: PipelineStage[];
  private cache: Map<string, { data: any; timestamp: number }>;
  private hereFleetService: HereFleetService;
  private routeOptimizationService: RouteOptimizationService;

  private constructor() {
    this.dataSources = new Map();
    this.pipelineStages = [];
    this.cache = new Map();
    this.hereFleetService = HereFleetService.getInstance();
    this.routeOptimizationService = new RouteOptimizationService();
    
    // Initialize with default data sources
    this.initializeDefaultDataSources();
    
    // Initialize pipeline stages
    this.initializePipelineStages();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ETADataPipeline {
    if (!ETADataPipeline.instance) {
      ETADataPipeline.instance = new ETADataPipeline();
    }
    return ETADataPipeline.instance;
  }

  /**
   * Initialize default data sources
   */
  private initializeDefaultDataSources(): void {
    // Driver location data source
    this.dataSources.set("driver_location", {
      type: "driver_location",
      frequency: "minute",
      timeout: 5000,
      retryCount: 3,
      cacheExpiry: 60000, // 1 minute
      fallbackStrategy: "use_cached",
      validationRules: [
        {
          field: "latitude",
          rule: "required",
          errorMessage: "Driver latitude is required"
        },
        {
          field: "longitude",
          rule: "required",
          errorMessage: "Driver longitude is required"
        },
        {
          field: "timestamp",
          rule: "required",
          errorMessage: "Location timestamp is required"
        }
      ]
    });

    // HERE Fleet API data source
    this.dataSources.set("here_fleet", {
      type: "here_fleet",
      frequency: "five_minutes",
      timeout: 10000,
      retryCount: 3,
      cacheExpiry: 300000, // 5 minutes
      fallbackStrategy: "use_alternative_source",
      validationRules: [
        {
          field: "route",
          rule: "required",
          errorMessage: "Route data is required from HERE Fleet API"
        },
        {
          field: "eta",
          rule: "required",
          errorMessage: "ETA is required from HERE Fleet API"
        }
      ]
    });

    // Mapbox Directions API data source
    this.dataSources.set("mapbox_directions", {
      type: "mapbox_directions",
      endpoint: `https://api.mapbox.com/directions/v5/mapbox/driving/`,
      apiKey: MAPBOX_ACCESS_TOKEN,
      frequency: "five_minutes",
      timeout: 10000,
      retryCount: 3,
      cacheExpiry: 300000, // 5 minutes
      fallbackStrategy: "use_alternative_source",
      transformationFunction: this.transformMapboxData.bind(this),
      validationRules: [
        {
          field: "routes",
          rule: "required",
          errorMessage: "Routes array is required from Mapbox API"
        },
        {
          field: "routes.0.duration",
          rule: "required",
          errorMessage: "Duration is required from Mapbox API"
        }
      ]
    });

    // Weather data source
    this.dataSources.set("weather_data", {
      type: "weather_data",
      endpoint: "https://api.openweathermap.org/data/2.5/weather",
      frequency: "hourly",
      timeout: 8000,
      retryCount: 2,
      cacheExpiry: 3600000, // 1 hour
      fallbackStrategy: "use_cached",
      transformationFunction: this.transformWeatherData.bind(this),
      validationRules: [
        {
          field: "weather",
          rule: "required",
          errorMessage: "Weather data is required"
        },
        {
          field: "main.temp",
          rule: "required",
          errorMessage: "Temperature is required"
        }
      ]
    });

    // Historical data source
    this.dataSources.set("historical_data", {
      type: "historical_data",
      frequency: "daily",
      timeout: 15000,
      retryCount: 2,
      cacheExpiry: 86400000, // 24 hours
      fallbackStrategy: "skip_source",
      validationRules: [
        {
          field: "averageDeliveryTime",
          rule: "required",
          errorMessage: "Average delivery time is required"
        },
        {
          field: "commonDelayFactors",
          rule: "required",
          errorMessage: "Common delay factors are required"
        }
      ]
    });

    // Traffic data source
    this.dataSources.set("traffic_data", {
      type: "traffic_data",
      frequency: "fifteen_minutes",
      timeout: 10000,
      retryCount: 3,
      cacheExpiry: 900000, // 15 minutes
      fallbackStrategy: "use_cached",
      validationRules: [
        {
          field: "congestionLevel",
          rule: "required",
          errorMessage: "Congestion level is required"
        }
      ]
    });

    // Special events data source
    this.dataSources.set("special_events", {
      type: "special_events",
      frequency: "daily",
      timeout: 10000,
      retryCount: 2,
      cacheExpiry: 86400000, // 24 hours
      fallbackStrategy: "skip_source",
      validationRules: [
        {
          field: "events",
          rule: "required",
          errorMessage: "Events array is required"
        }
      ]
    });
  }

  /**
   * Initialize pipeline stages
   */
  private initializePipelineStages(): void {
    // Stage 1: Data Collection
    this.pipelineStages.push({
      name: "data_collection",
      description: "Collect raw data from all configured sources",
      inputSources: [
        "driver_location", 
        "here_fleet", 
        "mapbox_directions", 
        "weather_data", 
        "traffic_data", 
        "special_events", 
        "historical_data"
      ],
      processingFunction: this.collectData.bind(this),
      outputFormat: {
        collectedData: "Record<DataSourceType, any>",
        collectionTimestamp: "Date",
        sourcesCollected: "DataSourceType[]",
        sourcesFailed: "DataSourceType[]"
      },
      errorHandler: this.handleDataCollectionError.bind(this)
    });

    // Stage 2: Data Validation
    this.pipelineStages.push({
      name: "data_validation",
      description: "Validate collected data against defined rules",
      inputSources: [
        "driver_location", 
        "here_fleet", 
        "mapbox_directions", 
        "weather_data", 
        "traffic_data", 
        "special_events", 
        "historical_data"
      ],
      processingFunction: this.validateData.bind(this),
      outputFormat: {
        validatedData: "Record<DataSourceType, any>",
        validationResults: "Record<DataSourceType, { valid: boolean, errors: string[] }>",
        dataQualityMetrics: "DataQualityMetrics"
      },
      errorHandler: this.handleDataValidationError.bind(this)
    });

    // Stage 3: Data Transformation
    this.pipelineStages.push({
      name: "data_transformation",
      description: "Transform and normalize data into a consistent format",
      inputSources: [
        "driver_location", 
        "here_fleet", 
        "mapbox_directions", 
        "weather_data", 
        "traffic_data", 
        "special_events", 
        "historical_data"
      ],
      processingFunction: this.transformData.bind(this),
      outputFormat: {
        transformedData: "{
          locationData: { latitude: number, longitude: number, timestamp: number, speed: number, heading: number },
          routeData: { distance: number, duration: number, geometry: any, trafficLevel: string },
          weatherData: { condition: string, temperature: number, precipitation: number, windSpeed: number, alerts: any[] },
          trafficData: { congestionLevel: number, incidents: any[], averageSpeed: number },
          historicalData: { avgDeliveryTime: number, delayFrequency: number, commonDelayCauses: string[] },
          specialEvents: { events: any[] }
        }"
      },
      errorHandler: this.handleDataTransformationError.bind(this)
    });

    // Stage 4: Data Enrichment
    this.pipelineStages.push({
      name: "data_enrichment",
      description: "Enrich data with additional context and derived features",
      inputSources: [
        "driver_location", 
        "here_fleet", 
        "mapbox_directions", 
        "weather_data", 
        "traffic_data", 
        "special_events", 
        "historical_data"
      ],
      processingFunction: this.enrichData.bind(this),
      outputFormat: {
        enrichedData: "{
          ...transformedData,
          derivedFeatures: {
            weatherImpact: { severity: string, estimatedDelayMinutes: number },
            trafficImpact: { severity: string, estimatedDelayMinutes: number },
            historicalPatterns: { dayOfWeekFactor: number, timeOfDayFactor: number, seasonalFactor: number },
            combinedRiskFactors: { total: number, breakdown: Record<string, number> }
          }
        }"
      },
      errorHandler: this.handleDataEnrichmentError.bind(this)
    });

    // Stage 5: LLM Input Preparation
    this.pipelineStages.push({
      name: "llm_input_preparation",
      description: "Format data for LLM consumption",
      inputSources: [
        "driver_location", 
        "here_fleet", 
        "mapbox_directions", 
        "weather_data", 
        "traffic_data", 
        "special_events", 
        "historical_data"
      ],
      processingFunction: this.prepareLLMInput.bind(this),
      outputFormat: {
        llmInput: "{
          promptType: string,
          userRole: string,
          data: {
            trafficData: any,
            weatherData: any,
            locationData: any,
            historicalData: any,
            vehicleData: any,
            loadData: any,
            routeData: any
          }
        }"
      },
      errorHandler: this.handleLLMPreparationError.bind(this)
    });
  }

  /**
   * Execute the entire pipeline
   * @param driverId Driver ID
   * @param loadId Load ID
   * @param promptType Type of prompt to generate
   * @param userRole User role for context
   */
  public async executePipeline(
    driverId: string,
    loadId: string,
    promptType: string,
    userRole: string
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    const sourcesUsed: DataSourceType[] = [];
    const fallbacksTriggered: DataSourceType[] = [];
    let currentData: any = { driverId, loadId, promptType, userRole };
    
    try {
      // Execute each pipeline stage in sequence
      for (const stage of this.pipelineStages) {
        logger.info(`Executing pipeline stage: ${stage.name}`);
        
        try {
          // Process current stage
          const stageResult = await Promise.resolve(stage.processingFunction(currentData));
          
          // Update current data for next stage
          currentData = { ...currentData, ...stageResult };
          
          // Track sources used
          if (stageResult.sourcesCollected) {
            sourcesUsed.push(...stageResult.sourcesCollected);
          }
          
          // Track fallbacks triggered
          if (stageResult.fallbacksTriggered) {
            fallbacksTriggered.push(...stageResult.fallbacksTriggered);
          }
          
          logger.info(`Completed pipeline stage: ${stage.name}`);
        } catch (error) {
          logger.error(`Error in pipeline stage ${stage.name}:`, error);
          
          // Handle stage error
          const errorResult = stage.errorHandler(error as Error, currentData);
          currentData = { ...currentData, ...errorResult };
          
          // If the error is fatal, break the pipeline
          if (errorResult.fatal) {
            throw new Error(`Fatal error in pipeline stage ${stage.name}: ${error.message}`);
          }
        }
      }
      
      // Calculate data quality metrics
      const dataQuality = this.calculateDataQualityMetrics(currentData);
      
      // Return successful result
      return {
        success: true,
        data: currentData.llmInput,
        metrics: {
          executionTimeMs: Date.now() - startTime,
          dataQuality,
          sourcesUsed: [...new Set(sourcesUsed)],
          fallbacksTriggered: [...new Set(fallbacksTriggered)]
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error("Pipeline execution failed:", error);
      
      // Return error result
      return {
        success: false,
        error: error as Error,
        metrics: {
          executionTimeMs: Date.now() - startTime,
          dataQuality: {
            completeness: 0,
            accuracy: 0,
            timeliness: 0,
            consistency: 0
          },
          sourcesUsed: [...new Set(sourcesUsed)],
          fallbacksTriggered: [...new Set(fallbacksTriggered)]
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Stage 1: Collect data from all sources
   */
  private async collectData(context: any): Promise<any> {
    logger.info(`Collecting data for driver ${context.driverId} and load ${context.loadId}`);
    
    const collectedData: Record<DataSourceType, any> = {} as Record<DataSourceType, any>;
    const sourcesCollected: DataSourceType[] = [];
    const sourcesFailed: DataSourceType[] = [];
    const fallbacksTriggered: DataSourceType[] = [];
    
    // Collect data from each source in parallel
    const collectionPromises = Array.from(this.dataSources.entries()).map(async ([sourceType, config]) => {
      try {
        // Check cache first
        const cacheKey = `${sourceType}_${context.driverId}_${context.loadId}`;
        const cachedData = this.getFromCache(cacheKey);
        
        if (cachedData) {
          logger.info(`Using cached data for ${sourceType}`);
          collectedData[sourceType] = cachedData;
          sourcesCollected.push(sourceType);
          return;
        }
        
        // Collect fresh data
        const data = await this.collectFromSource(sourceType, config, context);
        
        // Store in cache
        this.storeInCache(cacheKey, data, config.cacheExpiry);
        
        collectedData[sourceType] = data;
        sourcesCollected.push(sourceType);
      } catch (error) {
        logger.error(`Error collecting data from ${sourceType}:`, error);
        sourcesFailed.push(sourceType);
        
        // Apply fallback strategy
        const fallbackData = await this.applyFallbackStrategy(sourceType, config, context, error as Error);
        
        if (fallbackData) {
          collectedData[sourceType] = fallbackData;
          fallbacksTriggered.push(sourceType);
        }
      }
    });
    
    await Promise.all(collectionPromises);
    
    return {
      collectedData,
      collectionTimestamp: new Date(),
      sourcesCollected,
      sourcesFailed,
      fallbacksTriggered
    };
  }

  /**
   * Collect data from a specific source
   */
  private async collectFromSource(
    sourceType: DataSourceType,
    config: DataSourceConfig,
    context: any
  ): Promise<any> {
    switch (sourceType) {
      case "driver_location":
        return this.collectDriverLocation(context.driverId);
        
      case "here_fleet":
        return this.collectHereFleetData(context.driverId);
        
      case "mapbox_directions":
        return this.collectMapboxDirectionsData(context);
        
      case "weather_data":
        return this.collectWeatherData(context);
        
      case "historical_data":
        return this.collectHistoricalData(context.loadId);
        
      case "traffic_data":
        return this.collectTrafficData(context);
        
      case "special_events":
        return this.collectSpecialEventsData(context);
        
      default:
        throw new Error(`Unknown data source type: ${sourceType}`);
    }
  }

  /**
   * Collect driver location data
   */
  private async collectDriverLocation(driverId: string): Promise<any> {
    try {
      // In a real implementation, this would query the database or location service
      // For this example, we'll simulate a driver location
      
      // Get driver locations from HERE Fleet API
      const locations = await this.hereFleetService.getDriverLocations([driverId]);
      
      if (!locations || locations.length === 0) {
        throw new Error(`No location data found for driver ${driverId}`);
      }
      
      const driverLocation = locations[0];
      
      return {
        driverId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        speed: driverLocation.speed || 0,
        heading: driverLocation.heading || 0,
        timestamp: driverLocation.timestamp || Date.now(),
        accuracy: driverLocation.accuracy || 10
      };
    } catch (error) {
      logger.error(`Error collecting driver location for ${driverId}:`, error);
      throw error;
    }
  }

  /**
   * Collect HERE Fleet data
   */
  private async collectHereFleetData(driverId: string): Promise<any> {
    try {
      // In a real implementation, this would call the HERE Fleet API
      // For this example, we'll simulate HERE Fleet data
      
      // Get driver locations from HERE Fleet API
      const locations = await this.hereFleetService.getDriverLocations([driverId]);
      
      if (!locations || locations.length === 0) {
        throw new Error(`No location data found for driver ${driverId}`);
      }
      
      // Simulate route data
      return {
        driverId,
        route: {
          distance: 15000, // meters
          duration: 1800, // seconds
          trafficDelay: 300, // seconds
          geometry: {
            type: "LineString",
            coordinates: [
              [locations[0].longitude, locations[0].latitude],
              [-73.9712, 40.7831], // Simulated destination
            ]
          }
        },
        eta: new Date(Date.now() + 1800 * 1000), // 30 minutes from now
        confidence: 0.85
      };
    } catch (error) {
      logger.error(`Error collecting HERE Fleet data for ${driverId}:`, error);
      throw error;
    }
  }

  /**
   * Collect Mapbox Directions data
   */
  private async collectMapboxDirectionsData(context: any): Promise<any> {
    try {
      const { driverId, loadId } = context;
      
      // Get driver location
      const driverLocation = await this.collectDriverLocation(driverId);
      
      // In a real implementation, we would get the load destination from the database
      // For this example, we'll use a simulated destination
      const destination = [-73.9442, 40.6782]; // Simulated Brooklyn coordinates
      
      // Build Mapbox Directions API URL
      const config = this.dataSources.get("mapbox_directions");
      const url = `${config?.endpoint}${driverLocation.longitude},${driverLocation.latitude};${destination[0]},${destination[1]}?access_token=${config?.apiKey}&annotations=duration,distance,speed&overview=full&geometries=geojson`;
      
      // Call Mapbox Directions API
      const response = await axios.get(url, { timeout: config?.timeout });
      
      // Apply transformation if configured
      if (config?.transformationFunction) {
        return config.transformationFunction(response.data);
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Error collecting Mapbox Directions data:`, error);
      throw error;
    }
  }

  /**
   * Collect weather data
   */
  private async collectWeatherData(context: any): Promise<any> {
    try {
      const { driverId } = context;
      
      // Get driver location
      const driverLocation = await this.collectDriverLocation(driverId);
      
      // Build weather API URL
      const config = this.dataSources.get("weather_data");
      const url = `${config?.endpoint}?lat=${driverLocation.latitude}&lon=${driverLocation.longitude}&appid=YOUR_OPENWEATHER_API_KEY&units=imperial`;
      
      // In a real implementation, this would call the OpenWeather API
      // For this example, we'll simulate weather data
      
      // Simulate weather data
      const weatherData = {
        weather: [
          {
            main: "Clear",
            description: "clear sky",
            icon: "01d"
          }
        ],
        main: {
          temp: 72.5,
          feels_like: 71.8,
          temp_min: 68.2,
          temp_max: 75.4,
          pressure: 1015,
          humidity: 65
        },
        visibility: 10000,
        wind: {
          speed: 8.5,
          deg: 220
        },
        rain: {
          "1h": 0
        },
        clouds: {
          all: 5
        },
        dt: Math.floor(Date.now() / 1000),
        sys: {
          sunrise: Math.floor(Date.now() / 1000) - 21600,
          sunset: Math.floor(Date.now() / 1000) + 21600
        },
        timezone: -14400,
        name: "New York"
      };
      
      // Apply transformation if configured
      if (config?.transformationFunction) {
        return config.transformationFunction(weatherData);
      }
      
      return weatherData;
    } catch (error) {
      logger.error(`Error collecting weather data:`, error);
      throw error;
    }
  }

  /**
   * Collect historical data
   */
  private async collectHistoricalData(loadId: string): Promise<any> {
    try {
      // In a real implementation, this would query the database for historical data
      // For this example, we'll simulate historical data
      
      return {
        loadId,
        averageDeliveryTime: 185, // minutes
        delayFrequency: 22, // percentage
        commonDelayCauses: [
          "dock congestion",
          "traffic on I-95",
          "weather delays",
          "driver breaks"
        ],
        deliveryTimesByDayOfWeek: {
          monday: 205,
          tuesday: 175,
          wednesday: 180,
          thursday: 185,
          friday: 210,
          saturday: 165,
          sunday: 155
        },
        deliveryTimesByTimeOfDay: {
          morning: 195,
          afternoon: 175,
          evening: 180,
          night: 160
        },
        seasonalFactors: {
          winter: 1.15,
          spring: 1.05,
          summer: 1.0,
          fall: 1.1
        }
      };
    } catch (error) {
      logger.error(`Error collecting historical data for load ${loadId}:`, error);
      throw error;
    }
  }

  /**
   * Collect traffic data
   */
  private async collectTrafficData(context: any): Promise<any> {
    try {
      const { driverId } = context;
      
      // Get driver location
      const driverLocation = await this.collectDriverLocation(driverId);
      
      // In a real implementation, this would call a traffic API
      // For this example, we'll simulate traffic data
      
      return {
        congestionLevel: 6, // 0-10 scale
        averageSpeed: 35, // mph
        incidents: [
          {
            type: "construction",
            severity: "moderate",
            location: {
              latitude: driverLocation.latitude + 0.02,
              longitude: driverLocation.longitude + 0.01
            },
            description: "Lane closure due to construction",
            startTime: new Date(Date.now() - 3600000), // 1 hour ago
            endTime: new Date(Date.now() + 7200000) // 2 hours from now
          }
        ],
        trafficFlow: "moderate",
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Error collecting traffic data:`, error);
      throw error;
    }
  }

  /**
   * Collect special events data
   */
  private async collectSpecialEventsData(context: any): Promise<any> {
    try {
      const { driverId } = context;
      
      // Get driver location
      const driverLocation = await this.collectDriverLocation(driverId);
      
      // In a real implementation, this would call an events API or database
      // For this example, we'll simulate special events data
      
      return {
        events: [
          {
            type: "sports",
            name: "Baseball Game",
            venue: "Yankee Stadium",
            location: {
              latitude: 40.8296,
              longitude: -73.9262
            },
            startTime: new Date(Date.now() + 3600000), // 1 hour from now
            endTime: new Date(Date.now() + 10800000), // 3 hours from now
            expectedAttendance: 45000,
            trafficImpact: "high"
          }
        ],
        holidays: [],
        roadClosures: [
          {
            location: {
              latitude: driverLocation.latitude + 0.03,
              longitude: driverLocation.longitude - 0.02
            },
            startTime: new Date(Date.now() - 86400000), // 1 day ago
            endTime: new Date(Date.now() + 172800000), // 2 days from now
            reason: "Street fair",
            affectedRoads: ["Main St", "Broadway"]
          }
        ]
      };
    } catch (error) {
      logger.error(`Error collecting special events data:`, error);
      throw error;
    }
  }

  /**
   * Apply fallback strategy for a failed data source
   */
  private async applyFallbackStrategy(
    sourceType: DataSourceType,
    config: DataSourceConfig,
    context: any,
    error: Error
  ): Promise<any> {
    logger.info(`Applying fallback strategy for ${sourceType}: ${config.fallbackStrategy}`);
    
    switch (config.fallbackStrategy) {
      case "use_cached":
        // Try to get from cache regardless of expiry
        const cacheKey = `${sourceType}_${context.driverId}_${context.loadId}`;
        const cachedData = this.getFromCache(cacheKey, true);
        
        if (cachedData) {
          logger.info(`Using expired cached data for ${sourceType}`);
          return cachedData;
        }
        
        logger.warn(`No cached data available for ${sourceType}`);
        return null;
        
      case "use_alternative_source":
        // Use an alternative data source
        switch (sourceType) {
          case "here_fleet":
            logger.info(`Using Mapbox as alternative to HERE Fleet`);
            return this.collectMapboxDirectionsData(context);
            
          case "mapbox_directions":
            logger.info(`Using HERE Fleet as alternative to Mapbox`);
            return this.collectHereFleetData(context.driverId);
            
          default:
            logger.warn(`No alternative source configured for ${sourceType}`);
            return null;
        }
        
      case "use_historical_average":
        // Use historical average data
        logger.info(`Using historical average for ${sourceType}`);
        
        switch (sourceType) {
          case "traffic_data":
            return {
              congestionLevel: 5, // average
              averageSpeed: 45, // mph (average)
              incidents: [],
              trafficFlow: "moderate",
              timestamp: Date.now(),
              isHistoricalAverage: true
            };
            
          case "weather_data":
            return {
              weather: [{ main: "Clear", description: "clear sky" }],
              main: { temp: 65, humidity: 50 },
              wind: { speed: 5 },
              visibility: 10000,
              isHistoricalAverage: true
            };
            
          default:
            logger.warn(`No historical average configured for ${sourceType}`);
            return null;
        }
        
      case "skip_source":
        // Skip this source entirely
        logger.info(`Skipping data source ${sourceType}`);
        return null;
        
      default:
        logger.warn(`Unknown fallback strategy: ${config.fallbackStrategy}`);
        return null;
    }
  }

  /**
   * Stage 2: Validate collected data
   */
  private validateData(context: any): any {
    const { collectedData } = context;
    const validatedData: Record<DataSourceType, any> = {} as Record<DataSourceType, any>;
    const validationResults: Record<DataSourceType, { valid: boolean; errors: string[] }> = {} as Record<DataSourceType, { valid: boolean; errors: string[] }>;
    
    // Validate each data source
    for (const [sourceType, data] of Object.entries(collectedData)) {
      const config = this.dataSources.get(sourceType as DataSourceType);
      
      if (!config || !data) {
        continue;
      }
      
      const validationResult = this.validateDataSource(sourceType as DataSourceType, data, config);
      validationResults[sourceType as DataSourceType] = validationResult;
      
      if (validationResult.valid) {
        validatedData[sourceType as DataSourceType] = data;
      }
    }
    
    // Calculate data quality metrics
    const dataQualityMetrics = this.calculateDataQualityMetrics({
      validatedData,
      validationResults
    });
    
    return {
      validatedData,
      validationResults,
      dataQualityMetrics
    };
  }

  /**
   * Validate a specific data source
   */
  private validateDataSource(
    sourceType: DataSourceType,
    data: any,
    config: DataSourceConfig
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Skip validation if no rules defined
    if (!config.validationRules || config.validationRules.length === 0) {
      return { valid: true, errors: [] };
    }
    
    // Apply each validation rule
    for (const rule of config.validationRules) {
      const fieldValue = this.getNestedValue(data, rule.field);
      
      switch (rule.rule) {
        case "required":
          if (fieldValue === undefined || fieldValue === null) {
            errors.push(rule.errorMessage);
          }
          break;
          
        case "min":
          if (typeof fieldValue === "number" && fieldValue < rule.value) {
            errors.push(rule.errorMessage);
          }
          break;
          
        case "max":
          if (typeof fieldValue === "number" && fieldValue > rule.value) {
            errors.push(rule.errorMessage);
          }
          break;
          
        case "range":
          if (
            typeof fieldValue === "number" &&
            (fieldValue < rule.value[0] || fieldValue > rule.value[1])
          ) {
            errors.push(rule.errorMessage);
          }
          break;
          
        case "format":
          // Format validation would go here (e.g., regex)
          break;
          
        case "custom":
          if (rule.customValidator && !rule.customValidator(fieldValue)) {
            errors.push(rule.errorMessage);
          }
          break;
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split(".");
    return keys.reduce((o, key) => {
      if (o === undefined || o === null) return undefined;
      
      // Handle array indices in the path (e.g., "routes.0.duration")
      if (/^\d+$/.test(key) && Array.isArray(o)) {
        return o[parseInt(key)];
      }
      
      return o[key];
    }, obj);
  }

  /**
   * Stage 3: Transform collected data
   */
  private transformData(context: any): any {
    const { validatedData } = context;
    
    // Initialize transformed data structure
    const transformedData: any = {
      locationData: null,
      routeData: null,
      weatherData: null,
      trafficData: null,
      historicalData: null,
      specialEvents: null
    };
    
    // Transform driver location data
    if (validatedData.driver_location) {
      transformedData.locationData = {
        latitude: validatedData.driver_location.latitude,
        longitude: validatedData.driver_location.longitude,
        timestamp: validatedData.driver_location.timestamp,
        speed: validatedData.driver_location.speed || 0,
        heading: validatedData.driver_location.heading || 0,
        accuracy: validatedData.driver_location.accuracy || 10
      };
    }
    
    // Transform route data (prefer Mapbox, fallback to HERE Fleet)
    if (validatedData.mapbox_directions) {
      const mapboxData = validatedData.mapbox_directions;
      
      if (mapboxData.routes && mapboxData.routes.length > 0) {
        const route = mapboxData.routes[0];
        
        transformedData.routeData = {
          distance: route.distance, // meters
          duration: route.duration, // seconds
          geometry: route.geometry,
          legs: route.legs || [],
          trafficLevel: this.determineTrafficLevel(route.duration, route.duration_typical),
          eta: new Date(Date.now() + route.duration * 1000),
          generatedAt: new Date()
        };
      }
    } else if (validatedData.here_fleet) {
      const hereData = validatedData.here_fleet;
      
      transformedData.routeData = {
        distance: hereData.route.distance, // meters
        duration: hereData.route.duration, // seconds
        geometry: hereData.route.geometry,
        legs: [],
        trafficLevel: this.determineTrafficLevel(hereData.route.duration, hereData.route.duration - hereData.route.trafficDelay),
        eta: hereData.eta,
        generatedAt: new Date()
      };
    }
    
    // Transform weather data
    if (validatedData.weather_data) {
      const weatherData = validatedData.weather_data;
      
      transformedData.weatherData = {
        condition: weatherData.weather[0].main.toLowerCase(),
        description: weatherData.weather[0].description,
        temperature: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        precipitation: weatherData.rain ? weatherData.rain["1h"] || 0 : 0,
        windSpeed: weatherData.wind.speed,
        visibility: weatherData.visibility / 1000, // convert to km
        alerts: [],
        timestamp: new Date(weatherData.dt * 1000)
      };
    }
    
    // Transform traffic data
    if (validatedData.traffic_data) {
      const trafficData = validatedData.traffic_data;
      
      transformedData.trafficData = {
        condition: this.mapCongestionToCondition(trafficData.congestionLevel),
        congestionLevel: trafficData.congestionLevel,
        averageSpeed: trafficData.averageSpeed,
        delayMinutes: this.estimateDelayFromCongestion(trafficData.congestionLevel),
        incidents: trafficData.incidents || [],
        timestamp: new Date(trafficData.timestamp)
      };
    }
    
    // Transform historical data
    if (validatedData.historical_data) {
      transformedData.historicalData = validatedData.historical_data;
    }
    
    // Transform special events data
    if (validatedData.special_events) {
      transformedData.specialEvents = {
        events: validatedData.special_events.events || [],
        holidays: validatedData.special_events.holidays || [],
        roadClosures: validatedData.special_events.roadClosures || []
      };
    }
    
    return { transformedData };
  }

  /**
   * Determine traffic level based on current vs. typical duration
   */
  private determineTrafficLevel(currentDuration: number, typicalDuration: number): string {
    if (!typicalDuration) return "moderate";
    
    const ratio = currentDuration / typicalDuration;
    
    if (ratio < 1.1) return "low";
    if (ratio < 1.3) return "moderate";
    if (ratio < 1.6) return "heavy";
    return "severe";
  }

  /**
   * Map congestion level to traffic condition
   */
  private mapCongestionToCondition(congestionLevel: number): string {
    if (congestionLevel <= 3) return "light";
    if (congestionLevel <= 6) return "moderate";
    if (congestionLevel <= 8) return "heavy";
    return "severe";
  }

  /**
   * Estimate delay in minutes based on congestion level
   */
  private estimateDelayFromCongestion(congestionLevel: number): number {
    // Simple linear model: 0 = no delay, 10 = 60 minute delay
    return Math.round(congestionLevel * 6);
  }

  /**
   * Stage 4: Enrich data with additional context and derived features
   */
  private enrichData(context: any): any {
    const { transformedData } = context;
    
    // Initialize derived features
    const derivedFeatures: any = {
      weatherImpact: this.calculateWeatherImpact(transformedData.weatherData),
      trafficImpact: this.calculateTrafficImpact(transformedData.trafficData),
      historicalPatterns: this.calculateHistoricalPatterns(transformedData.historicalData),
      combinedRiskFactors: { total: 0, breakdown: {} }
    };
    
    // Calculate combined risk factors
    const riskFactors: Record<string, number> = {};
    
    if (derivedFeatures.weatherImpact) {
      riskFactors.weather = this.mapSeverityToRisk(derivedFeatures.weatherImpact.severity);
    }
    
    if (derivedFeatures.trafficImpact) {
      riskFactors.traffic = this.mapSeverityToRisk(derivedFeatures.trafficImpact.severity);
    }
    
    if (transformedData.specialEvents && transformedData.specialEvents.events.length > 0) {
      riskFactors.events = 0.5; // Fixed impact for now
    }
    
    if (derivedFeatures.historicalPatterns) {
      const patterns = derivedFeatures.historicalPatterns;
      riskFactors.dayOfWeek = Math.max(0, (patterns.dayOfWeekFactor - 1) * 2);
      riskFactors.timeOfDay = Math.max(0, (patterns.timeOfDayFactor - 1) * 2);
      riskFactors.seasonal = Math.max(0, (patterns.seasonalFactor - 1) * 2);
    }
    
    // Calculate total risk
    const totalRisk = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0);
    
    derivedFeatures.combinedRiskFactors = {
      total: Math.min(1, totalRisk / 5), // Normalize to 0-1
      breakdown: riskFactors
    };
    
    // Adjust ETA based on derived features
    if (transformedData.routeData) {
      const adjustedDuration = this.calculateAdjustedDuration(
        transformedData.routeData.duration,
        derivedFeatures
      );
      
      transformedData.routeData.adjustedDuration = adjustedDuration;
      transformedData.routeData.adjustedEta = new Date(
        Date.now() + adjustedDuration * 1000
      );
    }
    
    // Add proximity alerts for special events and incidents
    transformedData.proximityAlerts = this.generateProximityAlerts(
      transformedData.locationData,
      transformedData.specialEvents,
      transformedData.trafficData
    );
    
    return {
      enrichedData: {
        ...transformedData,
        derivedFeatures
      }
    };
  }

  /**
   * Calculate weather impact on travel
   */
  private calculateWeatherImpact(weatherData: any): any {
    if (!weatherData) return null;
    
    let severity = "none";
    let estimatedDelayMinutes = 0;
    
    // Determine severity based on weather condition
    switch (weatherData.condition) {
      case "clear":
      case "clouds":
        severity = "none";
        estimatedDelayMinutes = 0;
        break;
        
      case "mist":
      case "fog":
        severity = weatherData.visibility < 1 ? "moderate" : "low";
        estimatedDelayMinutes = weatherData.visibility < 1 ? 15 : 5;
        break;
        
      case "rain":
        if (weatherData.precipitation < 0.1) {
          severity = "low";
          estimatedDelayMinutes = 5;
        } else if (weatherData.precipitation < 0.5) {
          severity = "moderate";
          estimatedDelayMinutes = 15;
        } else {
          severity = "high";
          estimatedDelayMinutes = 30;
        }
        break;
        
      case "snow":
        severity = "high";
        estimatedDelayMinutes = 45;
        break;
        
      case "thunderstorm":
        severity = "severe";
        estimatedDelayMinutes = 60;
        break;
        
      default:
        severity = "low";
        estimatedDelayMinutes = 5;
    }
    
    // Adjust for wind conditions
    if (weatherData.windSpeed > 25) {
      severity = this.increaseSeverity(severity);
      estimatedDelayMinutes += 15;
    } else if (weatherData.windSpeed > 15) {
      estimatedDelayMinutes += 5;
    }
    
    return {
      condition: weatherData.condition,
      severity,
      estimatedDelayMinutes,
      description: this.getWeatherImpactDescription(weatherData.condition, severity)
    };
  }

  /**
   * Calculate traffic impact on travel
   */
  private calculateTrafficImpact(trafficData: any): any {
    if (!trafficData) return null;
    
    const severity = trafficData.condition;
    let estimatedDelayMinutes = trafficData.delayMinutes || 0;
    
    // Add additional delay for incidents
    if (trafficData.incidents && trafficData.incidents.length > 0) {
      for (const incident of trafficData.incidents) {
        switch (incident.severity) {
          case "minor":
            estimatedDelayMinutes += 5;
            break;
          case "moderate":
            estimatedDelayMinutes += 15;
            break;
          case "major":
            estimatedDelayMinutes += 30;
            break;
          case "severe":
            estimatedDelayMinutes += 60;
            break;
        }
      }
    }
    
    return {
      condition: trafficData.condition,
      severity,
      estimatedDelayMinutes,
      incidents: trafficData.incidents,
      description: this.getTrafficImpactDescription(severity, trafficData.incidents)
    };
  }

  /**
   * Calculate historical patterns impact
   */
  private calculateHistoricalPatterns(historicalData: any): any {
    if (!historicalData) return null;
    
    // Get current day of week and time of day
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    let timeOfDay = "morning";
    const hour = now.getHours();
    
    if (hour >= 12 && hour < 17) {
      timeOfDay = "afternoon";
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = "evening";
    } else if (hour >= 21 || hour < 6) {
      timeOfDay = "night";
    }
    
    // Get season
    const month = now.getMonth();
    let season = "spring";
    
    if (month >= 2 && month < 5) {
      season = "spring";
    } else if (month >= 5 && month < 8) {
      season = "summer";
    } else if (month >= 8 && month < 11) {
      season = "fall";
    } else {
      season = "winter";
    }
    
    // Calculate factors
    const dayOfWeekFactor = historicalData.deliveryTimesByDayOfWeek?.[dayOfWeek] / historicalData.averageDeliveryTime || 1;
    const timeOfDayFactor = historicalData.deliveryTimesByTimeOfDay?.[timeOfDay] / historicalData.averageDeliveryTime || 1;
    const seasonalFactor = historicalData.seasonalFactors?.[season] || 1;
    
    // Calculate combined factor
    const combinedFactor = dayOfWeekFactor * timeOfDayFactor * seasonalFactor;
    
    return {
      dayOfWeek,
      timeOfDay,
      season,
      dayOfWeekFactor,
      timeOfDayFactor,
      seasonalFactor,
      combinedFactor,
      estimatedDelayMinutes: Math.round((combinedFactor - 1) * historicalData.averageDeliveryTime)
    };
  }

  /**
   * Calculate adjusted duration based on all factors
   */
  private calculateAdjustedDuration(baseDuration: number, derivedFeatures: any): number {
    let adjustedDuration = baseDuration;
    
    // Add weather impact
    if (derivedFeatures.weatherImpact) {
      adjustedDuration += derivedFeatures.weatherImpact.estimatedDelayMinutes * 60; // Convert to seconds
    }
    
    // Add traffic impact
    if (derivedFeatures.trafficImpact) {
      adjustedDuration += derivedFeatures.trafficImpact.estimatedDelayMinutes * 60; // Convert to seconds
    }
    
    // Add historical patterns impact
    if (derivedFeatures.historicalPatterns) {
      adjustedDuration *= derivedFeatures.historicalPatterns.combinedFactor;
    }
    
    return Math.round(adjustedDuration);
  }

  /**
   * Generate proximity alerts for special events and incidents
   */
  private generateProximityAlerts(locationData: any, specialEvents: any, trafficData: any): any[] {
    const alerts = [];
    
    if (!locationData) return alerts;
    
    // Check for nearby special events
    if (specialEvents && specialEvents.events) {
      for (const event of specialEvents.events) {
        if (event.location) {
          const distance = this.calculateDistance(
            locationData.latitude,
            locationData.longitude,
            event.location.latitude,
            event.location.longitude
          );
          
          if (distance < 10) { // Within 10 miles
            alerts.push({
              type: "special_event",
              name: event.name,
              distance: Math.round(distance * 10) / 10,
              impact: event.trafficImpact || "medium",
              startTime: event.startTime,
              endTime: event.endTime,
              description: `${event.name} at ${event.venue} (${Math.round(distance * 10) / 10} miles away)`
            });
          }
        }
      }
    }
    
    // Check for nearby road closures
    if (specialEvents && specialEvents.roadClosures) {
      for (const closure of specialEvents.roadClosures) {
        if (closure.location) {
          const distance = this.calculateDistance(
            locationData.latitude,
            locationData.longitude,
            closure.location.latitude,
            closure.location.longitude
          );
          
          if (distance < 5) { // Within 5 miles
            alerts.push({
              type: "road_closure",
              distance: Math.round(distance * 10) / 10,
              impact: "high",
              startTime: closure.startTime,
              endTime: closure.endTime,
              affectedRoads: closure.affectedRoads,
              description: `Road closure: ${closure.reason} (${Math.round(distance * 10) / 10} miles away)`
            });
          }
        }
      }
    }
    
    // Check for nearby traffic incidents
    if (trafficData && trafficData.incidents) {
      for (const incident of trafficData.incidents) {
        if (incident.location) {
          const distance = this.calculateDistance(
            locationData.latitude,
            locationData.longitude,
            incident.location.latitude,
            incident.location.longitude
          );
          
          if (distance < 5) { // Within 5 miles
            alerts.push({
              type: "traffic_incident",
              incidentType: incident.type,
              severity: incident.severity,
              distance: Math.round(distance * 10) / 10,
              impact: this.mapSeverityToImpact(incident.severity),
              startTime: incident.startTime,
              endTime: incident.endTime,
              description: `${incident.type} (${incident.severity}): ${incident.description} (${Math.round(distance * 10) / 10} miles ahead)`
            });
          }
        }
      }
    }
    
    return alerts;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 0.621371; // Convert to miles
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Map severity to risk factor
   */
  private mapSeverityToRisk(severity: string): number {
    switch (severity) {
      case "none":
        return 0;
      case "low":
        return 0.2;
      case "moderate":
        return 0.5;
      case "high":
        return 0.8;
      case "severe":
        return 1.0;
      default:
        return 0;
    }
  }

  /**
   * Map severity to impact
   */
  private mapSeverityToImpact(severity: string): string {
    switch (severity) {
      case "minor":
        return "low";
      case "moderate":
        return "medium";
      case "major":
        return "high";
      case "severe":
        return "critical";
      default:
        return "medium";
    }
  }

  /**
   * Increase severity level
   */
  private increaseSeverity(severity: string): string {
    switch (severity) {
      case "none":
        return "low";
      case "low":
        return "moderate";
      case "moderate":
        return "high";
      case "high":
      case "severe":
        return "severe";
      default:
        return severity;
    }
  }

  /**
   * Get weather impact description
   */
  private getWeatherImpactDescription(condition: string, severity: string): string {
    if (severity === "none") {
      return "Clear weather conditions with no impact on travel time.";
    }
    
    const descriptions = {
      rain: {
        low: "Light rain with minimal impact on travel time.",
        moderate: "Moderate rain reducing visibility and average speeds.",
        high: "Heavy rain significantly affecting road conditions and visibility.",
        severe: "Severe rainfall creating hazardous driving conditions."
      },
      snow: {
        low: "Light snow with minimal accumulation on roadways.",
        moderate: "Moderate snowfall affecting road conditions and visibility.",
        high: "Heavy snow significantly reducing speeds and creating difficult driving conditions.",
        severe: "Severe snowstorm with hazardous road conditions."
      },
      fog: {
        low: "Patchy fog with minimal impact on visibility.",
        moderate: "Moderate fog reducing visibility and requiring reduced speeds.",
        high: "Dense fog significantly limiting visibility and requiring caution.",
        severe: "Extremely dense fog creating hazardous driving conditions."
      },
      thunderstorm: {
        low: "Distant thunderstorm with minimal impact on travel.",
        moderate: "Thunderstorm in the vicinity with potential for heavy rain.",
        high: "Severe thunderstorm with heavy rain and strong winds.",
        severe: "Dangerous thunderstorm with potential for flash flooding and high winds."
      },
      clouds: {
        low: "Cloudy conditions with no significant impact on travel.",
        moderate: "Overcast conditions with potential for reduced visibility.",
        high: "Heavy cloud cover with significantly reduced visibility.",
        severe: "Extremely low cloud ceiling creating hazardous conditions."
      },
      clear: {
        low: "Clear conditions with excellent visibility.",
        moderate: "Clear conditions with good visibility.",
        high: "Clear conditions with moderate visibility.",
        severe: "Clear conditions with poor visibility due to other factors."
      }
    };
    
    return descriptions[condition]?.[severity] || `${condition} conditions affecting travel time.`;
  }

  /**
   * Get traffic impact description
   */
  private getTrafficImpactDescription(severity: string, incidents: any[]): string {
    let description = "";
    
    switch (severity) {
      case "light":
        description = "Light traffic conditions with minimal impact on travel time.";
        break;
      case "moderate":
        description = "Moderate traffic congestion adding some delay to the journey.";
        break;
      case "heavy":
        description = "Heavy traffic congestion significantly impacting travel time.";
        break;
      case "severe":
        description = "Severe traffic conditions causing major delays.";
        break;
      default:
        description = "Current traffic conditions may affect travel time.";
    }
    
    // Add information about incidents if available
    if (incidents && incidents.length > 0) {
      if (incidents.length === 1) {
        description += ` There is 1 reported ${incidents[0].type} (${incidents[0].severity}) in the area.`;
      } else {
        description += ` There are ${incidents.length} reported incidents in the area.`;
      }
    }
    
    return description;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string, ignoreExpiry: boolean = false): any {
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) {
      return null;
    }
    
    if (!ignoreExpiry && Date.now() - cachedItem.timestamp > 300000) { // 5 minutes
      return null;
    }
    
    return cachedItem.data;
  }

  /**
   * Store in cache
   */
  private storeInCache(key: string, data: any, expiry: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  /**
   * Transform Mapbox data
   */
  private transformMapboxData(data: any): any {
    // Implement Mapbox data transformation
    return data;
  }

  /**
   * Transform weather data
   */
  private transformWeatherData(data: any): any {
    // Implement weather data transformation
    return data;
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQualityMetrics(data: any): DataQualityMetrics {
    // In a real implementation, this would calculate actual metrics
    // For this example, we'll return placeholder values
    return {
      completeness: 0.85,
      accuracy: 0.9,
      timeliness: 0.95,
      consistency: 0.8
    };
  }

  /**
   * Handle data collection error
   */
  private handleDataCollectionError(error: Error, data?: any): any {
    logger.error("Data collection error:", error);
    
    return {
      collectedData: data?.collectedData || {},
      collectionTimestamp: new Date(),
      sourcesCollected: data?.sourcesCollected || [],
      sourcesFailed: [...(data?.sourcesFailed || []), "unknown"],
      fatal: false
    };
  }

  /**
   * Handle data validation error
   */
  private handleDataValidationError(error: Error, data?: any): any {
    logger.error("Data validation error:", error);
    
    return {
      validatedData: data?.validatedData || {},
      validationResults: data?.validationResults || {},
      dataQualityMetrics: {
        completeness: 0.5,
        accuracy: 0.5,
        timeliness: 0.5,
        consistency: 0.5
      },
      fatal: false
    };
  }

  /**
   * Handle data transformation error
   */
  private handleDataTransformationError(error: Error, data?: any): any {
    logger.error("Data transformation error:", error);
    
    return {
      transformedData: {
        locationData: null,
        routeData: null,
        weatherData: null,
        trafficData: null,
        historicalData: null,
        specialEvents: null
      },
      fatal: false
    };
  }

  /**
   * Handle data enrichment error
   */
  private handleDataEnrichmentError(error: Error, data?: any): any {
    logger.error("Data enrichment error:", error);
    
    return {
      enrichedData: data?.transformedData || {
        locationData: null,
        routeData: null,
        weatherData: null,
        trafficData: null,
        historicalData: null,
        specialEvents: null
      },
      fatal: false
    };
  }

  /**
   * Handle LLM preparation error
   */
  private handleLLMPreparationError(error: Error, data?: any): any {
    logger.error("LLM preparation error:", error);
    
    return {
      llmInput: {
        promptType: data?.promptType || "eta_prediction",
        userRole: data?.userRole || "carrier",
        data: {
          trafficData: data?.enrichedData?.trafficData || null,
          weatherData: data?.enrichedData?.weatherData || null,
          locationData: data?.enrichedData?.locationData || null,
          historicalData: data?.enrichedData?.historicalData || null,
          routeData: data?.enrichedData?.routeData || null
        }
      },
      fatal: false
    };
  }

  /**
   * Stage 5: Prepare data for LLM input
   */
  private prepareLLMInput(context: any): any {
    const { enrichedData, promptType, userRole, driverId, loadId } = context;
    
    // Prepare data for LLM consumption based on prompt type
    const llmData: any = {};
    
    // Add traffic data if available and relevant for this prompt type
    if (enrichedData.trafficData) {
      llmData.trafficData = {
        condition: enrichedData.trafficData.condition,
        congestionLevel: enrichedData.trafficData.congestionLevel,
        averageSpeed: enrichedData.trafficData.averageSpeed,
        delayMinutes: enrichedData.trafficData.delayMinutes,
        incidents: enrichedData.trafficData.incidents,
        impact: enrichedData.derivedFeatures?.trafficImpact
      };
    }
    
    // Add weather data if available and relevant
    if (enrichedData.weatherData) {
      llmData.weatherData = {
        condition: enrichedData.weatherData.condition,
        description: enrichedData.weatherData.description,
        temperature: enrichedData.weatherData.temperature,
        precipitation: enrichedData.weatherData.precipitation,
        windSpeed: enrichedData.weatherData.windSpeed,
        visibility: enrichedData.weatherData.visibility,
        alerts: enrichedData.weatherData.alerts,
        impact: enrichedData.derivedFeatures?.weatherImpact
      };
    }
    
    // Add location data if available
    if (enrichedData.locationData) {
      llmData.locationData = {
        latitude: enrichedData.locationData.latitude,
        longitude: enrichedData.locationData.longitude,
        timestamp: enrichedData.locationData.timestamp,
        speed: enrichedData.locationData.speed,
        heading: enrichedData.locationData.heading,
        distanceToDestination: 0 // Would be calculated in a real implementation
      };
    }
    
    // Add historical data if available
    if (enrichedData.historicalData) {
      llmData.historicalData = {
        avgDeliveryTime: enrichedData.historicalData.averageDeliveryTime,
        delayFrequency: enrichedData.historicalData.delayFrequency,
        commonDelayCauses: enrichedData.historicalData.commonDelayCauses,
        patterns: enrichedData.derivedFeatures?.historicalPatterns
      };
    }
    
    // Add route data if available
    if (enrichedData.routeData) {
      llmData.routeData = {
        originalEta: enrichedData.routeData.eta,
        currentEta: enrichedData.routeData.adjustedEta || enrichedData.routeData.eta,
        remainingDistance: enrichedData.routeData.distance / 1000, // Convert to km
        remainingDrivingTime: Math.round(enrichedData.routeData.duration / 60), // Convert to minutes
        trafficLevel: enrichedData.routeData.trafficLevel
      };
    }
    
    // Add special events data if available
    if (enrichedData.specialEvents && enrichedData.specialEvents.events.length > 0) {
      llmData.specialEvents = enrichedData.specialEvents;
    }
    
    // Add proximity alerts if available
    if (enrichedData.proximityAlerts && enrichedData.proximityAlerts.length > 0) {
      llmData.proximityAlerts = enrichedData.proximityAlerts;
    }
    
    // Add risk factors if available
    if (enrichedData.derivedFeatures?.combinedRiskFactors) {
      llmData.riskFactors = enrichedData.derivedFeatures.combinedRiskFactors;
    }
    
    // Add load data (would be fetched from database in real implementation)
    llmData.loadData = {
      id: loadId,
      origin: "New York, NY",
      destination: "Boston, MA",
      scheduledDelivery: new Date(Date.now() + 86400000), // 24 hours from now
      status: "in_transit"
    };
    
    // Add vehicle data (would be fetched from database in real implementation)
    llmData.vehicleData = {
      id: "V12345",
      type: "semi_truck",
      avgSpeed: 55, // mph
      status: "active"
    };
    
    return {
      llmInput: {
        promptType,
        userRole,
        data: llmData
      }
    };
  }
}

// Export singleton instance
export const etaDataPipeline = ETADataPipeline.getInstance();
