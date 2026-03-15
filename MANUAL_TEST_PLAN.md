## SERVIXA Manual Test Plan – User Journeys & Data Flow

This document is for **end‑to‑end manual testing** of SERVIXA, focusing on:
- **Customer flows**
- **Service Provider flows**
- **Admin flows**

For each flow:
- Follow the **exact UI journey**
- At each step, verify:
  - **UI behavior** (what the user sees/can do)
  - **State transitions** (what should happen next)
  - **Key data points** (what must be stored or updated somewhere in the system)

> Scope note: MVP is **ONE city, ONE primary category** with full depth. Use that constrained scope while testing.

---

## 1. Customer Flows

### 1.1 Public Browsing (No Login)

**Goal**: A new visitor can discover services and providers without login, and is pushed to login only when booking.

1. **Homepage**
   - Go to public root URL.
   - Verify:
     - Brand name **SERVIXA** and hero section visible (value proposition, search, “Use My Location”).
     - Popular services grid is visible (AC, Plumbing, Electrical, etc.).
     - Clicking a **service card** takes you to a **service browsing** page for that category.

2. **Service browsing (public)**
   - From homepage, click a popular service (e.g., AC Repair).
   - Verify:
     - Filters for sub‑services (e.g., Gas Refill, Cleaning, Installation) are visible and clickable.
     - Provider cards are listed with:
       - Photo, name
       - Rating & review count
       - Distance / area
       - Price range
       - Verified / premium badges (if applicable)
     - Entire card or “View Profile” navigates to **Provider Profile**.
     - “Book Now” or equivalent triggers **login/signup** (since user is not logged in).

3. **Provider profile (public)**
   - Open provider profile from the list.
   - Verify:
     - Provider basic info: name, skills, rating, service areas.
     - Service categories/skills listed and clickable (deep linking back to services list).
     - “Book Now” / “Request Service” again requires **login**.

### 1.2 Login & Customer Dashboard

**Goal**: Customer can log in and land on the correct **customer dashboard**.

1. **Login**
   - Go to login page.
   - Test **Google OAuth** flow (if enabled) OR **Mobile OTP** flow:
     - Enter mobile, request OTP, enter correct OTP → successful login.
     - (Negative) Enter incorrect OTP → friendly error, no login.
   - Verify:
     - After success, user is redirected to **customer dashboard** (for CUSTOMER role).

2. **Customer dashboard**
   - Verify:
     - Welcome text with customer name.
     - Quick actions like **“Book Service” / “Hire Worker”** are visible.
     - “My Active Jobs” section shows ongoing jobs (if any).
     - For an active job card:
       - Status text (e.g., “Provider On The Way”, “Started”, “Completed”).
       - Buttons: **Track Location**, **Chat**, **View Details**, **Pay Now** / **Rate Provider** depending on status.
     - Navigation links (Services, My Jobs, Profile) work and use deep linking (URLs change correctly).

### 1.3 Job Creation Flow (Customer)

**Goal**: Customer can create a job in **3 steps** and see it listed with correct details.

#### Step 1 – Select Service

1. From dashboard, click **“Book Service”**.
2. Verify page shows:
   - Step indicator: **Step 1 of 3**.
   - Service categories grid and/or search.
3. Actions & checks:
   - Click a main category (for MVP, use the primary MVP category).
   - Confirm that sub‑services or types are selectable.
   - Selected category/type is clearly shown in UI before continuing.

#### Step 2 – Describe Problem

1. After selecting service, proceed to step 2.
2. Verify:
   - Step indicator: **Step 2 of 3**.
   - Selected category and sub‑type visible at top (breadcrumb or text).
   - Textarea for problem description (required).
   - Photo upload UI (at least ability to pick/upload 1 image).
   - Time selection (date + time or slots).
3. Actions:
   - Enter a realistic problem description.
   - Upload at least one photo.
   - Select a valid date/time (today or future).
4. Negative tests:
   - Try to continue with **empty description** → validation error.
   - Try to continue without time → validation error.

#### Step 3 – Location & Submit

1. Move to step 3.
2. Verify:
   - Step indicator: **Step 3 of 3**.
   - Previously entered service and description visible (summary).
   - Address selector listing saved addresses (or option to add new).
   - Option to **use current location** (if implemented).
   - “Emergency service” toggle/checkbox (if implemented).
3. Actions:
   - Select an existing address in the **MVP city**.
   - Confirm address shows city/zone/POD or at least the mapped location.
   - Optionally mark job as **emergency** for a test case.
   - Click **Submit Job Request**.
4. Verify after submit:
   - Redirect to **Job Details** page with correct job ID.
   - Job appears in **My Jobs / Active Jobs** list.
   - Key fields match what you entered:
     - Service category/type
     - Description
     - Address
     - Scheduled time
     - Emergency flag

