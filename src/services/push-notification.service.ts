import { logger } from "../api/utils/logger";

export class PushNotificationService {
  private static instance: PushNotificationService;
  private hourlyRateLimit = 100;
  private notificationQueue: Map<string, number> = new Map();

  private constructor() {
    if (!import.meta.env.FIREBASE_ADMIN_CONFIG) {
      logger.warn(
        "Firebase admin config not found. Push notifications will be mocked.",
      );
    }
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const hour = 3600000;

    for (const [id, timestamp] of this.notificationQueue.entries()) {
      if (now - timestamp > hour) {
        this.notificationQueue.delete(id);
      }
    }

    let count = 0;
    for (const [id, timestamp] of this.notificationQueue.entries()) {
      if (id === userId && now - timestamp <= hour) {
        count++;
      }
    }

    return count < this.hourlyRateLimit;
  }

  private formatNotificationByType(
    content: string,
    type: string,
  ): NotificationPayload {
    const templates: Record<string, NotificationPayload> = {
      message: {
        title: "New Message",
        body: content,
        icon: "message-circle",
        data: { type: "message" },
      },
      system: {
        title: "System Notification",
        body: content,
        icon: "info",
        data: { type: "system" },
      },
      load: {
        title: "Load Update",
        body: content,
        icon: "truck",
        data: { type: "load" },
      },
      document: {
        title: "Document Update",
        body: content,
        icon: "file-text",
        data: { type: "document" },
      },
      alert: {
        title: "Alert",
        body: content,
        icon: "alert-triangle",
        data: { type: "alert" },
      },
      default: {
        title: "Notification",
        body: content,
        icon: "bell",
        data: { type: "default" },
      },
    };

    return templates[type] || templates.default;
  }

  private async trackDelivery(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    logger.info(
      `Tracking delivery for notification ${notificationId} to user ${userId}`,
    );
  }

  public async sendPushNotification(
    userId: string,
    content: string,
    type = "default",
    options: NotificationOptions = {},
  ): Promise<NotificationResult> {
    try {
      if (!(await this.checkRateLimit(userId))) {
        throw new Error("Rate limit exceeded for this user");
      }

      const notification = this.formatNotificationByType(content, type);
      const mockId = `mock_${Date.now()}`;

      if (!import.meta.env.FIREBASE_ADMIN_CONFIG) {
        logger.info(`[MOCK PUSH] To: ${userId}, Notification:`, notification);
        await this.trackDelivery(mockId, userId);
        return {
          id: mockId,
          status: "sent",
          userId,
          notification,
        };
      }

      await this.trackDelivery(mockId, userId);
      return {
        id: mockId,
        status: "sent",
        userId,
        notification,
      };
    } catch (error) {
      logger.error("Error sending push notification:", error);
      throw new Error("Failed to send push notification");
    }
  }
}

interface NotificationPayload {
  title: string;
  body: string;
  icon: string;
  data: Record<string, any>;
}

interface NotificationOptions {
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationResult {
  id: string;
  status: string;
  userId: string;
  notification: NotificationPayload;
}
