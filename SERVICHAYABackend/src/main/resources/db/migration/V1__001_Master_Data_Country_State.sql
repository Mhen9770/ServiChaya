-- Master Data: Country and State
-- This migration contains only master data, schema is managed by JPA

-- Country Master Data
INSERT INTO country_master (code, name, description, country_code, currency_code, phone_code, is_active, created_at, updated_at)
VALUES 
('IND', 'India', 'Republic of India', 'IN', 'INR', '+91', true, NOW(), NOW());

-- State Master Data (Madhya Pradesh and key states)
INSERT INTO state_master (code, name, description, country_id, state_code, is_active, created_at, updated_at)
SELECT 
    'MP', 
    'Madhya Pradesh', 
    'Madhya Pradesh State',
    id,
    'MP',
    true,
    NOW(),
    NOW()
FROM country_master WHERE code = 'IND';

-- Add more states as needed
INSERT INTO state_master (code, name, description, country_id, state_code, is_active, created_at, updated_at)
SELECT 
    'MH', 
    'Maharashtra', 
    'Maharashtra State',
    id,
    'MH',
    true,
    NOW(),
    NOW()
FROM country_master WHERE code = 'IND';

INSERT INTO state_master (code, name, description, country_id, state_code, is_active, created_at, updated_at)
SELECT 
    'DL', 
    'Delhi', 
    'Delhi Union Territory',
    id,
    'DL',
    true,
    NOW(),
    NOW()
FROM country_master WHERE code = 'IND';
