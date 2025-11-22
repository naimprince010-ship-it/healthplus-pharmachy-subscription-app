# HealthPlus Pharmacy Subscription System - System Requirements Document (SRD)

**Version:** 1.0  
**Last Updated:** November 22, 2025  
**Related Documentation:**
- [Architecture & Folder Structure](./ARCHITECTURE.md)
- [Database Schema & ERD](./DATABASE_SCHEMA.md)
- [Tracking Plan](./TRACKING_PLAN.md)
- [Authentication Flow](./AUTH_FLOW.md)
- [API Data Flow](./API_DATA_FLOW.md)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Business Goals](#business-goals)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Core Features](#core-features)
5. [Detailed Workflows](#detailed-workflows)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [Future Modules](#future-modules)
8. [Roadmap](#roadmap)
9. [Change Policy & Constraints](#change-policy--constraints)
10. [Glossary](#glossary)

---

## Project Overview

HealthPlus is a comprehensive online pharmacy platform that enables customers to browse medicines, place orders, subscribe to monthly medicine packs, and upload prescriptions for review. The platform includes a membership program offering discounts and an admin panel for managing inventory, orders, and prescriptions.

**Key Value Propositions:**
- **Convenience:** Order medicines online with home delivery
- **Recurring Revenue:** Membership and subscription models for predictable income
- **Trust & Safety:** Prescription review by admin before fulfillment
- **Customer Loyalty:** Membership discounts encourage repeat purchases

---

## Business Goals

1. **Primary Revenue Streams:**
   - One-time medicine purchases (Cash on Delivery)
   - Membership fees (100 BDT for 30 days, 10% discount on medicines)
   - Monthly subscription packs (recurring revenue)

2. **Customer Acquisition & Retention:**
   - Easy signup with phone or email
   - Membership program to encourage loyalty
   - Subscription convenience for chronic medication needs

3. **Operational Efficiency:**
   - Admin panel for centralized management
   - Prescription verification workflow
   - Order status tracking and fulfillment

4. **Compliance & Safety:**
   - Prescription upload and review for controlled medicines
   - Secure authentication and role-based access
   - Data privacy and PII protection

---

## User Roles & Permissions

### GUEST (Unauthenticated User)

**Can Do:**
- Browse homepage, medicines, categories
- View medicine details and pricing
- View public pages (about, contact, membership info)
- Start signup/signin process

**Cannot Do:**
- Add items to cart
- Place orders
- Purchase membership
- Upload prescriptions
- Access dashboard or admin panel

### USER (Authenticated Customer)

**Can Do:**
- Everything GUEST can do, plus:
- Add medicines to cart and manage cart
- Checkout and place orders (Cash on Delivery)
- Purchase membership (100 BDT, 10% discount, 30 days)
- Create and manage subscriptions
- Upload prescriptions for review
- View order history and order details
- View and manage profile information
- Access user dashboard at `/dashboard`

**Cannot Do:**
- Access admin panel
- Manage medicines, categories, or banners
- Process orders or review prescriptions
- View sales reports or analytics

### ADMIN (Administrator)

**Can Do:**
- Everything USER can do, plus:
- Access admin panel at `/admin`
- Manage medicines (CRUD operations)
- Manage categories (CRUD operations)
- Manage banners (CRUD operations)
- View and process orders (update status)
- Review and approve/reject prescriptions
- View sales reports and analytics
- Manage zones and delivery charges

**Cannot Do:**
- Delete orders (data integrity)
- Modify completed/delivered orders without audit trail
- Access other admin accounts' credentials

---

## Core Features

### 1. Medicine Browsing & Cart

**Description:** Customers can browse medicines by category, search, view details, and add to cart.

**Key Components:**
- Medicine catalog with categories
- Medicine detail pages (name, generic name, manufacturer, price, strength, stock status)
- Shopping cart with quantity management
- Stock availability checking
- Prescription requirement indicators

**Business Rules:**
- Medicines marked as `requiresPrescription: true` should show a warning
- Out-of-stock medicines cannot be added to cart
- Cart persists in session/local storage (client-side for now)
- Membership discount (10%) applies to medicine subtotal only, not delivery

### 2. Checkout & Orders

**Description:** Customers provide delivery address and place orders with Cash on Delivery (COD).

**Payment Methods:**
- **COD (Current):** Cash on Delivery - default and only method
- **Online Payment (Future):** SSLCommerz or Stripe integration planned

**Order Lifecycle:**
1. **PENDING:** Order created, awaiting admin confirmation
2. **CONFIRMED:** Admin confirmed order, preparing for shipment
3. **PROCESSING:** Order being prepared/packed
4. **SHIPPED:** Order dispatched for delivery
5. **DELIVERED:** Order successfully delivered to customer
6. **CANCELLED:** Order cancelled by admin or customer

**Business Rules:**
- Delivery charge based on zone (configured in Zone table)
- Membership discount (10%) applies to medicine subtotal if membership is active
- Order number auto-generated (unique identifier)
- Orders cannot be deleted, only cancelled (audit trail)
- Customers can view order status in real-time

### 3. Membership Program

**Description:** Customers can purchase a membership plan for 100 BDT to receive 10% discount on medicines for 30 days.

**Membership Details:**
- **Price:** 100 BDT (configured in MembershipPlan table)
- **Duration:** 30 days (configured in MembershipPlan table)
- **Discount:** 10% on medicine subtotal (configured in MembershipPlan table)
- **Applies To:** Medicine prices only (excludes delivery charges)

**Business Rules:**
- Membership discount applies automatically during checkout if active
- Membership status checked by comparing current date with `startDate` and `endDate`
- Only one active membership per user at a time
- Membership can be renewed before or after expiry
- Discount does NOT apply to:
  - Delivery charges
  - Subscription purchases (subscription prices are pre-set)
  - Membership purchase itself

**Future Considerations:**
- Multiple membership tiers (Silver, Gold, Platinum)
- Auto-renewal option
- Membership benefits beyond discount (free delivery, priority support)

### 4. Subscriptions (Monthly Packs)

**Description:** Customers can subscribe to pre-configured monthly medicine packs for recurring delivery.

**Subscription Components:**
- **SubscriptionPlan:** Pre-defined pack (e.g., "Diabetes Care Pack", "Hypertension Pack")
- **SubscriptionItem:** Medicines included in the pack with quantities
- **Subscription:** User's active subscription to a plan

**Subscription Lifecycle:**
1. **Create:** User subscribes to a plan, sets start date
2. **Active:** Subscription is active, deliveries scheduled
3. **Renewal:** Monthly renewal (manual for now, auto-renewal future)
4. **Pause/Cancel:** User can pause or cancel subscription

**Business Rules:**
- Subscription price is fixed (does NOT receive membership discount)
- Subscription duration is 30 days by default (monthly)
- `nextDeliveryDate` tracks when next delivery is due
- Admin creates and manages subscription plans
- Users cannot modify subscription items (must cancel and create new)

**Future Considerations:**
- Auto-renewal with payment gateway
- Proration for mid-cycle cancellations
- Pause/resume functionality
- Flexible delivery schedules (weekly, bi-weekly)

### 5. Prescription Upload & Review

**Description:** Customers can upload prescriptions for medicines that require prescription verification.

**Prescription Workflow:**
1. **Upload:** User uploads prescription image/PDF with patient details
2. **Pending:** Prescription awaiting admin review (status: "PENDING")
3. **Under Review:** Admin reviewing prescription (status: "UNDER_REVIEW")
4. **Approved:** Admin approves prescription (status: "APPROVED")
5. **Rejected:** Admin rejects prescription with notes (status: "REJECTED")

**Business Rules:**
- Prescription required for medicines marked `requiresPrescription: true`
- File upload size limit: 5MB (configured in env: `NEXT_PUBLIC_MAX_FILE_SIZE`)
- Supported formats: Images (JPG, PNG) and PDF
- Prescription includes: patient name, phone, zone, file URL
- Admin can add notes when approving/rejecting
- Users can re-upload if rejected

**Future Considerations:**
- OCR for automatic prescription parsing
- Expiry date tracking for prescriptions
- Link prescriptions to specific orders
- Pharmacist verification workflow

### 6. Admin Management

**Description:** Admin panel for managing all aspects of the platform.

**Admin Capabilities:**

**Medicine Management:**
- Create, read, update medicines
- Set pricing, stock quantity, discount prices
- Mark medicines as requiring prescription
- Activate/deactivate medicines
- Assign medicines to categories

**Category Management:**
- Create, read, update categories
- Set category images and descriptions
- Activate/deactivate categories

**Banner Management:**
- Create, read, update, delete banners
- Set banner location (HOME_HERO, HOME_MID, CATEGORY_TOP)
- Set banner order and active status
- Link banners to specific pages

**Order Management:**
- View all orders with filtering
- Update order status (PENDING → CONFIRMED → SHIPPED → DELIVERED)
- Cancel orders with reason
- View order details and customer information

**Prescription Management:**
- View all uploaded prescriptions
- Review prescription images/PDFs
- Approve or reject prescriptions with notes
- Filter by status (PENDING, APPROVED, REJECTED)

**Sales & Analytics:**
- View sales reports (total revenue, order count)
- Filter by date range
- View top-selling medicines
- Customer analytics (future)

**Zone Management:**
- Configure delivery zones
- Set delivery charges per zone
- Set estimated delivery days
- Activate/deactivate zones

---

## Detailed Workflows

### Signup / Signin / Logout Flow

**Signup:**
1. User navigates to `/auth/signup`
2. User provides: name, phone, email (optional), password
3. System validates:
   - Phone number is unique
   - Email is unique (if provided)
   - Password meets minimum requirements (8+ characters)
4. System hashes password with bcrypt
5. System creates User record with role: USER
6. User redirected to signin page

**Signin:**
1. User navigates to `/auth/signin`
2. User provides: phone OR email, password
3. System validates credentials using NextAuth
4. On success:
   - Session created with user ID, name, email, phone, role
   - **ADMIN users** redirected to `/admin`
   - **USER users** redirected to `/dashboard` or callback URL
5. On failure: Error message displayed

**Logout:**
1. User clicks logout button
2. NextAuth session destroyed
3. User redirected to homepage

**Related Documentation:** See [AUTH_FLOW.md](./AUTH_FLOW.md) for detailed authentication implementation.

---

### Membership Purchase & Expiry Flow

**Purchase:**
1. User navigates to `/membership` page
2. User views membership plan details (100 BDT, 10% discount, 30 days)
3. User clicks "Purchase Membership"
4. System validates:
   - User is authenticated
   - User does not have active membership (optional: allow multiple)
5. System creates UserMembership record:
   - `startDate`: Current date/time
   - `endDate`: Current date + 30 days
   - `isActive`: true
6. System processes payment (COD for now, gateway future)
7. User redirected to dashboard with success message

**Active Period:**
- System checks membership status during checkout
- If `current_date >= startDate AND current_date <= endDate`, membership is active
- 10% discount applied to medicine subtotal automatically

**Expiry:**
- When `current_date > endDate`, membership is no longer active
- Discount no longer applies
- User can renew membership at any time

**Renewal:**
- User purchases new membership
- New UserMembership record created with new start/end dates
- Previous membership remains in database (audit trail)

**Business Rules:**
- Membership discount: 10% off medicine subtotal only
- Does NOT apply to: delivery charges, subscriptions, membership purchase
- Discount calculated at checkout before order creation
- Multiple memberships can exist (historical), only latest active one applies

---

### Subscription Lifecycle Flow

**Create Subscription:**
1. User navigates to `/subscriptions` page
2. User browses available subscription plans
3. User selects a plan (e.g., "Diabetes Care Pack")
4. User views plan details (medicines included, quantities, price)
5. User clicks "Subscribe"
6. System validates:
   - User is authenticated
   - Plan is active
7. System creates Subscription record:
   - `startDate`: Current date or user-selected date
   - `nextDeliveryDate`: startDate + 30 days
   - `isActive`: true
8. User redirected to dashboard with success message

**Active Subscription:**
- Subscription appears in user dashboard
- `nextDeliveryDate` indicates when next delivery is due
- Admin can view active subscriptions and prepare deliveries

**Renewal (Manual for now):**
- When `nextDeliveryDate` approaches, user receives reminder (future: notification)
- User manually renews subscription (creates new order or extends subscription)
- System updates `nextDeliveryDate` to +30 days

**Cancel/Pause:**
1. User navigates to dashboard, views subscriptions
2. User clicks "Cancel Subscription"
3. System updates Subscription: `isActive`: false
4. Subscription no longer appears in active subscriptions
5. No future deliveries scheduled

**Future Enhancements:**
- Auto-renewal with payment gateway
- Pause functionality (temporary hold)
- Proration for mid-cycle cancellations
- Flexible delivery schedules

**Business Rules:**
- Subscription price is fixed (no membership discount)
- Subscription items cannot be modified (must cancel and create new)
- One subscription per plan per user (can have multiple different plans)
- Subscription deliveries are separate from regular orders

---

### Order Lifecycle Flow

**Order Creation:**
1. User adds medicines to cart
2. User navigates to `/checkout`
3. User selects delivery address (or creates new address)
4. System calculates:
   - Subtotal: Sum of (medicine price × quantity)
   - Discount: 10% of subtotal if membership active, else 0
   - Delivery Charge: Based on selected zone
   - Total: Subtotal - Discount + Delivery Charge
5. User confirms order
6. System creates Order record:
   - Status: PENDING
   - Payment Method: COD
   - Payment Status: PENDING
7. System creates OrderItem records for each cart item
8. User redirected to order confirmation page

**Order Processing (Admin):**

**PENDING → CONFIRMED:**
- Admin reviews order in admin panel
- Admin verifies stock availability
- Admin confirms order (status: CONFIRMED)
- Customer notified (future: SMS/email)

**CONFIRMED → PROCESSING:**
- Admin begins preparing order
- Medicines picked and packed
- Status updated to PROCESSING

**PROCESSING → SHIPPED:**
- Order dispatched for delivery
- Tracking information added (future)
- Status updated to SHIPPED
- Customer notified with estimated delivery

**SHIPPED → DELIVERED:**
- Delivery completed
- Payment collected (COD)
- Status updated to DELIVERED
- Payment Status: PAID

**Cancellation:**
- Admin or customer can cancel order
- Status updated to CANCELLED
- Reason for cancellation recorded in notes
- Stock quantities restored (future)

**Business Rules:**
- Orders cannot be deleted (audit trail)
- Only PENDING and CONFIRMED orders can be cancelled
- SHIPPED and DELIVERED orders cannot be cancelled
- Payment status updated only when DELIVERED (for COD)
- Order number is unique and auto-generated

---

### Prescription Workflow

**Upload:**
1. User navigates to `/dashboard` or prescription upload page
2. User fills form: name, phone, zone
3. User uploads prescription file (image or PDF, max 5MB)
4. System validates file size and format
5. System stores file (currently local uploads, future: Supabase Storage)
6. System creates Prescription record:
   - Status: PENDING
   - File URL stored
7. User sees confirmation message

**Admin Review:**
1. Admin navigates to `/admin/prescriptions`
2. Admin views list of prescriptions filtered by status
3. Admin clicks on prescription to view details
4. Admin views uploaded prescription image/PDF
5. Admin verifies prescription authenticity and details

**Approval:**
1. Admin clicks "Approve"
2. System updates Prescription: status: APPROVED
3. Admin can add notes (e.g., "Valid until 2025-12-31")
4. Customer notified (future: SMS/email)

**Rejection:**
1. Admin clicks "Reject"
2. Admin adds notes explaining rejection reason
3. System updates Prescription: status: REJECTED
4. Customer notified with rejection reason
5. Customer can re-upload corrected prescription

**Business Rules:**
- Prescription status: PENDING, UNDER_REVIEW, APPROVED, REJECTED
- Prescriptions cannot be deleted (audit trail)
- Admin notes are visible to customer
- Approved prescriptions can be used for future orders (future: link to orders)
- Prescription expiry tracking (future enhancement)

---

## Non-Functional Requirements

### Security

**Authentication & Authorization:**
- Password hashing with bcrypt (10 rounds minimum)
- Session-based authentication with NextAuth
- Role-based access control (GUEST, USER, ADMIN)
- Middleware protection for `/admin` and `/dashboard` routes
- CSRF protection via NextAuth

**Data Protection:**
- PII (Personally Identifiable Information) must not be logged
- Database credentials stored in environment variables only
- NEXTAUTH_SECRET must be strong and unique per environment
- No secrets committed to version control

**Input Validation:**
- All user inputs validated on server-side
- SQL injection prevention via Prisma ORM
- File upload validation (size, type, content)
- XSS prevention via React's built-in escaping

### Performance

**Response Times:**
- Homepage load: < 2 seconds
- API responses: < 500ms (excluding external services)
- Database queries: Optimized with indexes and pagination

**Scalability:**
- Pagination for large datasets (orders, medicines, prescriptions)
- Database connection pooling (Supabase Transaction pooler)
- Image optimization (Next.js Image component)

**Caching:**
- Static pages cached at CDN (Vercel)
- API responses cached where appropriate (future: Redis)

### Availability

**Uptime Target:** 99.5% (allows ~3.6 hours downtime per month)

**Backup & Recovery:**
- Database backups: Daily automated backups (Supabase)
- Recovery Time Objective (RTO): < 4 hours
- Recovery Point Objective (RPO): < 24 hours

### Observability

**Logging:**
- Structured logs with log levels (ERROR, WARN, INFO, DEBUG)
- No PII in logs (mask phone, email, addresses)
- Error tracking with stack traces
- API request/response logging (excluding sensitive data)

**Monitoring (Future):**
- Application performance monitoring (APM)
- Database query performance
- Error rate tracking
- User session tracking

### Compliance & Privacy

**Data Retention:**
- User data: Retained until account deletion requested
- Order data: Retained for 7 years (tax/legal compliance)
- Prescription data: Retained for 5 years (medical records)
- Logs: Retained for 90 days

**GDPR/Privacy Considerations:**
- User consent for data collection
- Right to access personal data
- Right to delete personal data (with legal exceptions)
- Data minimization (collect only necessary data)

---

## Future Modules

### Phase A: Payment Gateway Integration

**Goal:** Enable online payments via SSLCommerz or Stripe

**Tasks:**
1. Research and select payment gateway (SSLCommerz for Bangladesh, Stripe for international)
2. Integrate payment gateway SDK
3. Implement payment flow:
   - Authorization (hold funds)
   - Capture (charge funds)
   - Refunds (for cancellations)
4. Add webhook handling for payment status updates
5. Update Order model with payment transaction details
6. Implement payment security (webhook signature verification)
7. Add payment method selection in checkout
8. Test with sandbox/test credentials
9. Deploy to production with live credentials

**Business Impact:**
- Reduce COD failures and returns
- Enable membership auto-renewal
- Support subscription auto-payments
- Improve cash flow (immediate payment vs COD)

---

### Phase B: Notifications (SMS & Email)

**Goal:** Send automated notifications to customers and admins

**SMS Notifications:**
- Order confirmation
- Order status updates (shipped, delivered)
- Membership expiry reminders
- Subscription renewal reminders
- OTP for phone verification (future)

**Email Notifications:**
- Welcome email on signup
- Order confirmation with details
- Prescription status updates (approved/rejected)
- Membership purchase confirmation
- Weekly/monthly newsletters (future)

**Tasks:**
1. Select SMS provider (Twilio, Nexmo, or local BD provider)
2. Select email provider (SendGrid, AWS SES, or SMTP)
3. Create notification templates
4. Implement notification service layer
5. Add notification triggers in business logic
6. Configure environment variables for providers
7. Test notification delivery
8. Monitor delivery rates and failures

**Business Impact:**
- Improve customer communication
- Reduce support queries (proactive updates)
- Increase engagement (reminders, newsletters)
- Build trust (timely updates)

---

### Phase C: Background Jobs

**Goal:** Automate recurring tasks and improve reliability

**Job Types:**

**Membership Expiry Checks:**
- Daily job to check expiring memberships
- Send reminder notifications 3 days before expiry
- Mark expired memberships as inactive

**Subscription Renewals:**
- Daily job to check upcoming subscription deliveries
- Create orders for auto-renewal subscriptions
- Send renewal reminders for manual subscriptions

**Order Reminders:**
- Send reminders for abandoned carts (future)
- Follow-up after delivery for feedback

**Data Cleanup:**
- Archive old logs (90+ days)
- Clean up expired sessions
- Optimize database (vacuum, reindex)

**Tasks:**
1. Select job scheduler (Node-cron, BullMQ, or Vercel Cron)
2. Implement job queue system
3. Create job handlers for each job type
4. Add job monitoring and error handling
5. Implement job idempotency (prevent duplicate execution)
6. Add job logging and observability
7. Test job execution and failure scenarios

**Business Impact:**
- Reduce manual admin work
- Improve customer experience (timely reminders)
- Ensure data consistency
- Enable auto-renewal revenue

---

### Phase D: Advanced Reporting & Admin Tools

**Goal:** Provide insights and tools for business decisions

**Reports:**
- Sales analytics (daily, weekly, monthly)
- Customer cohort analysis
- Subscription metrics (churn rate, LTV)
- Inventory reports (low stock alerts)
- Prescription approval rates
- Delivery performance (on-time delivery %)

**Admin Tools:**
- Bulk medicine import/export (CSV)
- Bulk order processing
- Customer segmentation
- Promotional campaigns management
- Coupon/discount code system
- Inventory forecasting

**Tasks:**
1. Design reporting database schema (analytics tables)
2. Implement data aggregation jobs
3. Create report generation APIs
4. Build admin dashboard with charts
5. Add export functionality (PDF, Excel)
6. Implement real-time analytics (future: WebSocket)
7. Add role-based report access

**Business Impact:**
- Data-driven decision making
- Identify growth opportunities
- Optimize inventory management
- Improve operational efficiency

---

## Roadmap

### Phase A: Payment Gateway Integration (4-6 weeks)
- [ ] Research and select payment gateway provider
- [ ] Integrate payment gateway SDK
- [ ] Implement payment flow (authorization, capture, refunds)
- [ ] Add webhook handling for payment status updates
- [ ] Update Order model with payment transaction details
- [ ] Implement payment security measures
- [ ] Add payment method selection in checkout UI
- [ ] Test with sandbox credentials
- [ ] Deploy to production with live credentials
- [ ] Monitor payment success rates and failures

### Phase B: Notifications (SMS & Email) (3-4 weeks)
- [ ] Select and configure SMS provider
- [ ] Select and configure email provider
- [ ] Create notification templates (SMS and email)
- [ ] Implement notification service layer
- [ ] Add notification triggers in business logic
- [ ] Configure environment variables
- [ ] Test notification delivery
- [ ] Monitor delivery rates and handle failures
- [ ] Add notification preferences for users

### Phase C: Background Jobs (3-4 weeks)
- [ ] Select and configure job scheduler
- [ ] Implement job queue system
- [ ] Create membership expiry check job
- [ ] Create subscription renewal job
- [ ] Create order reminder jobs
- [ ] Create data cleanup jobs
- [ ] Add job monitoring and error handling
- [ ] Implement job idempotency
- [ ] Test job execution and failure scenarios
- [ ] Deploy and monitor job performance

### Phase D: Advanced Reporting & Admin Tools (6-8 weeks)
- [ ] Design analytics database schema
- [ ] Implement data aggregation jobs
- [ ] Create sales analytics reports
- [ ] Create customer cohort analysis
- [ ] Create subscription metrics dashboard
- [ ] Add inventory reports and alerts
- [ ] Build admin dashboard with charts
- [ ] Add export functionality (PDF, Excel)
- [ ] Implement bulk operations (import/export)
- [ ] Add promotional campaigns management

---

## Change Policy & Constraints

### Core Tables (Stable - Changes Require Migration Plan)

The following database tables are **core to the system** and should not be changed lightly:

- **User:** Authentication and authorization depend on this
- **Order, OrderItem:** Financial records, audit trail required
- **Medicine, Category:** Core product catalog
- **UserMembership, MembershipPlan:** Revenue model
- **Subscription, SubscriptionPlan, SubscriptionItem:** Recurring revenue model

**Change Requirements:**
- Any schema change must include migration plan
- Backward compatibility must be maintained
- Data migration scripts required
- Test plan for data integrity
- Rollback plan documented

### Flexible Tables (Can Be Extended)

The following tables can be extended more easily:

- **Banner:** Marketing content, low risk
- **Zone:** Delivery configuration, operational
- **Address:** User data, can add fields
- **Prescription:** Workflow data, can add statuses

### API Contracts (Stable)

API endpoints and response shapes should remain stable. See [API_DATA_FLOW.md](./API_DATA_FLOW.md) for current contracts.

**Change Requirements:**
- API versioning for breaking changes (e.g., `/api/v2/orders`)
- Deprecation notices for old endpoints (minimum 3 months)
- Client compatibility testing
- Documentation updates

### Business Constants

The following business values are currently **configured in the database** (MembershipPlan table):

- Membership price: 100 BDT
- Membership duration: 30 days
- Membership discount: 10%

**To Change:** Update the MembershipPlan record in the database, not code.

**Future:** Move more business rules to database configuration (e.g., delivery charges, tax rates).

### Environment Configuration

**Critical Environment Variables:**

- `DATABASE_URL`: **Must use Supabase Transaction pooler** (port 6543), not Session pooler (port 5432)
  - Incorrect pooler causes connection errors and hangs
- `NEXTAUTH_URL`: **Must match deployed domain exactly**
  - Mismatch causes redirect loops and login hangs
- `NEXT_PUBLIC_SITE_URL`: **Must match deployed domain exactly**
  - Used for canonical URLs, sitemaps, and redirects

**Production Gotchas:**
1. Always use Transaction pooler for DATABASE_URL in serverless environments
2. Ensure NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL match the deployed domain
3. Never commit .env files to version control
4. Rotate NEXTAUTH_SECRET regularly (every 90 days)

### PR Checklist

**Before merging any PR, ensure:**

- [ ] If database schema changed: Migration script included
- [ ] If API routes changed: API_DATA_FLOW.md updated
- [ ] If authentication flow changed: AUTH_FLOW.md updated
- [ ] If new features added: HEALTHPLUS_SRD.md updated
- [ ] If architecture changed: ARCHITECTURE.md updated
- [ ] If tracking events added: TRACKING_PLAN.md updated
- [ ] If database models changed: DATABASE_SCHEMA.md and ERD updated
- [ ] Tests pass (lint, typecheck, unit tests)
- [ ] No secrets or credentials committed
- [ ] No PII in logs or error messages

### Architecture Decision Records (ADRs)

For major architectural decisions, create an ADR document in `docs/adr/`:

- ADR format: `YYYY-MM-DD-decision-title.md`
- Include: Context, Decision, Consequences, Alternatives Considered
- Link ADRs in relevant documentation

---

## Glossary

**COD (Cash on Delivery):** Payment method where customer pays in cash upon delivery.

**Membership:** Paid subscription (100 BDT for 30 days) that provides 10% discount on medicines.

**Subscription:** Recurring monthly delivery of pre-configured medicine packs.

**Prescription:** Medical document uploaded by customer for medicines requiring prescription verification.

**Zone:** Delivery area with associated delivery charge and estimated delivery days.

**Order Status:**
- **PENDING:** Order created, awaiting confirmation
- **CONFIRMED:** Order confirmed by admin
- **PROCESSING:** Order being prepared
- **SHIPPED:** Order dispatched for delivery
- **DELIVERED:** Order successfully delivered
- **CANCELLED:** Order cancelled

**Prescription Status:**
- **PENDING:** Awaiting admin review
- **UNDER_REVIEW:** Admin currently reviewing
- **APPROVED:** Prescription approved by admin
- **REJECTED:** Prescription rejected by admin

**PII (Personally Identifiable Information):** Data that can identify an individual (name, phone, email, address).

**ERD (Entity Relationship Diagram):** Visual representation of database schema and relationships.

**API (Application Programming Interface):** Server endpoints that handle client requests.

**Middleware:** Code that runs before route handlers to check authentication, authorization, etc.

**Session:** User authentication state maintained by NextAuth.

**Pooler:** Database connection management system (Transaction vs Session pooler).

---

## Document Maintenance

**This document should be updated when:**
- New features are added
- User roles or permissions change
- Business rules or workflows change
- New phases or modules are planned
- Major architectural decisions are made

**Review Schedule:**
- Quarterly review for accuracy
- Update after each major release
- Update when business requirements change

**Document Owner:** Technical Lead / Product Manager

---

**End of System Requirements Document**
