import axios from "axios";
import { logger } from "../utils/logger";

export class FreightPathService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.FREIGHT_PATH_API_KEY || "";
    this.baseUrl = "https://api.freightpath.io/v1";

    if (!this.apiKey) {
      logger.warn("FreightPath API key not found in environment variables");
    }
  }

  /**
   * Find available loads
   */
  async findAvailableLoads(params: {
    origin_lat: number;
    origin_lng: number;
    radius_miles?: number;
    equipment_type?: string;
    weight_min?: number;
    weight_max?: number;
    limit?: number;
  }): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/loads/available`, {
        params: {
          ...params,
          radius_miles: params.radius_miles || 50,
          limit: params.limit || 20,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.loads || [];
    } catch (error) {
      logger.error("Error finding available loads from FreightPath:", error);
      throw new Error("Failed to find available loads");
    }
  }

  /**
   * Get load details
   */
  async getLoadDetails(loadId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/loads/${loadId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.load;
    } catch (error) {
      logger.error("Error getting load details from FreightPath:", error);
      throw new Error("Failed to get load details");
    }
  }

  /**
   * Submit bid for a load
   */
  async submitBid(params: {
    load_id: string;
    carrier_id: string;
    amount: number;
    expiration_date?: string;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/bids`, params, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.bid;
    } catch (error) {
      logger.error("Error submitting bid to FreightPath:", error);
      throw new Error("Failed to submit bid");
    }
  }

  /**
   * Accept a bid
   */
  async acceptBid(bidId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/bids/${bidId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      logger.error("Error accepting bid on FreightPath:", error);
      throw new Error("Failed to accept bid");
    }
  }

  /**
   * Reject a bid
   */
  async rejectBid(bidId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/bids/${bidId}/reject`,
        {
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      logger.error("Error rejecting bid on FreightPath:", error);
      throw new Error("Failed to reject bid");
    }
  }

  /**
   * Get carrier details
   */
  async getCarrierDetails(carrierId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/carriers/${carrierId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.carrier;
    } catch (error) {
      logger.error("Error getting carrier details from FreightPath:", error);
      throw new Error("Failed to get carrier details");
    }
  }

  /**
   * Get carrier ratings
   */
  async getCarrierRatings(carrierId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/carriers/${carrierId}/ratings`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.ratings;
    } catch (error) {
      logger.error("Error getting carrier ratings from FreightPath:", error);
      throw new Error("Failed to get carrier ratings");
    }
  }

  /**
   * Submit carrier rating
   */
  async submitCarrierRating(params: {
    carrier_id: string;
    shipper_id: string;
    load_id: string;
    rating: number;
    comments?: string;
    on_time_pickup?: number;
    on_time_delivery?: number;
    communication?: number;
    problem_resolution?: number;
  }): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/ratings`, params, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.rating;
    } catch (error) {
      logger.error("Error submitting carrier rating to FreightPath:", error);
      throw new Error("Failed to submit carrier rating");
    }
  }

  /**
   * Get market rates
   */
  async getMarketRates(params: {
    origin_city: string;
    origin_state: string;
    destination_city: string;
    destination_state: string;
    equipment_type?: string;
  }): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/market/rates`, {
        params,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.rates;
    } catch (error) {
      logger.error("Error getting market rates from FreightPath:", error);
      throw new Error("Failed to get market rates");
    }
  }
}
