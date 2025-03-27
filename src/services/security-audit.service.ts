/**
 * Security Audit Service
 * Provides functionality for runtime security checks and monitoring
 */

import { logger } from "../api/utils/logger";

interface SecurityAuditOptions {
  enableRuntimeChecks: boolean;
  logSecurityEvents: boolean;
  sensitiveOperationsTracking: boolean;
}

interface SecurityEvent {
  type: string;
  timestamp: string;
  details: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
}

class SecurityAuditService {
  private options: SecurityAuditOptions;
  private securityEvents: SecurityEvent[] = [];
  private static instance: SecurityAuditService;

  private constructor(options: SecurityAuditOptions) {
    this.options = options;
    logger.info("Security Audit Service initialized");
  }

  public static getInstance(
    options?: Partial<SecurityAuditOptions>,
  ): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService({
        enableRuntimeChecks: true,
        logSecurityEvents: true,
        sensitiveOperationsTracking: true,
        ...options,
      });
    }
    return SecurityAuditService.instance;
  }

  /**
   * Records a security event for later analysis
   */
  public recordSecurityEvent(event: Omit<SecurityEvent, "timestamp">): void {
    if (!this.options.logSecurityEvents) return;

    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.securityEvents.push(securityEvent);

    // Log the event
    const logMethod = this.getLogMethodForSeverity(securityEvent.severity);
    logMethod(
      `Security Event [${securityEvent.type}]: ${JSON.stringify(securityEvent.details)}`,
    );
  }

  /**
   * Performs a runtime security check on the provided data
   */
  public checkForVulnerabilities(
    data: any,
    context: string,
  ): {
    safe: boolean;
    issues: string[];
  } {
    if (!this.options.enableRuntimeChecks) {
      return { safe: true, issues: [] };
    }

    const issues: string[] = [];

    // Check for SQL injection patterns
    if (typeof data === "string" && this.containsSqlInjectionPatterns(data)) {
      issues.push(`Potential SQL injection detected in ${context}`);
      this.recordSecurityEvent({
        type: "sql-injection-attempt",
        details: { data, context },
        severity: "high",
      });
    }

    // Check for XSS patterns
    if (typeof data === "string" && this.containsXssPatterns(data)) {
      issues.push(`Potential XSS attack detected in ${context}`);
      this.recordSecurityEvent({
        type: "xss-attempt",
        details: { data, context },
        severity: "high",
      });
    }

    // Check for prototype pollution
    if (
      typeof data === "object" &&
      data !== null &&
      this.containsPrototypePollutionAttempt(data)
    ) {
      issues.push(`Potential prototype pollution detected in ${context}`);
      this.recordSecurityEvent({
        type: "prototype-pollution-attempt",
        details: { context },
        severity: "high",
      });
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  /**
   * Tracks sensitive operations for security auditing
   */
  public trackSensitiveOperation(
    operation: string,
    userId: string,
    details: Record<string, any>,
  ): void {
    if (!this.options.sensitiveOperationsTracking) return;

    this.recordSecurityEvent({
      type: "sensitive-operation",
      details: {
        operation,
        userId,
        ...details,
      },
      severity: "medium",
    });
  }

  /**
   * Gets all recorded security events
   */
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Clears all recorded security events
   */
  public clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  /**
   * Checks if a string contains SQL injection patterns
   */
  private containsSqlInjectionPatterns(input: string): boolean {
    const sqlPatterns = [
      /('|\\s)\s*OR\s+.*?=.*?/i,
      /('|\\s)\s*AND\s+.*?=.*?/i,
      /--\s/,
      /;\s*DROP\s+TABLE/i,
      /;\s*DELETE\s+FROM/i,
      /UNION\s+SELECT/i,
      /EXEC\s*\(/i,
      /CONCAT\s*\(/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Checks if a string contains XSS patterns
   */
  private containsXssPatterns(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/i,
      /javascript\s*:/i,
      /on\w+\s*=\s*["']?[^"']*["']?/i,
      /<img[^>]+\s+onerror\s*=/i,
      /<iframe[^>]*>/i,
      /document\.cookie/i,
      /document\.location/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Checks if an object contains prototype pollution attempts
   */
  private containsPrototypePollutionAttempt(obj: Record<string, any>): boolean {
    const dangerousProps = ["__proto__", "constructor", "prototype"];

    return Object.keys(obj).some((key) => dangerousProps.includes(key));
  }

  /**
   * Gets the appropriate logger method based on severity
   */
  private getLogMethodForSeverity(
    severity: SecurityEvent["severity"],
  ): (message: string) => void {
    switch (severity) {
      case "critical":
      case "high":
        return logger.error.bind(logger);
      case "medium":
        return logger.warn.bind(logger);
      case "low":
      default:
        return logger.info.bind(logger);
    }
  }
}

export const securityAuditService = SecurityAuditService.getInstance();
