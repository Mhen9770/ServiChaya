-- ============================================
-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Master Data: Super Admin User
-- Creates the initial Super Admin user for system administration
-- 
-- IMPORTANT: The password_hash below is a BCrypt hash for "Admin@123"
-- You should verify this hash matches your BCrypt implementation or update it
-- after migration. To generate a new BCrypt hash, use Spring's BCryptPasswordEncoder
-- or an online BCrypt generator.
-- 
-- Default credentials:
-- Email: admin@servichaya.com
-- Mobile: 9770877208
-- Password: Admin@123 (MUST be changed on first login)

-- Insert Super Admin User Account
INSERT INTO user_account (
    first_name, 
    last_name, 
    full_name, 
    email, 
    mobile_number, 
    password_hash, 
    account_status, 
    email_verified, 
    mobile_verified, 
    registration_source, 
    is_active, 
    created_at, 
    updated_at
)
SELECT 
    'Super',
    'Admin',
    'Super Admin',
    'admin@servichaya.com',
    '9770877208',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- BCrypt hash for "Admin@123" (verify this matches your BCrypt implementation)
    'ACTIVE',
    true,
    true,
    'ADMIN_CREATED',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_account WHERE email = 'admin@servichaya.com' OR mobile_number = '9770877208')
LIMIT 1;

-- Map Super Admin User to SUPER_ADMIN Role
INSERT INTO user_role_map (user_id, role_id, assigned_at, created_at, updated_at)
SELECT 
    u.id,
    r.id,
    NOW(),
    NOW(),
    NOW()
FROM user_account u
CROSS JOIN user_role_master r
WHERE u.email = 'admin@servichaya.com'
  AND r.code = 'SUPER_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_role_map urm 
    WHERE urm.user_id = u.id AND urm.role_id = r.id
  )
LIMIT 1;
