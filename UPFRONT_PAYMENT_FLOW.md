# Upfront Payment Flow - Complete Implementation

## Overview

When a service provider accepts a job with **PARTIAL** payment preference (e.g., 30% upfront), the customer needs to pay the upfront amount before the provider can start the work.

## Flow Diagram

```
1. Provider Accepts Job
   ↓
2. Payment Schedule Created (PARTIAL, 30% upfront)
   ↓
3. Customer Receives Notification
   "Please pay ₹X (30% upfront) to proceed"
   ↓
4. Customer Sees "Pay Upfront" Button on Job Details Page
   ↓
5. Customer Clicks Button → Redirects to Payment Page
   ↓
6. Customer Pays via Razorpay
   ↓
7. Payment Confirmed → upfrontPaid = true
   ↓
8. Job Status Remains ACCEPTED (not changed)
   ↓
9. Provider Can Now Start Job
   ↓
10. After Completion → Final Payment (70% remaining)
```

## Implementation Details

### 1. When Payment Schedule is Created

**Location**: `MatchingService.acceptJob()`

When a provider accepts a job:
- System checks provider's payment preference for the service category
- If preference is `PARTIAL` with 30% upfront:
  - Creates `job_payment_schedule` with:
    - `payment_type = 'PARTIAL'`
    - `upfront_percentage = 30`
    - `upfront_amount = totalAmount * 0.30`
    - `final_amount = totalAmount * 0.70`
    - `upfront_paid = false`
    - `final_paid = false`
    - `payment_status = 'PENDING'`

### 2. Customer Notification

**Location**: `MatchingService.acceptJob()`

Customer receives notification:
- **Title**: "Payment Required - Upfront Payment"
- **Message**: "A provider has accepted your job: [Job Title]. Please pay ₹[Amount] (30% upfront) to proceed."
- **Link**: `/customer/jobs/[jobId]`

### 3. Customer Job Details Page

**Location**: `app/customer/jobs/[id]/page.tsx`

**Payment Summary Section** shows:
- Payment Type: PARTIAL
- Total Amount: ₹X
- Upfront Amount: ₹Y (30%) - Shows ✓ Paid if paid
- Final Amount: ₹Z (70%) - Shows ✓ Paid if paid
- Payment Status: PENDING / PARTIAL / COMPLETED

**Actions Section** shows:
- **"Pay Upfront ₹X"** button when:
  - Job status = `ACCEPTED`
  - Payment type = `PARTIAL` or `FULL`
  - `upfrontPaid = false`
  - `upfrontAmount > 0`

- **"Pay Final ₹Y"** button when:
  - Job status = `PAYMENT_PENDING`
  - Payment type = `PARTIAL`
  - `finalPaid = false`

### 4. Payment Page

**Location**: `app/customer/jobs/[id]/payment/page.tsx`

**URL Parameters**:
- `?type=upfront` - For upfront payment
- `?type=final` - For final payment (default)

**Payment Summary** shows:
- Job Title
- Payment Type (PARTIAL/FULL/POST_WORK)
- Upfront Percentage (if PARTIAL)
- Total Amount
- **Amount to Pay**: ₹X (upfront or final based on type)
- Note: "Remaining ₹Y will be due after job completion" (for upfront)

**Payment Processing**:
1. Creates Razorpay order
2. Opens Razorpay checkout
3. Customer completes payment
4. Backend verifies payment
5. Updates `upfrontPaid = true` or `finalPaid = true`
6. Redirects to job details page

### 5. Backend Payment Processing

**Location**: `PaymentService.confirmPayment()`

**Parameters**:
- `jobId`
- `transactionCode`
- `razorpayPaymentId`
- `razorpayOrderId`
- `razorpaySignature`
- `paymentType` (optional: "upfront" or "final")

**Logic**:
1. Verifies payment signature with Razorpay
2. Updates `PaymentTransaction` status to SUCCESS
3. Determines if upfront or final payment:
   - If `paymentType = "upfront"` OR amount matches `upfrontAmount` and `upfrontPaid = false` → **Upfront Payment**
   - Otherwise → **Final Payment**
4. Updates `JobPaymentSchedule`:
   - **Upfront Payment**:
     - Sets `upfrontPaid = true`
     - Sets `upfrontPaymentDate = now()`
     - Sets `payment_status = 'PARTIAL'` (if final amount > 0) or `'COMPLETED'` (if full payment)
   - **Final Payment**:
     - Sets `finalPaid = true`
     - Sets `finalPaymentDate = now()`
     - Sets `payment_status = 'COMPLETED'`
5. Updates job status:
   - **Upfront Payment**: Job status remains `ACCEPTED` (no change)
   - **Final Payment**: Job status changes to `COMPLETED`

### 6. Job Status Flow

```
PENDING → MATCHED → ACCEPTED → [Upfront Payment] → IN_PROGRESS → COMPLETED → [Final Payment] → COMPLETED
```

**Important**:
- Upfront payment does NOT change job status
- Job remains `ACCEPTED` after upfront payment
- Provider can start job after upfront payment is confirmed
- Final payment changes job status from `PAYMENT_PENDING` to `COMPLETED`

## Example Scenario

**Job Details**:
- Total Amount: ₹10,000
- Provider Preference: PARTIAL, 30% upfront

**Payment Schedule Created**:
- `upfront_amount = ₹3,000` (30%)
- `final_amount = ₹7,000` (70%)
- `upfront_paid = false`
- `final_paid = false`

**Customer Actions**:
1. Receives notification: "Please pay ₹3,000 (30% upfront) to proceed"
2. Sees "Pay Upfront ₹3,000" button on job details page
3. Clicks button → Goes to `/customer/jobs/[id]/payment?type=upfront`
4. Pays ₹3,000 via Razorpay
5. Payment confirmed → `upfrontPaid = true`, `payment_status = 'PARTIAL'`
6. Job status remains `ACCEPTED`
7. Provider can now start the job

**After Job Completion**:
1. Provider marks job as complete with final price
2. Job status changes to `PAYMENT_PENDING`
3. Customer sees "Pay Final ₹7,000" button
4. Customer pays final amount
5. Payment confirmed → `finalPaid = true`, `payment_status = 'COMPLETED'`
6. Job status changes to `COMPLETED`

## Key Points

1. **Upfront payment is required** when provider preference is PARTIAL or FULL
2. **Customer is notified** immediately when job is accepted
3. **Payment button is visible** on job details page when upfront is not paid
4. **Job status remains ACCEPTED** after upfront payment (allows provider to start)
5. **Final payment** is required after job completion
6. **Payment schedule tracks** both upfront and final payments separately

## Database Fields

**job_payment_schedule**:
- `upfront_amount` - Amount to be paid upfront
- `final_amount` - Amount to be paid after completion
- `upfront_paid` - Boolean flag for upfront payment status
- `final_paid` - Boolean flag for final payment status
- `upfront_payment_date` - When upfront was paid
- `final_payment_date` - When final was paid
- `payment_status` - PENDING / PARTIAL / COMPLETED

## API Endpoints

1. **GET** `/payments/schedule?jobId={id}` - Get payment schedule
2. **POST** `/payments/create-link` - Create payment link
   - Body: `{ jobId, amount, paymentChannel: 'ONLINE', paymentType: 'upfront'|'final' }`
3. **POST** `/payments/confirm` - Confirm payment
   - Params: `jobId, transactionCode, razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentType`

## Frontend Routes

1. `/customer/jobs/[id]` - Job details with payment summary
2. `/customer/jobs/[id]/payment?type=upfront` - Upfront payment page
3. `/customer/jobs/[id]/payment?type=final` - Final payment page