### 1.4 Job Tracking & Interaction (Customer)

**Goal**: Customer can see job progress and interact with the provider.

1. **Job details page**
   - Open the newly created job.
   - Verify:
     - Job status timeline (Created → Provider Assigned → On The Way → Started → Completed).
     - Provider card with name, rating, distance, verification badge.
     - Actions: **Call**, **Chat**, **View on Map** (where implemented).
2. **Status updates**
   - After provider accepts and updates status:
     - Refresh job details page.
     - Confirm status changed appropriately (e.g., On The Way / Started).
     - Timeline timestamps are added sequentially.

3. **Chat / communication** (if available in MVP)
   - Open chat from job details.
   - Send a message.
   - Verify:
     - Message appears in conversation.
     - (Optional cross‑check) Provider sees message on provider side.

### 1.5 Payment Flow (Customer)

**Goal**: Payment options respect provider’s configured preference (PARTIAL / FULL / POST_WORK).

Create **three separate jobs** with providers configured for each payment type if possible.

1. **Partial payment job**
   - On job details, verify:
     - Payment section shows type **Partial** with correct percentage (e.g., 30% upfront).
     - Upfront and remaining amounts are calculated correctly.
   - Click **Pay [Upfront Amount] Now**:
     - Razorpay checkout opens.
     - Complete payment with test card/UPI as configured.
     - On success:
       - Job shows **upfront paid** state.
       - Receipt/confirmation visible.

2. **Full payment job**
   - Verify:
     - Payment type shows **Full Payment**.
     - Total amount due upfront.
   - Pay and confirm job shows full payment recorded and no remaining balance.

3. **Post‑work payment job**
   - Before completion:
     - Payment section should indicate **Pay after completion**.
     - No upfront payment button.
   - After provider marks job **Completed**:
     - “Pay Now” becomes available for full amount.
     - Complete payment and verify job is marked fully paid.

### 1.6 Rating & Review

**Goal**: After completion, customer can rate and review provider.

1. Complete any job end‑to‑end.
2. On dashboard or job details:
   - Click **Rate Provider**.
3. Verify:
   - Star rating widget (1–5).
   - Text review field.
   - (If present) Sub‑ratings like Quality, Punctuality, Communication.
4. Submit:
   - Rating and review appear under provider’s profile / job history.

---

## 2. Service Provider Flows

### 2.1 Provider Onboarding (New Provider)

**Goal**: A new provider can complete **7‑step onboarding** and reach an active state after admin approval.

1. **Start onboarding**
   - From public site, choose **Sign Up as Service Provider**.
   - Start multi‑step wizard.
   - Verify progress bar shows **Step 1 of 7**.

2. **Step 1 – Registration**
   - Complete mobile OTP or Google login, plus basic info (name, email).
   - Validation checks for required fields.

3. **Step 2 – Document Upload**
   - Upload required documents:
     - Government ID
     - Address proof
     - Profile photo
   - Verify:
     - File type/size validation.
     - After upload, thumbnails or filenames are visible.

4. **Step 3 – Skills**
   - Select **primary skill** (e.g., AC Technician).
   - Set **experience years**.
   - Optionally add secondary skills and upload certificates.
   - Confirm selections are shown in a summary or pill format.

5. **Step 4 – Service Areas**
   - Select **MVP city**.
   - Choose zones and PODs relevant to MVP.
   - Adjust service radius (slider or numeric).

6. **Step 5 – Profile Completion**
   - Fill business name (if applicable), bio, and optionally rates.
   - Confirm profile completion percentage increases.

7. **Step 6 – Verification Pending**
   - After submitting, UI should show that the provider is **under review**.

8. **Step 7 – Approval & Activation**
   - After admin approves (see Admin flow), log in again as provider.
   - Verify redirect to **provider dashboard** instead of onboarding.

### 2.2 Provider Dashboard & Availability

**Goal**: Provider sees key stats and can toggle availability.

1. Provider dashboard
   - Verify:
     - Quick stats (today’s jobs, this month earnings, total earnings).
     - **Availability toggle**: Online / Offline.
2. Change availability:
   - Switch from Offline → Online.
   - Confirm:
     - UI clearly shows the new state.
     - Only online providers should appear in matching (to be verified in a job assignment test).

### 2.3 Job Management – Accepting & Executing Jobs

**Goal**: Provider can see available jobs, accept them, and move them through statuses.

1. **Available jobs list**
   - Navigate to **Jobs → Available Jobs**.
   - Verify each job card shows:
     - Service type
     - Customer name (or masked ID)
     - Distance, scheduled time, price
     - Match score (if visible)
   - Clicking **View Details** opens job details page.

