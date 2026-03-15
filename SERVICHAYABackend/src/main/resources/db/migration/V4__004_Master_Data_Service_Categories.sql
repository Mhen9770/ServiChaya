-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Root Service Category Master Data
-- These are ROOT categories (parent_id = NULL, level = 0) used for "All Service Categories"
-- Using idempotent INSERT with WHERE NOT EXISTS to prevent duplicate key errors on re-run

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at) 
SELECT 'ELECTRICAL', 'Electronics & Electrical', 'All electronics and electrical repair / installation services', 'HOME_SERVICE', '⚡', 1, TRUE, TRUE, NULL, 0, 'Electronics & Electrical', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'ELECTRICAL');

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at) 
SELECT 'PLUMBING', 'Plumbing', 'Plumbing installation, repair, and maintenance services', 'HOME_SERVICE', '🔧', 2, TRUE, TRUE, NULL, 0, 'Plumbing', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'PLUMBING');

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at) 
SELECT 'CARPENTRY', 'Carpentry', 'Furniture making, repair, and carpentry services', 'HOME_SERVICE', '🪚', 3, TRUE, TRUE, NULL, 0, 'Carpentry', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'CARPENTRY');

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at) 
SELECT 'HOUSING', 'Housing Services', 'Home maintenance, cleaning and related services', 'HOME_SERVICE', '🏠', 4, TRUE, TRUE, NULL, 0, 'Housing Services', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'HOUSING');

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at) 
SELECT 'WORKER', 'Worker & Staffing', 'Skilled and unskilled worker / staffing services', 'HOME_SERVICE', '🧑‍🔧', 5, TRUE, TRUE, NULL, 0, 'Worker & Staffing', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'WORKER');

