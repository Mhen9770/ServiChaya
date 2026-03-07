-- ============================================
-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Service Category Master Data
INSERT INTO service_category_master (code, name, description, icon_url, display_order, is_active, is_featured, created_at, updated_at) VALUES
('AC_REPAIR', 'AC Repair & Service', 'Air conditioner installation, repair, and maintenance services', '❄️', 1, true, true, NOW(), NOW()),
('PLUMBING', 'Plumbing', 'All plumbing services including repairs, installation, and maintenance', '🔧', 2, true, true, NOW(), NOW()),
('ELECTRICAL', 'Electrical', 'Electrical repairs, wiring, and installation services', '⚡', 3, true, true, NOW(), NOW()),
('CLEANING', 'Cleaning', 'Home and office cleaning services', '✨', 4, true, true, NOW(), NOW()),
('APPLIANCE_REPAIR', 'Appliance Repair', 'Home appliance repair and maintenance', '🔌', 5, true, false, NOW(), NOW()),
('CARPENTRY', 'Carpentry', 'Furniture making, repair, and carpentry services', '🪚', 6, true, false, NOW(), NOW()),
('PAINTING', 'Painting', 'Interior and exterior painting services', '🎨', 7, true, false, NOW(), NOW()),
('PEST_CONTROL', 'Pest Control', 'Professional pest control and extermination services', '🐛', 8, true, false, NOW(), NOW());