2. **Accept/Reject**
   - On a job details page:
     - Click **Accept**.
     - Confirm:
       - Job moves from Available → My Jobs.
       - Customer job view now shows provider assigned.
   - For another test job:
     - Click **Reject** and confirm it disappears from “Available Jobs” and is not assigned.

3. **Job lifecycle (provider side)**
   - On an accepted job:
     - Mark **On The Way**.
     - Then **Start Job**.
     - Upload work photos (before/after if UI supports).
     - Finally **Complete Job**.
   - Verify:
     - Each action updates status on customer side.
     - No invalid transitions (e.g., cannot complete before start).

### 2.4 Earnings & Payouts

**Goal**: Provider can see earnings and request payouts.

1. After completing a paid job:
   - Open **Earnings** page.
   - Verify:
     - Available balance and pending amounts (if escrow/post‑work flows).
     - A list of recent jobs with amounts and statuses.
2. **Request payout**
   - Click **Request Payout** (if implemented).
   - Confirm:
     - Request is accepted and visible as a pending payout.
     - Balance updates as per design.

---

## 3. Admin Flows

### 3.1 Admin Login & Dashboard

**Goal**: Admin can log in and see an overview of the platform.

1. Log in as an **ADMIN/SUPER_ADMIN** user.
2. Verify:
   - Redirect to **Admin Dashboard**.
   - Dashboard cards show:
     - Pending provider approvals
     - Active providers
     - Total jobs (for MVP scope)
   - Navigation has items: **Dashboard, Providers, Users, Jobs, Payments, Configuration, Analytics**.

### 3.2 Provider Approval

**Goal**: Admin can review and approve/reject providers.

1. **Pending approvals list**
   - Navigate to **Admin → Providers → Pending**.
   - Verify pending provider you just onboarded appears in list.
   - Click **Review & Approve**.

2. **Provider verification page**
   - Check:
     - Basic info: name, mobile, email, primary skill, experience.
     - Documents section:
       - Government ID, address proof, profile photo with view links.
     - Service areas: city, zones, PODs.
     - Verification controls: background check, document check, skill check.
   - Actions:
     - Set checks to **Pass**.
     - Add some admin notes.
     - Click **Approve Provider**.
   - Verify:
     - Provider status changes to Active.
     - Provider can now see dashboard and receive jobs.

3. (Optional) **Reject scenario**
   - For another test provider:
     - Select **Reject**, add reason.
     - Verify provider cannot proceed to job dashboard and sees appropriate message.

### 3.3 Master Data – Service Categories

**Goal**: Admin can manage service categories and see them reflected on the frontend.

1. Navigate to Admin **Service Categories** page (Next.js admin service categories UI).
2. Verify:
   - List of categories with columns:
     - Code, Name, Type, Display Order, Featured, Status.
     - Actions: View Sub‑Categories, Edit, Delete.
3. **Create category**
   - Click **Create**.
   - Fill:
     - Code, Name, Description, Icon URL, Display Order, Featured flag, Active flag.
   - Save and confirm:
     - New category appears in the table with correct values.
     - It is visible in **customer service discovery** (if integrated in MVP).

4. **Edit category**
   - Edit an existing category.
   - Change:
     - Name or display order.
   - Save and verify:
     - Updated values appear in table and UI (e.g., new order on customer homepage).

5. **Deactivate/Delete**
   - Deactivate or delete a non‑critical test category.
   - Confirm:
     - It no longer appears for customers in service browsing.

### 3.4 Location Master Data (City/Zone/POD)

**Goal**: Location master data is manageable and affects availability of services.

1. **City management**
   - In admin UI for cities:
     - Create or update the MVP city (if UI exists for this).
   - Verify:
     - City appears in any city dropdowns (customer address, provider service areas).

2. **Zone & POD management**
   - Use admin UI (or existing endpoints) to:
     - Create zones and PODs under the MVP city.
   - Confirm:
     - Providers can select these zones/PODs in onboarding.
     - Customer address selection and job creation correctly associates to these.

---

## 4. Suggested Test Run Order (For MVP City & Category)

1. **Admin**:
   - Confirm master data exists: MVP city, 1–2 zones/PODs, 1 primary service category + skills.
2. **Provider**:
   - Complete onboarding for 1–2 test providers in MVP city/category.
   - Admin approves them.
3. **Customer**:
   - Public browsing → login → create job for MVP category.
   - Verify provider matching, job lifecycle, and payment.
4. **Repeat**:
   - Run flows for each payment model (PARTIAL, FULL, POST_WORK).
   - Add at least one emergency job to see different matching/priority (if implemented).

Use this checklist as a **living document** while you test. For each bullet, you can mark:
- ✅ Passed
- ❌ Failed (with notes and screenshots)

