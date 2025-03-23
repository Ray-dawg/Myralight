import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDocumentationTable() {
  try {
    // Check if the documents table exists
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "documents");

    if (tablesError) {
      console.error("Error checking for documents table:", tablesError);
      return;
    }

    // If the table doesn't exist, we'll create it via SQL
    if (!tables || tables.length === 0) {
      console.log("Creating documents table...");

      const { error: createError } = await supabase.rpc("exec_sql", {
        sql_string: `
          CREATE TABLE public.documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT[] DEFAULT '{}',
            file_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            author TEXT NOT NULL,
            role TEXT NOT NULL
          );
          
          CREATE INDEX idx_documents_role ON public.documents(role);
          CREATE INDEX idx_documents_category ON public.documents(category);
        `,
      });

      if (createError) {
        console.error("Error creating documents table:", createError);
        return;
      }

      console.log("Documents table created successfully");
    } else {
      console.log("Documents table already exists");
    }

    // Insert sample documentation
    await insertSampleDocumentation();

    console.log("Documentation setup complete!");
  } catch (error) {
    console.error("Error setting up documentation:", error);
  }
}

async function insertSampleDocumentation() {
  // Insert shipper guide
  const shipperGuide = {
    title: "Shipper User Guide",
    description: "Complete guide for shippers on creating and managing loads",
    category: "user-guide",
    tags: ["shipper", "load-creation", "getting-started"],
    author: "System",
    role: "shipper",
    content: `
      <div class="prose max-w-none">
        <h1>Shipper User Guide</h1>
        <p>Welcome to the Modern Trucking SaaS platform. This guide will help you understand how to create and manage loads as a shipper.</p>
        
        <h2>Getting Started</h2>
        <p>As a shipper, you can create new loads, track existing shipments, and manage your shipping operations efficiently.</p>
        
        <h2>Creating a New Load</h2>
        <ol>
          <li>
            <strong>Navigate to Load Creation</strong>
            <p>From your dashboard, click on the "Create Shipment" button in the top right corner.</p>
          </li>
          <li>
            <strong>Enter Load Details</strong>
            <p>Fill out the load creation form with the following information:</p>
            <ul>
              <li><strong>Pickup Location:</strong> Enter the city, state, and ZIP code (e.g., "Chicago, IL, 60601")</li>
              <li><strong>Delivery Location:</strong> Enter the city, state, and ZIP code (e.g., "Detroit, MI, 48226")</li>
              <li><strong>Commodity:</strong> Select the type of goods being transported</li>
              <li><strong>Weight:</strong> Enter the weight in pounds</li>
              <li><strong>Dimensions:</strong> (Optional) Enter the dimensions in the format "L × W × H" in inches</li>
              <li><strong>Delivery Date:</strong> Select the expected delivery date</li>
              <li><strong>Delivery Time:</strong> Select the expected delivery time</li>
              <li><strong>Budget:</strong> (Optional) Enter your budget for this shipment</li>
              <li><strong>Special Instructions:</strong> (Optional) Add any special handling instructions</li>
            </ul>
          </li>
          <li>
            <strong>Submit the Form</strong>
            <p>Click the "Create Shipment" button to submit your load.</p>
          </li>
          <li>
            <strong>Confirmation</strong>
            <p>You'll receive a confirmation message with the load reference number.</p>
          </li>
        </ol>
        
        <h2>Managing Your Shipments</h2>
        <ol>
          <li>
            <strong>Navigate to Shipments</strong>
            <p>Click on "My Shipments" in the navigation menu.</p>
          </li>
          <li>
            <strong>View Shipments</strong>
            <p>You'll see a list of all your shipments with key information:</p>
            <ul>
              <li>Reference number</li>
              <li>Status</li>
              <li>Pickup and delivery locations</li>
              <li>Delivery date</li>
              <li>Carrier (if assigned)</li>
            </ul>
          </li>
          <li>
            <strong>Filter and Search</strong>
            <p>Use the search bar to find specific shipments by reference number or commodity.</p>
            <p>Use the status filters to view shipments by status (Draft, Submitted, Assigned, In Transit, Delivered).</p>
          </li>
          <li>
            <strong>View Details</strong>
            <p>Click on a shipment to view its details, including:</p>
            <ul>
              <li>Pickup and delivery information</li>
              <li>Commodity and weight</li>
              <li>Budget</li>
              <li>Status updates</li>
              <li>Carrier information (if assigned)</li>
            </ul>
          </li>
        </ol>
        
        <h2>Tracking Shipments</h2>
        <p>Once a carrier has been assigned to your load, you can track the shipment's progress:</p>
        <ol>
          <li>
            <strong>Navigate to Shipment Details</strong>
            <p>Click on the shipment you want to track.</p>
          </li>
          <li>
            <strong>View Status Updates</strong>
            <p>The current status will be displayed prominently at the top of the page.</p>
            <p>Status changes will be recorded in the shipment's event history.</p>
          </li>
          <li>
            <strong>Track Location</strong>
            <p>If the carrier has enabled location tracking, you'll see the current location on a map.</p>
          </li>
        </ol>
        
        <h2>Managing Documents</h2>
        <p>You can view and download documents related to your shipments:</p>
        <ol>
          <li>
            <strong>Navigate to Shipment Details</strong>
            <p>Click on the shipment you want to view documents for.</p>
          </li>
          <li>
            <strong>View Documents</strong>
            <p>Scroll down to the "Documents" section to see all related documents.</p>
          </li>
          <li>
            <strong>Download Documents</strong>
            <p>Click the download button next to any document to download it.</p>
          </li>
        </ol>
        
        <h2>Troubleshooting</h2>
        <h3>Common Issues</h3>
        <h4>Load Creation Errors</h4>
        <ul>
          <li>
            <strong>Invalid Address Format</strong>
            <p>Ensure addresses are in the format "City, State, ZIP" (e.g., "Chicago, IL, 60601").</p>
          </li>
          <li>
            <strong>Weight Format</strong>
            <p>Weight must be a number. Do not include units (e.g., enter "5000" not "5000 lbs").</p>
          </li>
          <li>
            <strong>Delivery Date in the Past</strong>
            <p>The delivery date and time must be in the future.</p>
          </li>
        </ul>
        
        <h4>Shipment Not Visible</h4>
        <ul>
          <li>
            <strong>Check Filters</strong>
            <p>Ensure you haven't applied filters that might be hiding the shipment.</p>
          </li>
          <li>
            <strong>Refresh the Page</strong>
            <p>Try refreshing the page to update the shipment list.</p>
          </li>
        </ul>
        
        <h2>Getting Help</h2>
        <p>If you need assistance, you can:</p>
        <ul>
          <li>Click on the "Help" button in the navigation menu</li>
          <li>Contact support at support@moderntrucker.com</li>
          <li>Call our support line at 1-800-SHIP-NOW</li>
        </ul>
      </div>
    `,
  };

  // Insert carrier guide
  const carrierGuide = {
    title: "Carrier User Guide",
    description: "Complete guide for carriers on managing and fulfilling loads",
    category: "user-guide",
    tags: ["carrier", "load-management", "getting-started"],
    author: "System",
    role: "carrier",
    content: `
      <div class="prose max-w-none">
        <h1>Carrier User Guide</h1>
        <p>Welcome to the Modern Trucking SaaS platform. This guide will help you understand how to find, accept, and manage loads as a carrier.</p>
        
        <h2>Getting Started</h2>
        <p>As a carrier, you can browse available loads, submit bids, manage your fleet, and track shipments in progress.</p>
        
        <h2>Finding Available Loads</h2>
        <ol>
          <li>
            <strong>Navigate to Load Board</strong>
            <p>From your dashboard, click on "Load Board" in the navigation menu.</p>
          </li>
          <li>
            <strong>Browse Loads</strong>
            <p>You'll see a list of available loads with key information:</p>
            <ul>
              <li>Pickup and delivery locations</li>
              <li>Pickup and delivery dates</li>
              <li>Commodity and weight</li>
              <li>Equipment requirements</li>
              <li>Rate (if specified)</li>
            </ul>
          </li>
          <li>
            <strong>Filter Loads</strong>
            <p>Use the filters to narrow down loads by:</p>
            <ul>
              <li>Origin/destination</li>
              <li>Date range</li>
              <li>Equipment type</li>
              <li>Weight range</li>
            </ul>
          </li>
          <li>
            <strong>View Load Details</strong>
            <p>Click on a load to view its complete details.</p>
          </li>
        </ol>
        
        <h2>Bidding on Loads</h2>
        <ol>
          <li>
            <strong>Select a Load</strong>
            <p>From the load board or load details page, click the "Bid" button.</p>
          </li>
          <li>
            <strong>Enter Bid Details</strong>
            <p>Enter your bid amount and any notes for the shipper.</p>
          </li>
          <li>
            <strong>Submit Bid</strong>
            <p>Click "Submit Bid" to send your offer to the shipper.</p>
          </li>
          <li>
            <strong>Track Bid Status</strong>
            <p>You can view the status of your bids in the "My Bids" section.</p>
          </li>
        </ol>
        
        <h2>Managing Assigned Loads</h2>
        <ol>
          <li>
            <strong>Navigate to My Loads</strong>
            <p>Click on "My Loads" in the navigation menu.</p>
          </li>
          <li>
            <strong>View Assigned Loads</strong>
            <p>You'll see all loads assigned to your company.</p>
          </li>
          <li>
            <strong>Assign Driver and Vehicle</strong>
            <p>For each load, you need to assign a driver and vehicle:</p>
            <ol>
              <li>Click on the load</li>
              <li>Click "Assign Resources"</li>
              <li>Select a driver from your fleet</li>
              <li>Select an appropriate vehicle</li>
              <li>Click "Confirm Assignment"</li>
            </ol>
          </li>
          <li>
            <strong>Track Load Progress</strong>
            <p>Monitor the status of each load as it progresses through the delivery cycle.</p>
          </li>
        </ol>
        
        <h2>Managing Your Fleet</h2>
        <ol>
          <li>
            <strong>Navigate to Fleet Management</strong>
            <p>Click on "Fleet" in the navigation menu.</p>
          </li>
          <li>
            <strong>View Drivers</strong>
            <p>The "Drivers" tab shows all drivers in your fleet, their status, and current assignment.</p>
          </li>
          <li>
            <strong>View Vehicles</strong>
            <p>The "Vehicles" tab shows all vehicles, their status, and current assignment.</p>
          </li>
          <li>
            <strong>Add Driver</strong>
            <p>Click "Add Driver" to register a new driver in your fleet.</p>
          </li>
          <li>
            <strong>Add Vehicle</strong>
            <p>Click "Add Vehicle" to register a new vehicle in your fleet.</p>
          </li>
        </ol>
        
        <h2>Managing Documents</h2>
        <p>You can upload and manage documents related to your loads:</p>
        <ol>
          <li>
            <strong>Navigate to Load Details</strong>
            <p>Click on the load you want to manage documents for.</p>
          </li>
          <li>
            <strong>View Documents</strong>
            <p>Scroll down to the "Documents" section to see all related documents.</p>
          </li>
          <li>
            <strong>Upload Document</strong>
            <p>Click "Upload Document" to add a new document:</p>
            <ol>
              <li>Select the document type (e.g., Bill of Lading, Proof of Delivery)</li>
              <li>Enter a name for the document</li>
              <li>Select the file from your computer</li>
              <li>Click "Upload"</li>
            </ol>
          </li>
        </ol>
        
        <h2>Troubleshooting</h2>
        <h3>Common Issues</h3>
        <h4>Unable to Bid on Load</h4>
        <ul>
          <li>
            <strong>Verify Account Status</strong>
            <p>Ensure your carrier account is fully verified and active.</p>
          </li>
          <li>
            <strong>Check Equipment Match</strong>
            <p>Verify that you have the required equipment type in your fleet.</p>
          </li>
        </ul>
        
        <h4>Cannot Assign Driver</h4>
        <ul>
          <li>
            <strong>Check Driver Availability</strong>
            <p>Ensure the driver is not already assigned to another load during the same time period.</p>
          </li>
          <li>
            <strong>Verify Driver Qualifications</strong>
            <p>Confirm the driver has the necessary qualifications for the load (e.g., hazmat certification if required).</p>
          </li>
        </ul>
        
        <h2>Getting Help</h2>
        <p>If you need assistance, you can:</p>
        <ul>
          <li>Click on the "Help" button in the navigation menu</li>
          <li>Contact support at support@moderntrucker.com</li>
          <li>Call our carrier support line at 1-800-CARRY-IT</li>
        </ul>
      </div>
    `,
  };

  // Insert driver guide
  const driverGuide = {
    title: "Driver User Guide",
    description: "Complete guide for drivers on managing trips and deliveries",
    category: "user-guide",
    tags: ["driver", "trip-management", "getting-started"],
    author: "System",
    role: "driver",
    content: `
      <div class="prose max-w-none">
        <h1>Driver User Guide</h1>
        <p>Welcome to the Modern Trucking SaaS platform. This guide will help you understand how to manage your trips and deliveries as a driver.</p>
        
        <h2>Getting Started</h2>
        <p>As a driver, you can view your assigned trips, update load status, manage documents, and communicate with dispatchers and shippers.</p>
        
        <h2>Viewing Your Assignments</h2>
        <ol>
          <li>
            <strong>Navigate to My Trips</strong>
            <p>From your dashboard, click on "My Trips" in the navigation menu.</p>
          </li>
          <li>
            <strong>View Upcoming Trips</strong>
            <p>The "Upcoming" tab shows all trips assigned to you that haven't started yet.</p>
          </li>
          <li>
            <strong>View Active Trips</strong>
            <p>The "Active" tab shows trips that are currently in progress.</p>
          </li>
          <li>
            <strong>View Completed Trips</strong>
            <p>The "Completed" tab shows your delivery history.</p>
          </li>
        </ol>
        
        <h2>Starting a Trip</h2>
        <ol>
          <li>
            <strong>Select the Trip</strong>
            <p>From the "Upcoming" tab, click on the trip you're ready to start.</p>
          </li>
          <li>
            <strong>Review Details</strong>
            <p>Review all trip details, including:</p>
            <ul>
              <li>Pickup and delivery locations</li>
              <li>Pickup and delivery windows</li>
              <li>Commodity and weight</li>
              <li>Special instructions</li>
            </ul>
          </li>
          <li>
            <strong>Start Trip</strong>
            <p>Click the "Start Trip" button when you're ready to begin.</p>
          </li>
          <li>
            <strong>Enable Location Tracking</strong>
            <p>When prompted, allow the app to track your location for accurate ETA updates.</p>
          </li>
        </ol>
        
        <h2>Updating Load Status</h2>
        <ol>
          <li>
            <strong>Navigate to Current Trip</strong>
            <p>From your dashboard or "Active" trips tab, select your current trip.</p>
          </li>
          <li>
            <strong>Update Status</strong>
            <p>Use the status buttons to update the load status:</p>
            <ul>
              <li><strong>Arrived at Pickup:</strong> When you arrive at the pickup location</li>
              <li><strong>Loaded:</strong> When the load has been loaded onto your vehicle</li>
              <li><strong>In Transit:</strong> When you've left the pickup location</li>
              <li><strong>Arrived at Delivery:</strong> When you arrive at the delivery location</li>
              <li><strong>Delivered:</strong> When the load has been successfully delivered</li>
            </ul>
          </li>
          <li>
            <strong>Add Notes</strong>
            <p>You can add notes with each status update to provide additional information.</p>
          </li>
        </ol>
        
        <h2>Managing Documents</h2>
        <ol>
          <li>
            <strong>Navigate to Current Trip</strong>
            <p>Select your current trip from the dashboard or "Active" trips tab.</p>
          </li>
          <li>
            <strong>View Documents</strong>
            <p>Scroll down to the "Documents" section to see all related documents.</p>
          </li>
          <li>
            <strong>Upload Document</strong>
            <p>Click "Upload Document" to add a new document:</p>
            <ol>
              <li>Select the document type (e.g., Bill of Lading, Proof of Delivery)</li>
              <li>Take a photo or select a file from your device</li>
              <li>Add any necessary notes</li>
              <li>Click "Upload"</li>
            </ol>
          </li>
        </ol>
        
        <h2>Reporting Issues</h2>
        <ol>
          <li>
            <strong>Navigate to Current Trip</strong>
            <p>Select your current trip from the dashboard or "Active" trips tab.</p>
          </li>
          <li>
            <strong>Report Issue</strong>
            <p>Click the "Report Issue" button.</p>
          </li>
          <li>
            <strong>Select Issue Type</strong>
            <p>Choose the type of issue from the dropdown menu:</p>
            <ul>
              <li>Delay</li>
              <li>Mechanical Problem</li>
              <li>Load Issue</li>
              <li>Weather</li>
              <li>Other</li>
            </ul>
          </li>
          <li>
            <strong>Describe the Issue</strong>
            <p>Enter details about the issue and any actions you're taking.</p>
          </li>
          <li>
            <strong>Submit Report</strong>
            <p>Click "Submit" to notify your dispatcher and the shipper about the issue.</p>
          </li>
        </ol>
        
        <h2>Completing a Trip</h2>
        <ol>
          <li>
            <strong>Update Status to Delivered</strong>
            <p>Once the load has been delivered, update the status to "Delivered".</p>
          </li>
          <li>
            <strong>Upload Proof of Delivery</strong>
            <p>Upload the signed proof of delivery document.</p>
          </li>
          <li>
            <strong>Complete Trip</strong>
            <p>Click the "Complete Trip" button to finalize the delivery.</p>
          </li>
          <li>
            <strong>Rate the Experience</strong>
            <p>Optionally, you can rate your experience with the shipper and pickup/delivery locations.</p>
          </li>
        </ol>
        
        <h2>Troubleshooting</h2>
        <h3>Common Issues</h3>
        <h4>Unable to Update Status</h4>
        <ul>
          <li>
            <strong>Check Internet Connection</strong>
            <p>Ensure you have a stable internet connection.</p>
          </li>
          <li>
            <strong>Verify Location</strong>
            <p>Make sure you're at or near the correct location for status updates that require geofencing.</p>
          </li>
        </ul>
        
        <h4>Document Upload Failures</h4>
        <ul>
          <li>
            <strong>Check File Size</strong>
            <p>Ensure the file isn't too large (max 10MB).</p>
          </li>
          <li>
            <strong>Check File Format</strong>
            <p>Use supported formats (JPG, PNG, PDF).</p>
          </li>
        </ul>
        
        <h2>Getting Help</h2>
        <p>If you need assistance, you can:</p>
        <ul>
          <li>Click on the "Help" button in the navigation menu</li>
          <li>Contact your dispatcher through the in-app messaging</li>
          <li>Call driver support at 1-800-DRIVE-IT</li>
        </ul>
      </div>
    `,
  };

  // Insert admin guide
  const adminGuide = {
    title: "Admin User Guide",
    description: "Complete guide for administrators on managing the platform",
    category: "user-guide",
    tags: ["admin", "system-management", "getting-started"],
    author: "System",
    role: "admin",
    content: `
      <div class="prose max-w-none">
        <h1>Administrator User Guide</h1>
        <p>Welcome to the Modern Trucking SaaS platform. This guide will help you understand how to manage the platform as an administrator.</p>
        
        <h2>Getting Started</h2>
        <p>As an administrator, you have complete access to all aspects of the platform, including user management, load management, carrier management, and system settings.</p>
        
        <h2>Dashboard Overview</h2>
        <p>The admin dashboard provides a comprehensive overview of the platform's activity:</p>
        <ul>
          <li><strong>Active Loads:</strong> Number of loads currently in transit</li>
          <li><strong>Pending Loads:</strong> Number of loads awaiting carrier assignment</li>
          <li><strong>Completed Loads:</strong> Number of successfully delivered loads</li>
          <li><strong>Active Users:</strong> Number of users currently active on the platform</li>
          <li><strong>System Health:</strong> Status of various system components</li>
          <li><strong>Recent Activity:</strong> Log of recent significant actions</li>
        </ul>
        
        <h2>User Management</h2>
        <ol>
          <li>
            <strong>Navigate to User Management</strong>
            <p>Click on "Users" in the admin navigation menu.</p>
          </li>
          <li>
            <strong>View Users</strong>
            <p>You'll see a list of all users with key information:</p>
            <ul>
              <li>Name and email</li>
              <li>Role (Shipper, Carrier, Driver, Admin)</li>
              <li>Status (Active, Inactive, Pending)</li>
              <li>Last login date</li>
            </ul>
          </li>
          <li>
            <strong>Filter Users</strong>
            <p>Use the filters to narrow down users by role, status, or search by name/email.</p>
          </li>
          <li>
            <strong>Manage User</strong>
            <p>Click on a user to manage their account:</p>
            <ul>
              <li><strong>Edit Profile:</strong> Update user information</li>
              <li><strong>Change Role:</strong> Modify user permissions</li>
              <li><strong>Activate/Deactivate:</strong> Change user status</li>
              <li><strong>Reset Password:</strong> Send password reset link</li>
            </ul>
          </li>
          <li>
            <strong>Create User</strong>
            <p>Click "Add User" to create a new user account:</p>
            <ol>
              <li>Enter user details (name, email, etc.)</li>
              <li>Select user role</li>
              <li>Set initial password or send setup email</li>
              <li>Click "Create User"</li>
            </ol>
          </li>
        </ol>
        
        <h2>Load Management</h2>
        <ol>
          <li>
            <strong>Navigate to Load Management</strong>
            <p>Click on "Loads" in the admin navigation menu.</p>
          </li>
          <li>
            <strong>View All Loads</strong>
            <p>You'll see a list of all loads in the system with key information.</p>
          </li>
          <li>
            <strong>Filter Loads</strong>
            <p>Use the filters to narrow down loads by status, shipper, carrier, date range, etc.</p>
          </li>
          <li>
            <strong>Manage Load</strong>
            <p>Click on a load to manage it:</p>
            <ul>
              <li><strong>View Details:</strong> See complete load information</li>
              <li><strong>Edit Load:</strong> Modify load details</li>
              <li><strong>Assign Carrier:</strong> Manually assign a carrier to the load</li>
              <li><strong>Change Status:</strong> Update the load status</li>
              <li><strong>View Documents:</strong> Access all load-related documents</li>
              <li><strong>View History:</strong> See the complete event history for the load</li>
            </ul>
          </li>
          <li>
            <strong>Create Load</strong>
            <p>Click "Create Load" to manually create a new load in the system.</p>
          </li>
        </ol>
        
        <h2>Carrier Management</h2>
        <ol>
          <li>
            <strong>Navigate to Carrier Management</strong>
            <p>Click on "Carriers" in the admin navigation menu.</p>
          </li>
          <li>
            <strong>View Carriers</strong>
            <p>You'll see a list of all carriers with key information:</p>
            <ul>
              <li>Company name</li>
              <li>DOT number</li>
              <li>Fleet size</li>
              <li>Verification status</li>
              <li>Rating</li>
            </ul>
          </li>
          <li>
            <strong>Manage Carrier</strong>
            <p>Click on a carrier to manage their account:</p>
            <ul>
              <li><strong>View Details:</strong> See complete carrier information</li>
              <li><strong>Edit Profile:</strong> Update carrier information</li>
              <li><strong>Verify Carrier:</strong> Approve carrier documentation</li>
              <li><strong>View Fleet:</strong> See all drivers and vehicles</li>
              <li><strong>View Performance:</strong> Review carrier metrics and ratings</li>
            </ul>
          </li>
          <li>
            <strong>Add Carrier</strong>
            <p>Click "Add Carrier" to manually create a new carrier account.</p>
          </li>
        </ol>
        
        <h2>System Settings</h2>
        <ol>
          <li>
            <strong>Navigate to Settings</strong>
            <p>Click on "Settings" in the admin navigation menu.</p>
          </li>
          <li>
            <strong>General Settings</strong>
            <p>Configure system-wide settings:</p>
            <ul>
              <li>Company information</li>
              <li>Email templates</li>
              <li>Notification preferences</li>
              <li>Default values</li>
            </ul>
          </li>
          <li>
            <strong>Security Settings</strong>
            <p>Manage security configurations:</p>
            <ul>
              <li>Password policies</li>
              <li>Session timeouts</li>
              <li>Two-factor authentication requirements</li>
              <li>API access controls</li>
            </ul>
          </li>
          <li>
            <strong>Integration Settings</strong>
            <p>Configure third-party integrations:</p>
            <ul>
              <li>Payment processors</li>
              <li>Map providers</li>
              <li>Document storage</li>
              <li>External APIs</li>
            </ul>
          </li>
        </ol>
        
        <h2>Reports and Analytics</h2>
        <ol>
          <li>
            <strong>Navigate to Reports</strong>
            <p>Click on "Reports" in the admin navigation menu.</p>
          </li>
          <li>
            <strong>View Standard Reports</strong>
            <p>Access pre-configured reports:</p>
            <ul>
              <li>Load Volume Report</li>
              <li>Carrier Performance Report</li>
              <li>On-Time Delivery Report</li>
              <li>User Activity Report</li>
            </ul>
          </li>
          <li>
            <strong>Create Custom Report</strong>
            <p>Click "Custom Report" to build a tailored report:</p>
            <ol>
              <li>Select data sources</li>
              <li>Choose metrics and dimensions</li>
              <li>Set filters and date ranges</li>
              <li>Configure visualization options</li>
              <li>Save or export the report</li>
            </ol>
          </li>
        </ol>
        
        <h2>Audit Logs</h2>
        <ol>
          <li>
            <strong>Navigate to Audit Logs</strong>
            <p>Click on "Audit Logs" in the admin navigation menu.</p>
          </li>
          <li>
            <strong>View System Activity</strong>
            <p>Browse a comprehensive log of all system activity:</p>
            <ul>
              <li>User logins and logouts</li>
              <li>Data modifications</li>
              <li>Permission changes</li>
              <li>System setting updates</li>
            </ul>
          </li>
          <li>
            <strong>Filter Logs</strong>
            <p>Use the filters to narrow down logs by user, action type, date range, etc.</p>
          </li>
          <li>
            <strong>Export Logs</strong>
            <p>Click "Export" to download logs for external analysis or archiving.</p>
          </li>
        </ol>
        
        <h2>Troubleshooting</h2>
        <h3>Common Issues</h3>
        <h4>User Access Problems</h4>
        <ul>
          <li>
            <strong>Check User Status</strong>
            <p>Ensure the user account is active.</p>
          </li>
          <li>
            <strong>Verify Permissions</strong>
            <p>Confirm the user has the correct role and permissions.</p>
          </li>
          <li>
            <strong>Check Authentication Logs</strong>
            <p>Review login attempts in the audit logs.</p>
          </li>
        </ul>
        
        <h4>System Performance Issues</h4>
        <ul>
          <li>
            <strong>Check System Health</strong>
            <p>Review the system health dashboard for any component issues.</p>
          </li>
          <li>
            <strong>Monitor Resource Usage</strong>
            <p>Check database and server resource utilization.</p>
          </li>
          <li>
            <strong>Review Error Logs</strong>
            <p>Check system logs for errors or warnings.</p>
          </li>
        </ul>
        
        <h2>Getting Help</h2>
        <p>If you need assistance, you can:</p>
        <ul>
          <li>Contact the technical support team at admin-support@moderntrucker.com</li>
          <li>Call the admin support line at 1-800-ADMIN-HELP</li>
          <li>Access the admin knowledge base at help.moderntrucker.com/admin</li>
        </ul>
      </div>
    `,
  };

  // Insert API documentation
  const apiDocumentation = {
    title: "API Reference",
    description: "Comprehensive documentation of the Convex API endpoints",
    category: "api",
    tags: ["api", "development", "reference"],
    author: "System",
    role: "developer",
    content: `
      <div class="prose max-w-none">
        <h1>API Reference</h1>
        <p>This documentation provides comprehensive information about the Convex API endpoints used in the logistics platform.</p>
        
        <h2>Load Management API</h2>
        
        <h3>createLoad</h3>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Create a new load
export const createLoad = mutation({
  args: {
    loadType: v.union(
      v.literal("ftl"),
      v.literal("ltl"),
      v.literal("partial"),
      v.literal("expedited"),
    ),
    equipmentType: v.string(),
    pickupLocationId: v.id("locations"),
    pickupWindowStart: v.number(),
    pickupWindowEnd: v.number(),
    pickupInstructions: v.optional(v.string()),
    deliveryLocationId: v.id("locations"),
    deliveryWindowStart: v.number(),
    deliveryWindowEnd: v.number(),
    deliveryInstructions: v.optional(v.string()),
    commodity: v.string(),
    weight: v.number(),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
    hazmat: v.boolean(),
    rate: v.optional(v.number()),
    notes: v.optional(v.string()),
    trackingEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Implementation details
  },
});
          </code>
        </pre>
        
        <h4>Parameters</h4>
        <ul>
          <li><strong>loadType</strong>: Type of load (ftl, ltl, partial, expedited)</li>
          <li><strong>equipmentType</strong>: Type of equipment needed</li>
          <li><strong>pickupLocationId</strong>: ID of the pickup location</li>
          <li><strong>pickupWindowStart</strong>: Start of pickup window (timestamp)</li>
          <li><strong>pickupWindowEnd</strong>: End of pickup window (timestamp)</li>
          <li><strong>deliveryLocationId</strong>: ID of the delivery location</li>
          <li><strong>deliveryWindowStart</strong>: Start of delivery window (timestamp)</li>
          <li><strong>deliveryWindowEnd</strong>: End of delivery window (timestamp)</li>
          <li><strong>commodity</strong>: Type of goods being transported</li>
          <li><strong>weight</strong>: Weight in pounds</li>
          <li><strong>dimensions</strong>: Optional dimensions object (length, width, height)</li>
          <li><strong>hazmat</strong>: Whether the load contains hazardous materials</li>
          <li><strong>rate</strong>: Optional rate in cents</li>
          <li><strong>notes</strong>: Optional notes</li>
          <li><strong>trackingEnabled</strong>: Whether tracking is enabled</li>
        </ul>
        
        <h4>Returns</h4>
        <ul>
          <li><strong>loadId</strong>: ID of the created load</li>
          <li><strong>referenceNumber</strong>: Reference number for the load</li>
        </ul>
        
        <h3>getShipperLoads</h3>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Get loads for a shipper
export const getShipperLoads = query({
  handler: async (ctx) => {
    // Implementation details
  },
});
          </code>
        </pre>
        
        <h4>Returns</h4>
        <p>Array of load objects with associated location data</p>
        
        <h2>Location Management API</h2>
        
        <h3>createLocation</h3>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Create a new location
export const createLocation = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    coordinates: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    locationType: v.union(
      v.literal("warehouse"),
      v.literal("distribution_center"),
      v.literal("port"),
      v.literal("terminal"),
      v.literal("customer_location"),
      v.literal("other"),
    ),
    specialInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Implementation details
  },
});
          </code>
        </pre>
        
        <h4>Parameters</h4>
        <ul>
          <li><strong>name</strong>: Location name</li>
          <li><strong>address</strong>: Street address</li>
          <li><strong>city</strong>: City</li>
          <li><strong>state</strong>: State/province</li>
          <li><strong>zipCode</strong>: Postal/ZIP code</li>
          <li><strong>country</strong>: Country</li>
          <li><strong>coordinates</strong>: Object with latitude and longitude</li>
          <li><strong>locationType</strong>: Type of location</li>
          <li><strong>specialInstructions</strong>: Optional special instructions</li>
        </ul>
        
        <h4>Returns</h4>
        <ul>
          <li><strong>locationId</strong>: ID of the created location</li>
        </ul>
        
        <h2>Authentication and Authorization</h2>
        <p>All API endpoints require authentication. The Convex backend automatically validates the user's session and permissions.</p>
        
        <h3>Error Handling</h3>
        <p>API endpoints throw errors in the following cases:</p>
        <ul>
          <li><strong>Not authenticated</strong>: User is not logged in</li>
          <li><strong>User not found</strong>: User record doesn't exist in the database</li>
          <li><strong>Permission denied</strong>: User doesn't have permission for the operation</li>
          <li><strong>Validation errors</strong>: Input data doesn't match the expected schema</li>
        </ul>
      </div>
    `,
  };

  // Insert data model documentation
  const dataModelDocumentation = {
    title: "Data Models",
    description: "Comprehensive documentation of the database schema",
    category: "data-model",
    tags: ["schema", "development", "reference"],
    author: "System",
    role: "developer",
    content: `
      <div class="prose max-w-none">
        <h1>Data Models</h1>
        <p>This documentation describes the core data models used in the logistics platform.</p>
        
        <h2>Users</h2>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Users table - stores all user information across roles
users: defineTable({
  email: v.string(),
  name: v.string(),
  role: v.union(
    v.literal("admin"),
    v.literal("shipper"),
    v.literal("carrier"),
    v.literal("driver"),
  ),
  companyName: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  profileImageUrl: v.optional(v.string()),
  isActive: v.boolean(),
  lastLogin: v.optional(v.number()), // Timestamp
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
  // For carriers and drivers
  carrierId: v.optional(v.id("carriers")),
  // For drivers
  licenseNumber: v.optional(v.string()),
  licenseExpiry: v.optional(v.number()), // Timestamp
})
          </code>
        </pre>
        
        <h2>Loads</h2>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Loads table - core entity for freight loads
loads: defineTable({
  // Basic load information
  referenceNumber: v.string(), // Customer-facing load ID
  shipperId: v.id("users"), // User who created the load
  status: v.union(
    v.literal("draft"),
    v.literal("posted"),
    v.literal("assigned"),
    v.literal("in_transit"),
    v.literal("delivered"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  loadType: v.union(
    v.literal("ftl"), // Full Truckload
    v.literal("ltl"), // Less Than Truckload
    v.literal("partial"),
    v.literal("expedited"),
  ),
  equipmentType: v.string(), // e.g., "dry van", "reefer", "flatbed"
  equipmentRequirements: v.optional(v.array(v.string())), // Special requirements

  // Pickup information
  pickupLocationId: v.id("locations"),
  pickupWindowStart: v.number(), // Timestamp
  pickupWindowEnd: v.number(), // Timestamp
  actualPickupTime: v.optional(v.number()), // Timestamp
  pickupInstructions: v.optional(v.string()),

  // Delivery information
  deliveryLocationId: v.id("locations"),
  deliveryWindowStart: v.number(), // Timestamp
  deliveryWindowEnd: v.number(), // Timestamp
  actualDeliveryTime: v.optional(v.number()), // Timestamp
  deliveryInstructions: v.optional(v.string()),

  // Additional stops (if any)
  stops: v.optional(
    v.array(
      v.object({
        locationId: v.id("locations"),
        windowStart: v.number(), // Timestamp
        windowEnd: v.number(), // Timestamp
        actualArrivalTime: v.optional(v.number()), // Timestamp
        instructions: v.optional(v.string()),
        completed: v.boolean(),
      }),
    ),
  ),

  // Cargo information
  commodity: v.string(),
  weight: v.number(), // In pounds
  dimensions: v.optional(
    v.object({
      length: v.number(), // In inches
      width: v.number(), // In inches
      height: v.number(), // In inches
    }),
  ),
  palletCount: v.optional(v.number()),
  pieceCount: v.optional(v.number()),
  hazmat: v.boolean(),
  hazmatDetails: v.optional(v.string()),
  temperatureRequirements: v.optional(
    v.object({
      min: v.number(), // In Fahrenheit
      max: v.number(), // In Fahrenheit
    }),
  ),

  // Assignment information
  carrierId: v.optional(v.id("carriers")),
  driverId: v.optional(v.id("users")),
  vehicleId: v.optional(v.id("vehicles")),
  assignedDate: v.optional(v.number()), // Timestamp

  // Financial information
  rate: v.optional(v.number()), // In cents
  rateType: v.optional(
    v.union(v.literal("flat"), v.literal("per_mile"), v.literal("hourly")),
  ),
  estimatedDistance: v.optional(v.number()), // In miles
  estimatedDuration: v.optional(v.number()), // In minutes
  accessorials: v.optional(
    v.array(
      v.object({
        type: v.string(), // e.g., "detention", "layover", "lumper"
        amount: v.number(), // In cents
        notes: v.optional(v.string()),
      }),
    ),
  ),
  invoiceStatus: v.optional(
    v.union(
      v.literal("not_invoiced"),
      v.literal("invoiced"),
      v.literal("paid"),
    ),
  ),
  invoiceDate: v.optional(v.number()), // Timestamp
  paymentDate: v.optional(v.number()), // Timestamp

  // Tracking and updates
  trackingEnabled: v.boolean(),
  lastLocationUpdate: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
      timestamp: v.number(), // Timestamp
    }),
  ),
  estimatedTimeOfArrival: v.optional(v.number()), // Timestamp

  // Metadata
  tags: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})
          </code>
        </pre>
        
        <h2>Locations</h2>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Locations table - pickup and delivery locations
locations: defineTable({
  name: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
  coordinates: v.object({
    latitude: v.number(),
    longitude: v.number(),
  }),
  contactName: v.optional(v.string()),
  contactPhone: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  locationType: v.union(
    v.literal("warehouse"),
    v.literal("distribution_center"),
    v.literal("port"),
    v.literal("terminal"),
    v.literal("customer_location"),
    v.literal("other"),
  ),
  operatingHours: v.optional(
    v.array(
      v.object({
        day: v.union(
          v.literal("monday"),
          v.literal("tuesday"),
          v.literal("wednesday"),
          v.literal("thursday"),
          v.literal("friday"),
          v.literal("saturday"),
          v.literal("sunday"),
        ),
        openTime: v.string(), // Format: "HH:MM"
        closeTime: v.string(), // Format: "HH:MM"
      }),
    ),
  ),
  specialInstructions: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})
          </code>
        </pre>
        
        <h2>Carriers</h2>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Carriers table - companies that provide transportation services
carriers: defineTable({
  name: v.string(),
  dotNumber: v.string(),
  mcNumber: v.optional(v.string()),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
  contactName: v.string(),
  contactEmail: v.string(),
  contactPhone: v.string(),
  fleetSize: v.number(),
  insuranceProvider: v.optional(v.string()),
  insurancePolicyNumber: v.optional(v.string()),
  insuranceExpiryDate: v.optional(v.number()), // Timestamp
  rating: v.optional(v.number()),
  isVerified: v.boolean(),
  isActive: v.boolean(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})
          </code>
        </pre>
        
        <h2>Vehicles</h2>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Vehicles table - trucks and trailers
vehicles: defineTable({
  carrierId: v.id("carriers"),
  type: v.union(v.literal("truck"), v.literal("trailer")),
  make: v.string(),
  model: v.string(),
  year: v.number(),
  vin: v.string(),
  licensePlate: v.string(),
  state: v.string(),
  equipmentType: v.string(), // e.g., "dry van", "reefer", "flatbed"
  capacity: v.optional(v.number()),
  dimensions: v.optional(
    v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
    }),
  ),
  currentDriverId: v.optional(v.id("users")),
  status: v.union(
    v.literal("active"),
    v.literal("maintenance"),
    v.literal("out_of_service"),
  ),
  lastMaintenanceDate: v.optional(v.number()), // Timestamp
  nextMaintenanceDate: v.optional(v.number()), // Timestamp
  currentLocation: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
      lastUpdated: v.number(), // Timestamp
    }),
  ),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})
          </code>
        </pre>
        
        <h2>Documents</h2>
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
// Documents table - for storing load-related documents
documents: defineTable({
  loadId: v.id("loads"),
  userId: v.id("users"), // User who uploaded the document
  type: v.union(
    v.literal("bill_of_lading"),
    v.literal("proof_of_delivery"),
    v.literal("rate_confirmation"),
    v.literal("invoice"),
    v.literal("weight_ticket"),
    v.literal("lumper_receipt"),
    v.literal("other"),
  ),
  name: v.string(),
  fileUrl: v.string(),
  fileSize: v.number(), // In bytes
  mimeType: v.string(),
  uploadDate: v.number(), // Timestamp
  verificationStatus: v.optional(
    v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
    ),
  ),
  verifiedBy: v.optional(v.id("users")),
  verificationDate: v.optional(v.number()), // Timestamp
  notes: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})
          </code>
        </pre>
        
        <h2>Relationships</h2>
        <p>The data model includes the following key relationships:</p>
        <ul>
          <li>Loads are created by shippers (users with role="shipper")</li>
          <li>Loads reference pickup and delivery locations</li>
          <li>Loads can be assigned to carriers and drivers</li>
          <li>Drivers belong to carriers</li>
          <li>Vehicles belong to carriers</li>
          <li>Documents are associated with loads</li>
        </ul>
      </div>
    `,
  };

  // Insert all the documentation
  try {
    await supabase
      .from("documents")
      .insert([
        shipperGuide,
        carrierGuide,
        driverGuide,
        adminGuide,
        apiDocumentation,
        dataModelDocumentation,
      ]);
    console.log("Sample documentation inserted successfully");
  } catch (error) {
    console.error("Error inserting sample documentation:", error);
  }
}

// Run the setup function
setupDocumentationTable();
