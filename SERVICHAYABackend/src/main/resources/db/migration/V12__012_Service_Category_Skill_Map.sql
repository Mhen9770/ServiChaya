-- ============================================
-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Service Category - Skill Mapping Master Data
-- Maps which skills are applicable to which categories/sub-categories

-- ============================================
-- ROOT CATEGORY MAPPINGS
-- ============================================

-- ELECTRICAL category → ELECTRICIAN, AC_TECHNICIAN, APPLIANCE_TECHNICIAN
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'ELECTRICAL' 
  AND c.parent_id IS NULL
  AND s.code IN ('ELECTRICIAN', 'AC_TECHNICIAN', 'APPLIANCE_TECHNICIAN')
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 3;

-- PLUMBING category → PLUMBER
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'PLUMBING' 
  AND c.parent_id IS NULL
  AND s.code = 'PLUMBER'
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 1;

-- CARPENTRY category → CARPENTER
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'CARPENTRY' 
  AND c.parent_id IS NULL
  AND s.code = 'CARPENTER'
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 1;

-- HOUSING category → CLEANER, PAINTER, PEST_CONTROL_SPECIALIST
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'HOUSING' 
  AND c.parent_id IS NULL
  AND s.code IN ('CLEANER', 'PAINTER', 'PEST_CONTROL_SPECIALIST')
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 3;

-- WORKER category → CLEANER (for office boy / helper services)
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'WORKER' 
  AND c.parent_id IS NULL
  AND s.code = 'CLEANER'
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 1;

-- ============================================
-- SUB-CATEGORY MAPPINGS
-- ============================================

-- FAN (under ELECTRICAL) → ELECTRICIAN, AC_TECHNICIAN
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'FAN' 
  AND c.parent_id IS NOT NULL
  AND s.code IN ('ELECTRICIAN', 'AC_TECHNICIAN')
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 2;

-- TV (under ELECTRICAL) → APPLIANCE_TECHNICIAN, ELECTRICIAN
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'TV' 
  AND c.parent_id IS NOT NULL
  AND s.code IN ('APPLIANCE_TECHNICIAN', 'ELECTRICIAN')
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 2;

-- COOLER (under ELECTRICAL) → AC_TECHNICIAN, ELECTRICIAN
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'COOLER' 
  AND c.parent_id IS NOT NULL
  AND s.code IN ('AC_TECHNICIAN', 'ELECTRICIAN')
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 2;

-- WATER_LEAKAGE (under PLUMBING) → PLUMBER
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'WATER_LEAKAGE' 
  AND c.parent_id IS NOT NULL
  AND s.code = 'PLUMBER'
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 1;

-- DOOR_REPAIR (under CARPENTRY) → CARPENTER
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'DOOR_REPAIR' 
  AND c.parent_id IS NOT NULL
  AND s.code = 'CARPENTER'
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 1;

-- TABLE_REPAIR (under CARPENTRY) → CARPENTER
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'TABLE_REPAIR' 
  AND c.parent_id IS NOT NULL
  AND s.code = 'CARPENTER'
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 1;

-- OFFICE_BOY (under WORKER) → CLEANER
INSERT INTO service_category_skill_map (service_category_id, service_skill_id, is_active, created_at, updated_at)
SELECT 
    c.id,
    s.id,
    TRUE,
    NOW(),
    NOW()
FROM service_category_master c
CROSS JOIN service_skill_master s
WHERE c.code = 'OFFICE_BOY' 
  AND c.parent_id IS NOT NULL
  AND s.code = 'CLEANER'
  AND s.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM service_category_skill_map m
      WHERE m.service_category_id = c.id 
        AND m.service_skill_id = s.id
  )
LIMIT 1;
