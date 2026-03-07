-- ============================================
-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Master Data: Complete Master Data Setup
-- This script consolidates and extends all master data

-- ============================================
-- 1. COUNTRIES (if not exists)
-- ============================================
INSERT INTO country_master (code, name, description, country_code, currency_code, phone_code, is_active, created_at, updated_at)
SELECT 'IND', 'India', 'Republic of India', 'IN', 'INR', '+91', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM country_master WHERE code = 'IND');

-- ============================================
-- 2. STATES (if not exists)
-- ============================================
INSERT INTO state_master (code, name, description, country_id, is_active, created_at, updated_at)
SELECT 
    'MP', 
    'Madhya Pradesh', 
    'Madhya Pradesh State',
    id,
    true,
    NOW(),
    NOW()
FROM country_master WHERE code = 'IND'
AND NOT EXISTS (SELECT 1 FROM state_master WHERE code = 'MP');

INSERT INTO state_master (code, name, description, country_id, is_active, created_at, updated_at)
SELECT 
    'MH', 
    'Maharashtra', 
    'Maharashtra State',
    id,
    true,
    NOW(),
    NOW()
FROM country_master WHERE code = 'IND'
AND NOT EXISTS (SELECT 1 FROM state_master WHERE code = 'MH');

INSERT INTO state_master (code, name, description, country_id, is_active, created_at, updated_at)
SELECT 
    'DL', 
    'Delhi', 
    'Delhi Union Territory',
    id,
    true,
    NOW(),
    NOW()
FROM country_master WHERE code = 'IND'
AND NOT EXISTS (SELECT 1 FROM state_master WHERE code = 'DL');

-- ============================================
-- 3. CITIES (if not exists)
-- ============================================
-- Indore
INSERT INTO city_master (code, name, description, state_id, latitude, longitude, timezone, population, is_serviceable, is_active, created_at, updated_at)
SELECT 
    'INDORE',
    'Indore',
    'Indore City - Commercial Capital of MP',
    id,
    22.7196,
    75.8577,
    'Asia/Kolkata',
    3270000,
    true,
    true,
    NOW(),
    NOW()
FROM state_master WHERE code = 'MP'
AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'INDORE');

-- Sanawad
INSERT INTO city_master (code, name, description, state_id, latitude, longitude, timezone, population, is_serviceable, is_active, created_at, updated_at)
SELECT 
    'SANAWAD',
    'Sanawad',
    'Sanawad City',
    id,
    22.1833,
    76.0667,
    'Asia/Kolkata',
    50000,
    true,
    true,
    NOW(),
    NOW()
FROM state_master WHERE code = 'MP'
AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'SANAWAD');

-- Khandwa
INSERT INTO city_master (code, name, description, state_id, latitude, longitude, timezone, population, is_serviceable, is_active, created_at, updated_at)
SELECT 
    'KHANDWA',
    'Khandwa',
    'Khandwa City',
    id,
    21.8257,
    76.3523,
    'Asia/Kolkata',
    200000,
    true,
    true,
    NOW(),
    NOW()
FROM state_master WHERE code = 'MP'
AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'KHANDWA');

-- Khargone
INSERT INTO city_master (code, name, description, state_id, latitude, longitude, timezone, population, is_serviceable, is_active, created_at, updated_at)
SELECT 
    'KHARGONE',
    'Khargone',
    'Khargone City',
    id,
    21.8236,
    75.6103,
    'Asia/Kolkata',
    150000,
    true,
    true,
    NOW(),
    NOW()
FROM state_master WHERE code = 'MP'
AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'KHARGONE');

-- ============================================
-- 4. ZONES (if not exists)
-- ============================================
-- Indore Zones
INSERT INTO zone_master (code, name, description, city_id, latitude, longitude, service_priority, is_active, created_at, updated_at)
SELECT 
    'INDORE_CENTRAL',
    'Central Indore',
    'Central Zone of Indore',
    id,
    22.7196,
    75.8577,
    1,
    true,
    NOW(),
    NOW()
FROM city_master WHERE code = 'INDORE'
AND NOT EXISTS (SELECT 1 FROM zone_master WHERE code = 'INDORE_CENTRAL');

INSERT INTO zone_master (code, name, description, city_id, latitude, longitude, service_priority, is_active, created_at, updated_at)
SELECT 
    'INDORE_EAST',
    'East Indore',
    'East Zone of Indore',
    id,
    22.7200,
    75.8700,
    2,
    true,
    NOW(),
    NOW()
FROM city_master WHERE code = 'INDORE'
AND NOT EXISTS (SELECT 1 FROM zone_master WHERE code = 'INDORE_EAST');

INSERT INTO zone_master (code, name, description, city_id, latitude, longitude, service_priority, is_active, created_at, updated_at)
SELECT 
    'INDORE_WEST',
    'West Indore',
    'West Zone of Indore',
    id,
    22.7100,
    75.8400,
    2,
    true,
    NOW(),
    NOW()
FROM city_master WHERE code = 'INDORE'
AND NOT EXISTS (SELECT 1 FROM zone_master WHERE code = 'INDORE_WEST');

