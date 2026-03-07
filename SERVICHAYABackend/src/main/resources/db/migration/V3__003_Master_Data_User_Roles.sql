-- Master Data: User Roles
-- Schema managed by JPA, only data here

INSERT INTO user_role_master (code, name, description, role_code, is_system_role, is_active, created_at, updated_at)
VALUES 
('SUPER_ADMIN', 'Super Admin', 'Super Administrator with full access', 'SUPER_ADMIN', true, true, NOW(), NOW()),
('ADMIN', 'Admin', 'Administrator with platform management access', 'ADMIN', true, true, NOW(), NOW()),
('CITY_ADMIN', 'City Admin', 'City-level administrator', 'CITY_ADMIN', true, true, NOW(), NOW()),
('ZONE_ADMIN', 'Zone Admin', 'Zone-level administrator', 'ZONE_ADMIN', true, true, NOW(), NOW()),
('SUPPORT_AGENT', 'Support Agent', 'Customer support agent', 'SUPPORT_AGENT', true, true, NOW(), NOW()),
('CUSTOMER', 'Customer', 'Platform customer', 'CUSTOMER', true, true, NOW(), NOW()),
('SERVICE_PROVIDER', 'Service Provider', 'Service provider/technician', 'SERVICE_PROVIDER', true, true, NOW(), NOW()),
('WORKFORCE', 'Workforce', 'Workforce worker (maid, driver, etc.)', 'WORKFORCE', true, true, NOW(), NOW());
