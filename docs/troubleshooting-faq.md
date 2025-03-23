# BOL System Troubleshooting FAQ

## General Issues

### Q: What file types are supported for BOL uploads?

**A:** Our system supports the following file formats:
- PDF documents (.pdf)
- JPEG images (.jpg, .jpeg)
- PNG images (.png)

For best results, we recommend using PDF format whenever possible as it maintains document quality and supports multiple pages.

### Q: What is the maximum file size for uploads?

**A:** The maximum file size is 10MB per document. If your file exceeds this limit, try:
- Reducing the image resolution
- Using PDF compression tools
- Splitting very large documents into multiple files

### Q: How do I know if my BOL upload was successful?

**A:** After a successful upload, you will see:
- A green success message on screen
- The document will appear in your documents list
- You will receive an email confirmation (if enabled)
- The load status will update to reflect the document submission

## Driver-Specific Issues

### Q: The app crashes when I try to upload a BOL document. What should I do?

**A:** Try these troubleshooting steps:
1. Force close the app and restart it
2. Check that your device has sufficient storage space
3. Ensure you're using the latest version of the app
4. Try switching between Wi-Fi and cellular data
5. Restart your device

If the problem persists, contact driver support with your device model and app version.

### Q: I uploaded the wrong document. How do I replace it?

**A:** To replace an incorrectly uploaded document:
1. Go to the load details screen
2. Navigate to the Documents section
3. Find the incorrect document
4. Select "Replace Document" from the options menu
5. Upload the correct document

Note: You can only replace documents that haven't been processed yet. If the document has already been processed, contact your dispatcher or support.

### Q: The camera quality is poor when taking photos of BOL documents. How can I improve it?

**A:** To improve camera quality:
1. Ensure good lighting - natural daylight works best
2. Place the document on a dark, non-reflective surface
3. Hold the camera steady or use a surface to stabilize
4. Make sure the entire document is in frame
5. Use the flash in low-light conditions
6. Clean your camera lens
7. If available, use the "Document" mode in your camera app

### Q: I'm in an area with poor connectivity. How can I upload my BOL?

**A:** When dealing with poor connectivity:
1. The app will automatically retry uploads when connectivity improves
2. You can manually save the document for later upload
3. Try moving to an area with better signal
4. Connect to Wi-Fi if available
5. If persistent issues occur, contact your dispatcher who can make a note in the system

## Carrier/Admin Issues

### Q: A driver uploaded a BOL but I can't see it in the system. Where is it?

**A:** If a BOL is missing from your view:
1. Check the document processing queue for pending items
2. Verify the load number is correct
3. Check if the document failed processing (look in the Errors section)
4. Confirm the driver completed the upload process
5. Check your filter settings - you might be filtering out the document
6. Verify your user permissions allow access to this document

### Q: How do I set up automatic email notifications for new BOL uploads?

**A:** To configure automatic notifications:
1. Go to System Settings > Notifications
2. Select "BOL Processing Notifications"
3. Enable "New BOL Upload" notifications
4. Add email recipients
5. Choose notification frequency (immediate, digest, etc.)
6. Save your settings

You can also customize the notification template under Email Templates.

### Q: The OCR system isn't correctly reading BOL information. How can I improve it?

**A:** To improve OCR accuracy:
1. Ensure drivers are uploading clear, high-resolution documents
2. Adjust OCR sensitivity settings in the admin panel
3. Update the OCR training data with problematic examples
4. For specific carriers or formats, create custom templates
5. Consider manual review for problematic document sources
6. Regularly update the OCR engine to the latest version

### Q: How do I handle disputed BOL information?

**A:** When BOL information is disputed:
1. Go to the document details page
2. Click "Flag for Review"
3. Select "Disputed Information" as the reason
4. Add detailed notes about the dispute
5. Upload any supporting evidence
6. Assign to the appropriate team member for resolution
7. The system will track the dispute resolution process

## Shipper Issues

### Q: I can't access BOL documents for my shipments. What's wrong?

**A:** If you can't access documents:
1. Verify your account has the correct permissions
2. Check if the documents have been uploaded yet
3. Ensure you're looking at the correct shipment
4. Try clearing your browser cache or using a different browser
5. Contact your account manager if the issue persists

### Q: How do I download multiple BOL documents at once?

