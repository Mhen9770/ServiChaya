# Platform Earnings System - Complete Implementation

## Overview
A fully configurable platform earnings system that supports multiple earning models with database-driven defaults and provider-specific overrides.

## Key Features

### 1. **CommonMaster Table** - No Hardcoded Defaults
- **Purpose**: Stores all default platform configurations
- **Categories**: EARNING, PAYMENT, MATCHING, FEATURE, JOB
- **Benefits**: All defaults come from database, no code changes needed

### 2. **Multiple Earning Models**
- **COMMISSION_ONLY**: Platform earns percentage/fixed commission from job amount
- **LEAD_ONLY**: Platform earns fixed/percentage price per lead/job
- **HYBRID**: Platform earns both commission and lead price (weighted)

### 3. **Configuration Priority**
1. **ProviderEarningConfig** (provider-specific override) - Highest priority
2. **PlatformEarningConfig** (category/city specific)
3. **CommonMaster** defaults - Fallback

### 4. **Tables Created**

#### `common_master`
- Stores all default configurations
- Categories: EARNING, PAYMENT, MATCHING, FEATURE, JOB
- Replaces all hardcoded values

#### `platform_earning_config`
- Platform-wide earning configurations
- Can be set per category, city, or globally
- Supports all three earning models

#### `provider_earning_config`
- Provider-specific earning overrides
- Admin can configure custom rates per provider
- Supports all three earning models

#### `service_commission_master`
- Base commission rates by category/city/type
- Used when no provider override exists

### 5. **Services Created**

#### `ConfigService`
- Retrieves defaults from CommonMaster
- Cached for performance
- Type-safe getters (BigDecimal, Integer, Boolean, String)

#### `EarningCalculationService`
- Calculates platform earnings using configured models
- Handles COMMISSION_ONLY, LEAD_ONLY, HYBRID
- Applies min/max constraints
- Returns detailed earning breakdown

#### `EarningConfigService`
- Admin service for managing earning configurations
- CRUD operations for platform and provider configs

### 6. **Admin APIs**

#### Earning Configuration
- `GET /admin/earning-config/platform` - List platform configs
- `POST /admin/earning-config/platform` - Create platform config
- `PUT /admin/earning-config/platform/{id}` - Update platform config
- `GET /admin/earning-config/provider` - List provider configs
- `POST /admin/earning-config/provider` - Create provider config
- `PUT /admin/earning-config/provider/{id}` - Update provider config
- `DELETE /admin/earning-config/provider/{id}` - Delete provider config

#### Job Assignment
- `POST /admin/jobs/{jobId}/assign` - Manually assign job to provider
- `GET /admin/jobs/{jobId}/available-providers` - Get eligible providers
- `DELETE /admin/jobs/{jobId}/assignments/{matchId}` - Remove assignment

### 7. **Feature Flags**

#### AUTO_MATCHING_FEATURE
- Stored in CommonMaster (FEATURE category)
- When enabled: Automatic matching on job creation
- When disabled: Admin must manually assign jobs
- Integrated in `JobService.createJob()`

### 8. **Payment Flow Integration**

#### job_payment_schedule Usage
- Created when job is completed
- Updated with final price
- Tracks payment status (PENDING, COMPLETED)
- Used in both CASH and ONLINE payments
- Properly linked to payment transactions

### 9. **Removed Hardcoded Values**

All hardcoded defaults removed from:
- `CommissionService` - Uses CommonMaster for default commission
- `PaymentService` - Uses ConfigService for payment defaults
- `JobService` - Uses ConfigService for AUTO_MATCHING_FEATURE
- All other services use ConfigService

### 10. **Provider Type Usage**

**Field**: `service_provider_profile.provider_type`
- **Values**: INDIVIDUAL, BUSINESS
- **Current**: Set during onboarding
- **Future Use**: Different commission rates, team management, verification requirements

## Migration File

`V8__008_Common_Master_Default_Configs.sql`
- Inserts default configurations into CommonMaster
- Includes: EARNING, PAYMENT, MATCHING, FEATURE, JOB defaults
- Sets AUTO_MATCHING_FEATURE = true by default

## Example Configurations

### Platform Earning Config (COMMISSION_ONLY)
```json
{
  "earningModel": "COMMISSION_ONLY",
  "serviceCategoryId": 3,
  "cityId": 2,
  "commissionPercentage": 18.00,
  "minimumCommission": 50.00,
  "maximumCommission": 5000.00
}
```

### Provider Earning Config (HYBRID)
```json
{
  "providerId": 5,
  "earningModel": "HYBRID",
  "commissionPercentage": 10.00,
  "leadPrice": 100.00,
  "hybridCommissionWeight": 60.00,
  "hybridLeadWeight": 40.00
}
```

## Benefits

1. **Fully Configurable**: No code changes needed to adjust rates
2. **Flexible Models**: Support for commission, lead, or hybrid
3. **Provider-Specific**: Admin can customize per provider
4. **Database-Driven**: All defaults from CommonMaster
5. **Scalable**: Easy to add new earning models
6. **Admin Control**: Full admin panel for configuration
