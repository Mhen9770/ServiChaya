# Provider Type Usage Documentation

## Field: `service_provider_profile.provider_type`

### Purpose
The `provider_type` field distinguishes between individual service providers and business entities.

### Values
- **INDIVIDUAL**: Single person providing services (e.g., freelance electrician, plumber)
- **BUSINESS**: Company/organization providing services (e.g., AC repair company, plumbing business)

### Current Usage
Currently set during onboarding in `ProviderOnboardingService.completeStep1()`:
- Defaults to "INDIVIDUAL" if not specified
- Can be set to "BUSINESS" if business name is provided

### Potential Use Cases (Not Yet Implemented)
1. **Different Commission Rates**: Businesses might have different commission structures
2. **Team Management**: BUSINESS type can have multiple workers/team members
3. **Verification Requirements**: Different verification processes for individuals vs businesses
4. **Tax Handling**: Different tax implications and documentation
5. **Payment Processing**: Different payout methods (individual bank account vs business account)
6. **Subscription Plans**: Different subscription tiers for businesses
7. **Analytics**: Separate analytics for individual vs business providers
8. **Support Priority**: Different support levels based on provider type

### Recommendation
- Use `provider_type` to differentiate business logic where needed
- Add provider-type-specific configurations in `provider_earning_config` or `provider_commission_override`
- Consider adding team management features for BUSINESS type providers
- Use in matching algorithm to prefer businesses for larger/complex jobs