**A:** To download multiple documents:
1. Go to the Documents section
2. Use the checkboxes to select multiple documents
3. Click the "Bulk Actions" button
4. Select "Download Selected"
5. Choose your preferred format (PDF or ZIP)
6. The system will prepare and download your selected documents

### Q: Can I get automated reports of all BOL activities for my shipments?

**A:** Yes, you can set up automated reporting:
1. Go to Reports > Scheduled Reports
2. Click "Create New Report"
3. Select "BOL Activity Report" from the template list
4. Configure filters (date range, shipment types, etc.)
5. Set the delivery schedule (daily, weekly, monthly)
6. Add email recipients
7. Save your report configuration

## Payment Processing Issues

### Q: Why was a payment rejected after BOL verification?

**A:** Payments might be rejected for several reasons:
1. Missing or incorrect payment information
2. Discrepancies between BOL and agreed rates
3. Payment provider API errors
4. Insufficient funds in the account
5. Duplicate payment detection
6. Fraud prevention triggers

Check the payment error details in the system for specific information.

### Q: How do I reprocess a failed payment?

**A:** To reprocess a failed payment:
1. Go to Payment Processing > Failed Payments
2. Locate the failed payment
3. Review the error details
4. Make necessary corrections
5. Click "Retry Payment"
6. Monitor the payment status

### Q: Can I set up automatic payment rules based on BOL status?

**A:** Yes, you can configure automatic payment rules:
1. Go to Payment Settings > Payment Rules
2. Click "Create New Rule"
3. Set the trigger condition (e.g., "BOL Status = Verified")
4. Configure payment details and timing
5. Set any additional conditions or exceptions
6. Activate the rule

## Technical Issues

### Q: The system is running slowly when processing BOL documents. How can I improve performance?

**A:** To improve system performance:
1. Check server resource utilization
2. Optimize database queries and indexes
3. Increase processing resources during peak times
4. Implement document queue prioritization
5. Archive older documents to reduce database size
6. Upgrade hardware if consistently at capacity

### Q: How do I recover from a system outage that affected BOL processing?

**A:** After a system outage:
1. Verify all services are back online
2. Check the document processing queue for backlog
3. Prioritize critical documents
4. Notify users of any processing delays
5. Monitor system performance as the backlog clears
6. Run validation checks to ensure no documents were lost

### Q: We're migrating to a new TMS. How do we ensure BOL continuity?

**A:** During TMS migration:
1. Export all BOL documents and metadata from the current system
2. Verify the export is complete and accurate
3. Configure the integration between the BOL system and new TMS
4. Import documents and metadata to the new system
5. Run parallel processing during transition
6. Perform validation checks after migration
7. Update user training and documentation

## Security and Compliance

### Q: How long are BOL documents retained in the system?

**A:** Document retention depends on your configuration and compliance requirements:
- Default retention is 7 years for all BOL documents
- Custom retention policies can be set by document type
- Archived documents are stored in secure, compressed storage
- Documents can be retrieved from archives when needed

Check your specific retention policy in System Settings > Document Retention.

### Q: How is BOL data protected in the system?

**A:** We protect BOL data through multiple security measures:
1. All documents are encrypted at rest using AES-256 encryption
2. Data in transit is protected with TLS 1.2 or higher
3. Access controls limit document visibility based on user roles
4. Audit logging tracks all document access and changes
5. Regular security assessments and penetration testing
6. Compliance with industry standards (GDPR, CCPA, etc.)

### Q: Can we restrict BOL access to specific IP addresses or locations?

**A:** Yes, you can implement access restrictions:
1. Go to Security Settings > Access Controls
2. Enable "IP Restriction" feature
3. Add allowed IP addresses or ranges
4. Optionally enable geolocation restrictions
5. Configure exception handling for mobile users
6. Save your security settings

## Getting Additional Help

If your issue isn't covered in this FAQ:

- **Technical Support**: techsupport@example.com or 1-800-XXX-XXXX
- **Driver Support**: driversupport@example.com or 1-800-XXX-XXXX
- **Billing Questions**: billing@example.com or 1-800-XXX-XXXX
- **Live Chat**: Available in the application by clicking the support icon
- **Knowledge Base**: [help.example.com](https://help.example.com)

---

This FAQ is regularly updated based on common support requests. Last updated: [Current Date]