-- Sanawad Zones
INSERT INTO zone_master (code, name, description, city_id, latitude, longitude, service_priority, is_active, created_at, updated_at)
SELECT 
    'SANAWAD_CENTRAL',
    'Central Sanawad',
    'Central Zone of Sanawad',
    id,
    22.1833,
    76.0667,
    1,
    true,
    NOW(),
    NOW()
FROM city_master WHERE code = 'SANAWAD'
AND NOT EXISTS (SELECT 1 FROM zone_master WHERE code = 'SANAWAD_CENTRAL');

-- ============================================
-- 5. PODs (if not exists)
-- ============================================
-- Indore Central PODs
INSERT INTO pod_master (code, name, description, city_id, zone_id, latitude, longitude, service_radius_km, max_providers, max_workforce, is_active, created_at, updated_at)
SELECT 
    'INDORE_CENTRAL_POD1',
    'Indore Central POD 1',
    'Primary POD for Central Indore',
    c.id,
    z.id,
    22.7196,
    75.8577,
    5.0,
    50,
    20,
    true,
    NOW(),
    NOW()
FROM city_master c
JOIN zone_master z ON z.city_id = c.id AND z.code = 'INDORE_CENTRAL'
WHERE c.code = 'INDORE'
AND NOT EXISTS (SELECT 1 FROM pod_master WHERE code = 'INDORE_CENTRAL_POD1');

INSERT INTO pod_master (code, name, description, city_id, zone_id, latitude, longitude, service_radius_km, max_providers, max_workforce, is_active, created_at, updated_at)
SELECT 
    'INDORE_CENTRAL_POD2',
    'Indore Central POD 2',
    'Secondary POD for Central Indore',
    c.id,
    z.id,
    22.7250,
    75.8600,
    5.0,
    50,
    20,
    true,
    NOW(),
    NOW()
FROM city_master c
JOIN zone_master z ON z.city_id = c.id AND z.code = 'INDORE_CENTRAL'
WHERE c.code = 'INDORE'
AND NOT EXISTS (SELECT 1 FROM pod_master WHERE code = 'INDORE_CENTRAL_POD2');

-- Indore East POD
INSERT INTO pod_master (code, name, description, city_id, zone_id, latitude, longitude, service_radius_km, max_providers, max_workforce, is_active, created_at, updated_at)
SELECT 
    'INDORE_EAST_POD1',
    'Indore East POD 1',
    'Primary POD for East Indore',
    c.id,
    z.id,
    22.7200,
    75.8700,
    5.0,
    50,
    20,
    true,
    NOW(),
    NOW()
FROM city_master c
JOIN zone_master z ON z.city_id = c.id AND z.code = 'INDORE_EAST'
WHERE c.code = 'INDORE'
AND NOT EXISTS (SELECT 1 FROM pod_master WHERE code = 'INDORE_EAST_POD1');

-- Sanawad Central POD
INSERT INTO pod_master (code, name, description, city_id, zone_id, latitude, longitude, service_radius_km, max_providers, max_workforce, is_active, created_at, updated_at)
SELECT 
    'SANAWAD_CENTRAL_POD1',
    'Sanawad Central POD 1',
    'Primary POD for Central Sanawad',
    c.id,
    z.id,
    22.1833,
    76.0667,
    5.0,
    30,
    15,
    true,
    NOW(),
    NOW()
FROM city_master c
JOIN zone_master z ON z.city_id = c.id AND z.code = 'SANAWAD_CENTRAL'
WHERE c.code = 'SANAWAD'
AND NOT EXISTS (SELECT 1 FROM pod_master WHERE code = 'SANAWAD_CENTRAL_POD1');

-- ============================================
-- 6. SERVICE CATEGORIES (if not exists)
-- ============================================
INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'AC_REPAIR', 'AC Repair & Service', 'Air conditioner installation, repair, and maintenance services', '❄️', 1, true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'AC_REPAIR');

INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'PLUMBING', 'Plumbing', 'All plumbing services including repairs, installation, and maintenance', '🔧', 2, true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'PLUMBING');

INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'ELECTRICAL', 'Electrical', 'Electrical repairs, wiring, and installation services', '⚡', 3, true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'ELECTRICAL');

INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'CLEANING', 'Cleaning', 'Home and office cleaning services', '✨', 4, true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'CLEANING');

INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'APPLIANCE_REPAIR', 'Appliance Repair', 'Home appliance repair and maintenance', '🔌', 5, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'APPLIANCE_REPAIR');

INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'CARPENTRY', 'Carpentry', 'Furniture making, repair, and carpentry services', '🪚', 6, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'CARPENTRY');

INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'PAINTING', 'Painting', 'Interior and exterior painting services', '🎨', 7, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'PAINTING');

INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) 
SELECT 'PEST_CONTROL', 'Pest Control', 'Professional pest control and extermination services', '🐛', 8, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'PEST_CONTROL');

