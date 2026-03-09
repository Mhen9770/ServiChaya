-- ============================================
-- Flyway Migration: Configuration Master Data
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT statements)
-- Default business rules and feature flags
-- ============================================

-- Business Rules Master Data
INSERT INTO business_rule_master (rule_code, rule_name, rule_value, rule_type, applies_to, is_active, description, created_at, updated_at, is_deleted)
VALUES
-- Payment Rules
('MIN_WITHDRAWAL', 'Minimum Withdrawal Amount', '{"value": 500}', 'FIXED_AMOUNT', 'PROVIDER', true, 'Minimum amount providers can withdraw in a single transaction', NOW(), NOW(), false),
('MAX_WITHDRAWAL', 'Maximum Withdrawal Amount', '{"value": 50000}', 'FIXED_AMOUNT', 'PROVIDER', true, 'Maximum amount providers can withdraw in a single transaction', NOW(), NOW(), false),
('PAYMENT_PROCESSING_DAYS', 'Payment Processing Days', '{"value": 2}', 'TIME_DURATION', 'PLATFORM', true, 'Number of days for payment processing', NOW(), NOW(), false),

-- Cancellation Rules
('CANCELLATION_FEE_BEFORE_START', 'Cancellation Fee Before Start', '{"value": 10, "minimum": 50}', 'PERCENTAGE', 'CUSTOMER', true, 'Percentage of job amount charged as cancellation fee when customer cancels after provider accepts but before start (minimum ₹50)', NOW(), NOW(), false),
('CANCELLATION_FEE_AFTER_START', 'Cancellation Fee After Start', '{"value": 20, "minimum": 100}', 'PERCENTAGE', 'CUSTOMER', true, 'Percentage of job amount charged as cancellation fee when customer cancels after provider started (minimum ₹100)', NOW(), NOW(), false),
('PROVIDER_CANCELLATION_PENALTY', 'Provider Cancellation Penalty', '{"value": 5}', 'PERCENTAGE', 'PROVIDER', true, 'Percentage penalty on provider earnings when provider cancels after acceptance', NOW(), NOW(), false),
('PROVIDER_NO_SHOW_PENALTY', 'Provider No-Show Penalty', '{"value": 10}', 'PERCENTAGE', 'PROVIDER', true, 'Percentage penalty on provider when they do not show up within 30 minutes', NOW(), NOW(), false),

-- Matching Rules
('PROVIDER_RESPONSE_TIMEOUT_SECONDS', 'Provider Response Timeout', '{"value": 120}', 'TIME_DURATION', 'PROVIDER', true, 'Seconds provider has to respond to job notification before timeout', NOW(), NOW(), false),
('MAX_PROVIDERS_TO_NOTIFY', 'Max Providers to Notify', '{"value": 5}', 'TIME_DURATION', 'PLATFORM', true, 'Maximum number of providers to notify per job', NOW(), NOW(), false),
('MIN_MATCH_SCORE', 'Minimum Match Score', '{"value": 50}', 'PERCENTAGE', 'PLATFORM', true, 'Minimum match score required for provider to be eligible', NOW(), NOW(), false),

-- Job Rules
('MAX_JOB_DURATION_HOURS', 'Maximum Job Duration Hours', '{"value": 24}', 'TIME_DURATION', 'PLATFORM', true, 'Maximum duration for a job in hours', NOW(), NOW(), false),
('TRAVEL_COMPENSATION_MIN', 'Travel Compensation Minimum', '{"value": 100}', 'FIXED_AMOUNT', 'PROVIDER', true, 'Minimum travel compensation when customer no-show (₹)', NOW(), NOW(), false),
('TRAVEL_COMPENSATION_MAX', 'Travel Compensation Maximum', '{"value": 200}', 'FIXED_AMOUNT', 'PROVIDER', true, 'Maximum travel compensation when customer no-show (₹)', NOW(), NOW(), false),

-- Rating Rules
('MIN_RATING_FOR_PROVIDER', 'Minimum Rating for Provider', '{"value": 3.0}', 'PERCENTAGE', 'PROVIDER', true, 'Minimum rating required for provider to be active (out of 5.0)', NOW(), NOW(), false),

-- Commission Rules (fallback - actual commission uses service_commission_master)
('COMMISSION_RATE_DEFAULT', 'Default Commission Rate', '{"value": 15}', 'PERCENTAGE', 'PLATFORM', true, 'Default platform commission percentage when no specific config exists', NOW(), NOW(), false)
ON DUPLICATE KEY UPDATE 
    rule_name = VALUES(rule_name),
    rule_value = VALUES(rule_value),
    updated_at = NOW();

-- Feature Flags Master Data
INSERT INTO feature_flag_master (feature_code, feature_name, description, is_enabled, rollout_percentage, is_active, created_at, updated_at, is_deleted)
VALUES
('AUTO_MATCHING_FEATURE', 'Automatic Job Matching', 'Enable automatic job matching when job is created', true, 100, true, NOW(), NOW(), false),
('ENABLE_WALLET', 'Wallet System', 'Enable platform wallet for customers and providers', false, 0, true, NOW(), NOW(), false),
('ENABLE_SUBSCRIPTION', 'Provider Subscription Plans', 'Enable provider subscription plans (Free, Basic, Professional, Enterprise)', false, 0, true, NOW(), NOW(), false),
('ENABLE_REFERRAL', 'Referral Program', 'Enable referral program for customers and providers', false, 0, true, NOW(), NOW(), false),
('ENABLE_RECURRING_CONTRACTS', 'Recurring Service Contracts', 'Enable recurring service contracts for property management', false, 0, true, NOW(), NOW(), false),
('ENABLE_QUOTE_SYSTEM', 'Quote/Estimate System', 'Enable quote/estimate generation system for providers', false, 0, true, NOW(), NOW(), false),
('ENABLE_TEAM_MANAGEMENT', 'Team Management', 'Enable team management for business providers', false, 0, true, NOW(), NOW(), false),
('ENABLE_INVENTORY_MANAGEMENT', 'Inventory Management', 'Enable inventory/parts management for providers', false, 0, true, NOW(), NOW(), false),
('ENABLE_WHATSAPP_NOTIFICATIONS', 'WhatsApp Notifications', 'Enable WhatsApp notifications for users', false, 0, true, NOW(), NOW(), false),
('ENABLE_PREMIUM_LISTING', 'Premium Listing', 'Enable premium listing feature for providers', false, 0, true, NOW(), NOW(), false)
ON DUPLICATE KEY UPDATE 
    feature_name = VALUES(feature_name),
    description = VALUES(description),
    updated_at = NOW();
