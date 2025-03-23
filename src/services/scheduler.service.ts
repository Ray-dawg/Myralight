import { supabase } from "@/lib/supabase";
import { logger } from "@/api/utils/logger";
import { EmailService } from "./email.service";
import { DocumentService } from "./document.service";
import { PaymentProcessorService } from "./payment-processor.service";

/**
 * Service for handling scheduled tasks and document processing
 */
export class SchedulerService {
  private static instance: SchedulerService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 60000; // Check for tasks every minute

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.isRunning) {
      logger.info("Scheduler is already running");
      return;
    }

    logger.info("Starting scheduler service");
    this.isRunning = true;

    // Run immediately on start
    this.checkForTasks();

    // Set up interval for regular checks
    this.intervalId = setInterval(() => {
      this.checkForTasks();
    }, this.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.info("Scheduler is not running");
      return;
    }

    logger.info("Stopping scheduler service");
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for tasks that need to be executed
   */
  private async checkForTasks(): Promise<void> {
    try {
      // Get all active tasks that are due to run
      const { data: tasks, error } = await supabase
        .from("scheduled_tasks")
        .select("*")
        .eq("is_active", true)
        .lte("next_run_at", new Date().toISOString());

      if (error) {
        logger.error("Error fetching scheduled tasks:", error);
        return;
      }

      if (!tasks || tasks.length === 0) {
        logger.debug("No tasks to run at this time");
        return;
      }

      logger.info(`Found ${tasks.length} tasks to run`);

      // Process each task
      for (const task of tasks) {
        try {
          await this.processTask(task);

          // Update last_run_at and calculate next_run_at
          const now = new Date().toISOString();
          const { error: updateError } = await supabase
            .from("scheduled_tasks")
            .update({
              last_run_at: now,
              updated_at: now,
            })
            .eq("id", task.id);

          if (updateError) {
            logger.error(`Error updating task ${task.id}:`, updateError);
          }

          // Call the database function to calculate the next run time
          const { data: nextRunData, error: nextRunError } = await supabase.rpc(
            "calculate_next_run_time",
            { task_id: task.id },
          );

          if (nextRunError) {
            logger.error(
              `Error calculating next run time for task ${task.id}:`,
              nextRunError,
            );
          } else {
            // Update the next_run_at field
            await supabase
              .from("scheduled_tasks")
              .update({ next_run_at: nextRunData })
              .eq("id", task.id);
          }
        } catch (taskError) {
          logger.error(`Error processing task ${task.id}:`, taskError);
        }
      }
    } catch (error) {
      logger.error("Error in checkForTasks:", error);
    }
  }

  /**
   * Process a specific task
   */
  private async processTask(task: any): Promise<void> {
    logger.info(`Processing task: ${task.name} (${task.id})`);

    switch (task.task_type) {
      case "BOL_SUBMISSION":
        await this.processBolSubmission(task);
        break;
      // Add other task types as needed
      default:
        logger.warn(`Unknown task type: ${task.task_type}`);
    }
  }

  /**
   * Process BOL submission task
   */
  private async processBolSubmission(task: any): Promise<void> {
    try {
      // Get the payment processor configuration
      const { data: processor, error: processorError } = await supabase
        .from("payment_processors")
        .select("*")
        .eq("id", task.processor_id)
        .single();

      if (processorError || !processor) {
        logger.error(
          `Error fetching payment processor for task ${task.id}:`,
          processorError,
        );
        return;
      }

      if (!processor.is_active) {
        logger.warn(
          `Payment processor ${processor.id} is not active, skipping task ${task.id}`,
        );
        return;
      }

      // Get the email configuration if needed
      let emailConfig = null;
      if (processor.processor_type === "EMAIL" && task.email_config_id) {
        const { data: config, error: configError } = await supabase
          .from("email_configurations")
          .select("*")
          .eq("id", task.email_config_id)
          .single();

        if (configError || !config) {
          logger.error(
            `Error fetching email configuration for task ${task.id}:`,
            configError,
          );
          return;
        }

        if (!config.is_active) {
          logger.warn(
            `Email configuration ${config.id} is not active, skipping task ${task.id}`,
          );
          return;
        }

        emailConfig = config;
      }

      // Find BOL documents that need to be processed
      const filterCriteria = task.filter_criteria || {};
      let query = supabase
        .from("documents")
        .select("*")
        .eq("document_type", "BOL");

      // Apply additional filters from filter_criteria
      if (filterCriteria.status) {
        query = query.eq("status", filterCriteria.status);
      }

      if (filterCriteria.created_after) {
        query = query.gte("created_at", filterCriteria.created_after);
      }

      if (filterCriteria.created_before) {
        query = query.lte("created_at", filterCriteria.created_before);
      }

      // Exclude documents that have already been submitted or are in progress
      const { data: existingSubmissions, error: submissionsError } =
        await supabase
          .from("document_submissions")
          .select("document_id")
          .eq("task_id", task.id)
          .in("submission_status", ["PENDING", "SENT", "PROCESSED"]);

      if (
        !submissionsError &&
        existingSubmissions &&
        existingSubmissions.length > 0
      ) {
        const excludeIds = existingSubmissions.map((s) => s.document_id);
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data: documents, error: documentsError } = await query;

      if (documentsError) {
        logger.error(
          `Error fetching documents for task ${task.id}:`,
          documentsError,
        );
        return;
      }

      if (!documents || documents.length === 0) {
        logger.info(`No documents to process for task ${task.id}`);
        return;
      }

      logger.info(
        `Processing ${documents.length} documents for task ${task.id}`,
      );

      // Process each document
      for (const document of documents) {
        try {
          // Create a submission record
          const { data: submission, error: submissionError } = await supabase
            .from("document_submissions")
            .insert([
              {
                document_id: document.id,
                task_id: task.id,
                processor_id: processor.id,
                submission_status: "PENDING",
              },
            ])
            .select()
            .single();

          if (submissionError) {
            logger.error(
              `Error creating submission record for document ${document.id}:`,
              submissionError,
            );
            continue;
          }

          // Process the document based on processor type
          let result;
          if (processor.processor_type === "EMAIL") {
            result = await this.sendDocumentByEmail(
              document,
              processor,
              emailConfig,
            );
          } else if (processor.processor_type === "API") {
            result = await this.sendDocumentByApi(document, processor);
          } else {
            logger.error(
              `Unsupported processor type: ${processor.processor_type}`,
            );
            continue;
          }

          // Update the submission record
          const updateData: any = {
            submission_time: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (result.success) {
            updateData.submission_status = "SENT";
            updateData.response_data = result.data || {};
          } else {
            updateData.submission_status = "FAILED";
            updateData.error_message = result.error || "Unknown error";
            updateData.retry_count = (submission.retry_count || 0) + 1;

            // Schedule a retry if needed
            if (updateData.retry_count < 3) {
              // Exponential backoff: 15 min, 1 hour, 4 hours
              const retryMinutes = Math.pow(4, updateData.retry_count) * 15;
              updateData.next_retry_at = new Date(
                Date.now() + retryMinutes * 60 * 1000,
              ).toISOString();
            }
          }

          await supabase
            .from("document_submissions")
            .update(updateData)
            .eq("id", submission.id);
        } catch (docError) {
          logger.error(`Error processing document ${document.id}:`, docError);
        }
      }
    } catch (error) {
      logger.error(`Error in processBolSubmission for task ${task.id}:`, error);
    }
  }

  /**
   * Send a document via email
   */
  private async sendDocumentByEmail(
    document: any,
    processor: any,
    emailConfig: any,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!emailConfig) {
        return {
          success: false,
          error: "Email configuration is required for email processors",
        };
      }

      if (
        !processor.email_addresses ||
        processor.email_addresses.length === 0
      ) {
        return {
          success: false,
          error: "No recipient email addresses configured",
        };
      }

      // Get the document file from storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (fileError || !fileData) {
        return {
          success: false,
          error: `Failed to download document: ${fileError?.message || "Unknown error"}`,
        };
      }

      // Get load information
      const { data: load, error: loadError } = await supabase
        .from("loads")
        .select("*, pickup_location(*), delivery_location(*)")
        .eq("id", document.load_id)
        .single();

      if (loadError || !load) {
        return {
          success: false,
          error: `Failed to get load information: ${loadError?.message || "Unknown error"}`,
        };
      }

      // Create email service
      const emailService = new EmailService({
        host: emailConfig.smtp_host,
        port: emailConfig.smtp_port,
        secure: emailConfig.smtp_secure,
        auth: {
          user: emailConfig.smtp_username,
          pass: emailConfig.smtp_password,
        },
      });

      // Prepare email content
      const subject = `Bill of Lading for Load ${load.reference_number || load.id}`;
      const text = `Please find attached the Bill of Lading for load ${load.reference_number || load.id}.

Load Details:
- Pickup: ${load.pickup_location?.address || "N/A"}
- Delivery: ${load.delivery_location?.address || "N/A"}
- Date: ${new Date(document.created_at).toLocaleDateString()}

This is an automated message. Please do not reply to this email.`;

      const html = `
        <h2>Bill of Lading for Load ${load.reference_number || load.id}</h2>
        <p>Please find attached the Bill of Lading for the following load:</p>
        <table border="0" cellpadding="5" style="border-collapse: collapse;">
          <tr>
            <td><strong>Load ID:</strong></td>
            <td>${load.reference_number || load.id}</td>
          </tr>
          <tr>
            <td><strong>Pickup:</strong></td>
            <td>${load.pickup_location?.address || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Delivery:</strong></td>
            <td>${load.delivery_location?.address || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Date:</strong></td>
            <td>${new Date(document.created_at).toLocaleDateString()}</td>
          </tr>
        </table>
        <p>This is an automated message. Please do not reply to this email.</p>
      `;

      // Send the email
      const result = await emailService.sendMail({
        from: `"${emailConfig.sender_name}" <${emailConfig.sender_email}>`,
        to: processor.email_addresses.join(","),
        subject,
        text,
        html,
        attachments: [
          {
            filename: document.file_name,
            content: fileData,
            contentType: document.file_type,
          },
        ],
      });

      return {
        success: true,
        data: {
          messageId: result.messageId,
          recipients: result.accepted,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error("Error sending document by email:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }

  /**
   * Send a document via API
   */
  private async sendDocumentByApi(
    document: any,
    processor: any,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!processor.api_endpoint) {
        return {
          success: false,
          error: "API endpoint is required for API processors",
        };
      }

      // Get the document file from storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (fileError || !fileData) {
        return {
          success: false,
          error: `Failed to download document: ${fileError?.message || "Unknown error"}`,
        };
      }

      // Get load information
      const { data: load, error: loadError } = await supabase
        .from("loads")
        .select("*")
        .eq("id", document.load_id)
        .single();

      if (loadError || !load) {
        return {
          success: false,
          error: `Failed to get load information: ${loadError?.message || "Unknown error"}`,
        };
      }

      // Create a form data object
      const formData = new FormData();
      formData.append(
        "document",
        new Blob([fileData], { type: document.file_type }),
        document.file_name,
      );
      formData.append("documentType", "BOL");
      formData.append("loadId", load.id);
      formData.append("referenceNumber", load.reference_number || "");
      formData.append(
        "metadata",
        JSON.stringify({
          documentId: document.id,
          fileName: document.file_name,
          fileType: document.file_type,
          fileSize: document.file_size,
          createdAt: document.created_at,
          loadDetails: {
            id: load.id,
            referenceNumber: load.reference_number,
            status: load.status,
          },
        }),
      );

      // Prepare headers
      const headers: Record<string, string> = {};
      if (processor.api_key) {
        headers["X-API-Key"] = processor.api_key;
      }

      // Send the request
      const response = await fetch(processor.api_endpoint, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const responseData = await response.json();

      return {
        success: true,
        data: responseData,
      };
    } catch (error: any) {
      logger.error("Error sending document by API:", error);
      return {
        success: false,
        error: error.message || "Failed to send document via API",
      };
    }
  }

  /**
   * Manually run a specific task
   */
  public async runTask(taskId: string): Promise<void> {
    try {
      const { data: task, error } = await supabase
        .from("scheduled_tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (error || !task) {
        logger.error(`Error fetching task ${taskId}:`, error);
        throw new Error(`Task not found: ${taskId}`);
      }

      await this.processTask(task);

      // Update last_run_at
      await supabase
        .from("scheduled_tasks")
        .update({
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      logger.info(`Task ${taskId} executed manually`);
    } catch (error) {
      logger.error(`Error running task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Retry failed submissions
   */
  public async retryFailedSubmissions(): Promise<void> {
    try {
      // Get all failed submissions that are due for retry
      const { data: submissions, error } = await supabase
        .from("document_submissions")
        .select("*, documents(*), payment_processors(*), scheduled_tasks(*)")
        .eq("submission_status", "FAILED")
        .lte("next_retry_at", new Date().toISOString())
        .lt("retry_count", 3); // Max 3 retries

      if (error) {
        logger.error("Error fetching failed submissions:", error);
        return;
      }

      if (!submissions || submissions.length === 0) {
        logger.debug("No failed submissions to retry");
        return;
      }

      logger.info(`Retrying ${submissions.length} failed submissions`);

      // Process each submission
      for (const submission of submissions) {
        try {
          // Get the email configuration if needed
          let emailConfig = null;
          if (
            submission.payment_processors.processor_type === "EMAIL" &&
            submission.scheduled_tasks.email_config_id
          ) {
            const { data: config, error: configError } = await supabase
              .from("email_configurations")
              .select("*")
              .eq("id", submission.scheduled_tasks.email_config_id)
              .single();

            if (!configError && config) {
              emailConfig = config;
            }
          }

          // Retry the submission
          let result;
          if (submission.payment_processors.processor_type === "EMAIL") {
            result = await this.sendDocumentByEmail(
              submission.documents,
              submission.payment_processors,
              emailConfig,
            );
          } else if (submission.payment_processors.processor_type === "API") {
            result = await this.sendDocumentByApi(
              submission.documents,
              submission.payment_processors,
            );
          } else {
            logger.error(
              `Unsupported processor type: ${submission.payment_processors.processor_type}`,
            );
            continue;
          }

          // Update the submission record
          const updateData: any = {
            submission_time: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            retry_count: submission.retry_count + 1,
          };

          if (result.success) {
            updateData.submission_status = "SENT";
            updateData.response_data = result.data || {};
            updateData.next_retry_at = null;
          } else {
            updateData.submission_status = "FAILED";
            updateData.error_message = result.error || "Unknown error";

            // Schedule another retry if under the limit
            if (updateData.retry_count < 3) {
              // Exponential backoff
              const retryMinutes = Math.pow(4, updateData.retry_count) * 15;
              updateData.next_retry_at = new Date(
                Date.now() + retryMinutes * 60 * 1000,
              ).toISOString();
            } else {
              updateData.next_retry_at = null; // No more retries
            }
          }

          await supabase
            .from("document_submissions")
            .update(updateData)
            .eq("id", submission.id);
        } catch (subError) {
          logger.error(`Error retrying submission ${submission.id}:`, subError);
        }
      }
    } catch (error) {
      logger.error("Error in retryFailedSubmissions:", error);
    }
  }
}

// Export a singleton instance
export const schedulerService = SchedulerService.getInstance();