-- ============================================
-- 7. SERVICE SKILLS (if not exists)
-- ============================================
INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'AC_TECHNICIAN', 'AC Technician', 'Air conditioner installation, repair, and maintenance specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'AC_TECHNICIAN');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'PLUMBER', 'Plumber', 'Plumbing installation, repair, and maintenance specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'PLUMBER');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'ELECTRICIAN', 'Electrician', 'Electrical wiring, repair, and installation specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'ELECTRICIAN');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'CLEANER', 'Professional Cleaner', 'Home and office cleaning specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'CLEANER');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'APPLIANCE_TECHNICIAN', 'Appliance Technician', 'Home appliance repair and maintenance specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'APPLIANCE_TECHNICIAN');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'CARPENTER', 'Carpenter', 'Furniture making, repair, and carpentry specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'CARPENTER');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'PAINTER', 'Painter', 'Interior and exterior painting specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'PAINTER');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'PEST_CONTROL_SPECIALIST', 'Pest Control Specialist', 'Professional pest control and extermination specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'PEST_CONTROL_SPECIALIST');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'WELDER', 'Welder', 'Metal welding and fabrication specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'WELDER');

INSERT INTO service_skill_master (code, name, description, is_active, created_at, updated_at)
SELECT 'TILER', 'Tiler', 'Tile installation and repair specialist', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_skill_master WHERE code = 'TILER');

-- ============================================
-- 8. USER ROLES (if not exists)
-- ============================================
INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'SUPER_ADMIN', 'Super Admin', 'Super Administrator with full access', 'SUPER_ADMIN', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'SUPER_ADMIN');

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'ADMIN', 'Admin', 'Administrator with platform management access', 'ADMIN', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'ADMIN');

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'CITY_ADMIN', 'City Admin', 'City-level administrator', 'CITY_ADMIN', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'CITY_ADMIN');

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'ZONE_ADMIN', 'Zone Admin', 'Zone-level administrator', 'ZONE_ADMIN', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'ZONE_ADMIN');

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'SUPPORT_AGENT', 'Support Agent', 'Customer support agent', 'SUPPORT_AGENT', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'SUPPORT_AGENT');

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'CUSTOMER', 'Customer', 'Platform customer', 'CUSTOMER', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'CUSTOMER');

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'SERVICE_PROVIDER', 'Service Provider', 'Service provider/technician', 'SERVICE_PROVIDER', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'SERVICE_PROVIDER');

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
SELECT 'WORKFORCE', 'Workforce', 'Workforce worker (maid, driver, etc.)', 'WORKFORCE', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_master WHERE code = 'WORKFORCE');

-- ============================================
-- 9. MATCHING RULES (if not exists)
-- ============================================
INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
SELECT 'SKILL_MATCH', 'Skill Match', 'SKILL_MATCH', 30.00, '{"perfect":100,"related":70,"partial":50}', true, 1, NOW(), NOW(), false
WHERE NOT EXISTS (SELECT 1 FROM matching_rule_master WHERE rule_code = 'SKILL_MATCH');

INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
SELECT 'DISTANCE', 'Geographic Proximity', 'DISTANCE', 25.00, '{"pod":100,"zone":80,"city":60}', true, 2, NOW(), NOW(), false
WHERE NOT EXISTS (SELECT 1 FROM matching_rule_master WHERE rule_code = 'DISTANCE');

INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
SELECT 'RATING', 'Provider Rating', 'RATING', 20.00, '{"5.0":100,"4.5":90,"4.0":80,"3.5":70}', true, 3, NOW(), NOW(), false
WHERE NOT EXISTS (SELECT 1 FROM matching_rule_master WHERE rule_code = 'RATING');

INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
SELECT 'SUBSCRIPTION_TIER', 'Subscription Tier', 'SUBSCRIPTION_TIER', 10.00, '{"enterprise":100,"professional":80,"basic":60,"free":40}', true, 4, NOW(), NOW(), false
WHERE NOT EXISTS (SELECT 1 FROM matching_rule_master WHERE rule_code = 'SUBSCRIPTION_TIER');

INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
SELECT 'ACCEPTANCE_RATE', 'Acceptance Rate', 'ACCEPTANCE_RATE', 8.00, '{"above90":100,"80to90":85,"70to80":70,"60to70":50,"below60":30}', true, 5, NOW(), NOW(), false
WHERE NOT EXISTS (SELECT 1 FROM matching_rule_master WHERE rule_code = 'ACCEPTANCE_RATE');

INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
SELECT 'RESPONSE_TIME', 'Response Time', 'RESPONSE_TIME', 5.00, '{"under1min":100,"1to2min":80,"2to5min":60,"above5min":40}', true, 6, NOW(), NOW(), false
WHERE NOT EXISTS (SELECT 1 FROM matching_rule_master WHERE rule_code = 'RESPONSE_TIME');

INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
SELECT 'JOB_HISTORY', 'Job History with Customer', 'JOB_HISTORY', 2.00, '{"perJob":20}', true, 7, NOW(), NOW(), false
WHERE NOT EXISTS (SELECT 1 FROM matching_rule_master WHERE rule_code = 'JOB_HISTORY');
