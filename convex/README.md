# Logistics Application Data Model

## Overview

This directory contains the Convex DB schema for a logistics application's load management system. The schema is designed to support real-time operations, handle multiple user roles (shippers, carriers, drivers, admins), and enable efficient filtering and querying.

## Core Entities

### Users
- Stores all user information across roles (admin, shipper, carrier, driver)
- Contains role-specific fields and references to related entities
- Indexed by email, role, and carrier for efficient querying

### Carriers
- Companies that provide transportation services
- Contains company information, contact details, and compliance data
- Indexed by name, DOT number, and location

### Vehicles
- Trucks and trailers operated by carriers
- Contains vehicle specifications, status, and current assignment
- Indexed by carrier, driver, status, and equipment type

### Locations
- Pickup and delivery locations
- Contains address information, contact details, and operating hours
- Indexed by location (state/city) and type

### Loads
- Core entity for freight loads
- Contains comprehensive information about shipments
- Includes pickup/delivery details, cargo information, assignment, and financial data
- Extensively indexed for various query patterns

### Documents
- Load-related documents (BOL, POD, etc.)
- Contains file metadata, verification status, and references to related entities
- Indexed by load, user, type, and verification status

### Events
- Tracks load status changes and updates
- Provides an audit trail for all load-related activities
- Indexed by load, user, event type, and timestamp

### Bids
- Carrier bids on loads
- Contains bid amount, status, and related notes
- Indexed by load, carrier, user, and status

### Ratings
- Carrier/shipper ratings after load completion
- Contains overall rating, category ratings, and comments
- Indexed by load, users, and carrier

### Notifications
- System notifications for users
- Contains notification details, read status, and action requirements
- Indexed by user, read status, and action required status

## Indexing Strategy

The schema includes carefully designed indexes to support common query patterns:

- Lookup by ID for all entity relationships
- Filtering by status, type, and other categorical fields
- Date-based queries for scheduling and reporting
- Location-based queries for geographic filtering
- User-specific queries for personalized views

## Data Validation

The schema enforces data validation through Convex's validation system:

- Required fields are explicitly marked
- Field types are strictly defined
- Enumerated values are enforced for categorical fields
- Nested object structures are validated

## Usage

To use this schema:

1. Ensure you have Convex set up in your project
2. Import the schema into your Convex configuration
3. Use the provided sample documents as reference for creating and querying data

## Sample Documents

See `loadModel.ts` for sample document structures showing how various entities relate to each other.
