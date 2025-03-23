import { Request, Response } from "express";
import { GeofenceService } from "../services/geofence.service";
import { logger } from "../utils/logger";

const geofenceService = GeofenceService.getInstance();

export const createGeofence = async (req: Request, res: Response) => {
  try {
    const { name, latitude, longitude, radius, address, createdBy } = req.body;

    if (!name || !latitude || !longitude || !radius || !createdBy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const geofence = geofenceService.createGeofence({
      name,
      latitude,
      longitude,
      radius,
      address,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      geofence,
    });
  } catch (error) {
    logger.error("Error creating geofence:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create geofence",
    });
  }
};

export const getGeofence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const geofence = geofenceService.getGeofence(id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: "Geofence not found",
      });
    }

    return res.status(200).json({
      success: true,
      geofence,
    });
  } catch (error) {
    logger.error("Error getting geofence:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get geofence",
    });
  }
};

export const getAllGeofences = async (req: Request, res: Response) => {
  try {
    const geofences = geofenceService.getAllGeofences();

    return res.status(200).json({
      success: true,
      geofences,
    });
  } catch (error) {
    logger.error("Error getting all geofences:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get geofences",
    });
  }
};

export const updateGeofence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius, address } = req.body;

    const updatedGeofence = geofenceService.updateGeofence(id, {
      name,
      latitude,
      longitude,
      radius,
      address,
    });

    if (!updatedGeofence) {
      return res.status(404).json({
        success: false,
        message: "Geofence not found",
      });
    }

    return res.status(200).json({
      success: true,
      geofence: updatedGeofence,
    });
  } catch (error) {
    logger.error("Error updating geofence:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update geofence",
    });
  }
};

export const deleteGeofence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = geofenceService.deleteGeofence(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Geofence not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Geofence deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting geofence:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete geofence",
    });
  }
};

export const getGeofenceEvents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = geofenceService.getGeofenceEventsForGeofence(id);

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    logger.error("Error getting geofence events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get geofence events",
    });
  }
};

export const getVehicleGeofenceEvents = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const events = geofenceService.getGeofenceEventsForVehicle(vehicleId);

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    logger.error("Error getting vehicle geofence events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get vehicle geofence events",
    });
  }
};
