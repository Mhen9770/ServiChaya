-- ============================================
-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Master Data: Cities in Madhya Pradesh (Launch Cities)

-- Indore (Idempotent: Only insert if not exists)
-- INSERT INTO city_master (code, name, description, state_id, city_code, latitude, longitude, timezone, is_serviceable, is_active, created_at, updated_at)
-- SELECT 
--     'INDORE',
--     'Indore',
--     'Indore City - Commercial Capital of MP',
--     id,
--     'INDORE',
--     22.7196,
--     75.8577,
--     'Asia/Kolkata',
--     true,
--     true,
--     NOW(),
--     NOW()
-- FROM state_master 
-- WHERE code = 'MP' 
--   AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'INDORE')
-- LIMIT 1;

-- Sanawad (Idempotent: Only insert if not exists)
-- Coordinates: 22.1833°N, 76.0667°E (Sanawad, Khargone District, Madhya Pradesh)
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
FROM state_master 
WHERE code = 'MP' 
  AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'SANAWAD')
LIMIT 1;

-- Khandwa (Idempotent: Only insert if not exists)
-- INSERT INTO city_master (code, name, description, state_id, city_code, latitude, longitude, timezone, is_serviceable, is_active, created_at, updated_at)
-- SELECT 
--     'KHANDWA',
--     'Khandwa',
--     'Khandwa City',
--     id,
--     'KHANDWA',
--     21.8257,
--     76.3523,
--     'Asia/Kolkata',
--     true,
--     true,
--     NOW(),
--     NOW()
-- FROM state_master 
-- WHERE code = 'MP' 
--   AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'KHANDWA')
-- LIMIT 1;

-- -- Khargone (Idempotent: Only insert if not exists)
-- INSERT INTO city_master (code, name, description, state_id, city_code, latitude, longitude, timezone, is_serviceable, is_active, created_at, updated_at)
-- SELECT 
--     'KHARGONE',
--     'Khargone',
--     'Khargone City',
--     id,
--     'KHARGONE',
--     21.8236,
--     75.6103,
--     'Asia/Kolkata',
--     true,
--     true,
--     NOW(),
--     NOW()
-- FROM state_master 
-- WHERE code = 'MP' 
--   AND NOT EXISTS (SELECT 1 FROM city_master WHERE code = 'KHARGONE')
-- LIMIT 1;
