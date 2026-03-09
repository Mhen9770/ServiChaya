# Payment Schedule Creation Flow

## When Payment Schedule is Created

### 1. **When Job is ACCEPTED** (Initial Creation)
- **Location**: `MatchingService.acceptJob()`
- **Trigger**: Provider accepts a job
- **Based On**: Provider's payment preference (`provider_payment_preference`)
- **Amount**: Uses `estimatedBudget` from job
- **Payment Types**:
  - **PARTIAL**: Creates schedule with upfront amount (based on percentage) and final amount
  - **FULL**: Creates schedule with full amount as upfront
  - **POST_WORK**: Creates schedule with zero upfront, full amount as final

### 2. **When Job is COMPLETED** (Update with Final Price)
- **Location**: `JobStatusService.completeJob()`
- **Trigger**: Provider completes job and enters final price
- **Action**: 
  - If schedule exists: Updates `totalAmount` and `finalAmount` with final price
  - If schedule doesn't exist: Creates new schedule with `POST_WORK` type
- **Payment Channel**: 
  - **CASH**: Payment processed immediately, schedule marked as paid
  - **ONLINE**: Payment link created, schedule remains pending until customer pays

## Payment Schedule Lifecycle

```
Job Created (PENDING)
    ↓
Provider Accepts (ACCEPTED)
    ↓
Payment Schedule Created (based on provider preference)
    - PARTIAL: Upfront amount calculated, final amount = total - upfront
    - FULL: Upfront = total, final = 0
    - POST_WORK: Upfront = 0, final = total (estimated)
    ↓
Provider Starts Job (IN_PROGRESS)
    ↓
Provider Completes Job (PAYMENT_PENDING)
    ↓
Payment Schedule Updated with Final Price
    - totalAmount = finalPrice
    - finalAmount = finalPrice (for POST_WORK)
    ↓
Payment Processing:
    - CASH: Schedule marked paid immediately, job → COMPLETED
    - ONLINE: Payment link sent, schedule remains pending
    ↓
Customer Pays (ONLINE)
    ↓
Payment Schedule: final_paid = true, payment_status = COMPLETED
    ↓
Job Status → COMPLETED
```

## Key Points

1. **Payment schedule is created EARLY** (when job is accepted) to track payment expectations
2. **Payment schedule is UPDATED** (when job is completed) with actual final price
3. **Payment schedule tracks both upfront and final payments** separately
4. **For POST_WORK payments**, schedule is created with estimated amount, then updated with final amount

## Database Fields

- `upfront_amount`: Amount paid before work starts (for PARTIAL/FULL)
- `final_amount`: Amount paid after work completion
- `total_amount`: Total job amount (updated to final price on completion)
- `upfront_paid`: Boolean flag for upfront payment status
- `final_paid`: Boolean flag for final payment status
- `payment_status`: PENDING, COMPLETED, REFUNDED, etc.
