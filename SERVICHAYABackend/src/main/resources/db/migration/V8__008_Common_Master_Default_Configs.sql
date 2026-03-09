-- Common Master Table - Default Platform Configurations
-- This replaces all hardcoded defaults in the codebase

-- EARNING/COMMISSION Defaults
INSERT INTO common_master (config_category, config_key, config_name, config_value, value_type, description, applies_to, is_active, display_order, created_at, updated_at, is_deleted)
VALUES 
('EARNING', 'DEFAULT_COMMISSION_PERCENTAGE', 'Default Commission Percentage', '15.00', 'PERCENTAGE', 'Default platform commission percentage when no specific config exists', 'PLATFORM', true, 1, NOW(), NOW(), false),
('EARNING', 'DEFAULT_LEAD_PRICE', 'Default Lead Price', '50.00', 'FIXED_AMOUNT', 'Default lead price per job when using LEAD_ONLY model', 'PLATFORM', true, 2, NOW(), NOW(), false),
('EARNING', 'DEFAULT_EARNING_MODEL', 'Default Earning Model', 'COMMISSION_ONLY', 'STRING', 'Default earning model: COMMISSION_ONLY, LEAD_ONLY, or HYBRID', 'PLATFORM', true, 3, NOW(), NOW(), false);

-- PAYMENT Defaults
INSERT INTO common_master (config_category, config_key, config_name, config_value, value_type, description, applies_to, is_active, display_order, created_at, updated_at, is_deleted)
VALUES 
('PAYMENT', 'MIN_WITHDRAWAL_AMOUNT', 'Minimum Withdrawal Amount', '500.00', 'FIXED_AMOUNT', 'Minimum amount providers can withdraw', 'PROVIDER', true, 1, NOW(), NOW(), false),
('PAYMENT', 'PAYMENT_PROCESSING_DAYS', 'Payment Processing Days', '2', 'NUMBER', 'Number of days for payment processing', 'PLATFORM', true, 2, NOW(), NOW(), false),
('PAYMENT', 'MAX_WITHDRAWAL_AMOUNT', 'Maximum Withdrawal Amount', '50000.00', 'FIXED_AMOUNT', 'Maximum amount per withdrawal transaction', 'PROVIDER', true, 3, NOW(), NOW(), false);

-- MATCHING Defaults
INSERT INTO common_master (config_category, config_key, config_name, config_value, value_type, description, applies_to, is_active, display_order, created_at, updated_at, is_deleted)
VALUES 
('MATCHING', 'PROVIDER_RESPONSE_TIMEOUT_SECONDS', 'Provider Response Timeout', '120', 'NUMBER', 'Seconds provider has to respond to job notification', 'PROVIDER', true, 1, NOW(), NOW(), false),
('MATCHING', 'MAX_PROVIDERS_TO_NOTIFY', 'Max Providers to Notify', '5', 'NUMBER', 'Maximum number of providers to notify per job', 'PLATFORM', true, 2, NOW(), NOW(), false),
('MATCHING', 'MIN_MATCH_SCORE', 'Minimum Match Score', '50.00', 'PERCENTAGE', 'Minimum match score required for provider to be eligible', 'PLATFORM', true, 3, NOW(), NOW(), false);

-- FEATURE Flags
INSERT INTO common_master (config_category, config_key, config_name, config_value, value_type, description, applies_to, is_active, display_order, created_at, updated_at, is_deleted)
VALUES 
('FEATURE', 'AUTO_MATCHING_FEATURE', 'Auto Matching Feature', 'true', 'BOOLEAN', 'Enable automatic job matching when job is created', 'PLATFORM', true, 1, NOW(), NOW(), false),
('FEATURE', 'ENABLE_WALLET', 'Enable Wallet Feature', 'false', 'BOOLEAN', 'Enable platform wallet for customers and providers', 'ALL', true, 2, NOW(), NOW(), false),
('FEATURE', 'ENABLE_SUBSCRIPTION', 'Enable Subscription Feature', 'false', 'BOOLEAN', 'Enable provider subscription plans', 'PROVIDER', true, 3, NOW(), NOW(), false),
('FEATURE', 'ENABLE_REFERRAL', 'Enable Referral Feature', 'false', 'BOOLEAN', 'Enable referral program', 'ALL', true, 4, NOW(), NOW(), false);

-- JOB Defaults
INSERT INTO common_master (config_category, config_key, config_name, config_value, value_type, description, applies_to, is_active, display_order, created_at, updated_at, is_deleted)
VALUES 
('JOB', 'CANCELLATION_FEE_PERCENT', 'Cancellation Fee Percentage', '10.00', 'PERCENTAGE', 'Percentage of job amount charged as cancellation fee', 'CUSTOMER', true, 1, NOW(), NOW(), false),
('JOB', 'MAX_JOB_DURATION_HOURS', 'Maximum Job Duration Hours', '24', 'NUMBER', 'Maximum duration for a job in hours', 'PLATFORM', true, 2, NOW(), NOW(), false);
