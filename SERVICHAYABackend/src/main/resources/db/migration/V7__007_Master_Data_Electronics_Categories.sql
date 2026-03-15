-- ============================================
-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Master Data: Electronics Categories (2-level hierarchy only)
-- All categories are direct children of ELECTRICAL root (level 1)
-- No nested hierarchies - only parent and direct children

-- Mobile Phone Categories (direct children of ELECTRICAL)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'SMARTPHONES',
    'Smartphones',
    'Smartphone repair and service',
    'HOME_SERVICE',
    '📱',
    4,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Smartphones',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'SMARTPHONES')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'IPHONE',
    'iPhone',
    'iPhone repair and service',
    'HOME_SERVICE',
    '📱',
    5,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/iPhone',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'IPHONE')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'ANDROID_PHONES',
    'Android Phones',
    'Android phone repair and service',
    'HOME_SERVICE',
    '📱',
    6,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Android Phones',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'ANDROID_PHONES')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'FEATURE_PHONES',
    'Feature Phones',
    'Feature phone repair and service',
    'HOME_SERVICE',
    '📞',
    7,
    false,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Feature Phones',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'FEATURE_PHONES')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'IPHONE_SCREEN',
    'iPhone Screen Repair',
    'iPhone screen replacement and repair',
    'HOME_SERVICE',
    '📱',
    8,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/iPhone Screen Repair',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'IPHONE_SCREEN')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'IPHONE_BATTERY',
    'iPhone Battery Replacement',
    'iPhone battery replacement service',
    'HOME_SERVICE',
    '🔋',
    9,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/iPhone Battery Replacement',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'IPHONE_BATTERY')
LIMIT 1;

-- Computer Categories (direct children of ELECTRICAL)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'LAPTOPS',
    'Laptops',
    'Laptop repair and service',
    'HOME_SERVICE',
    '💻',
    10,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Laptops',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'LAPTOPS')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'DESKTOPS',
    'Desktops',
    'Desktop computer repair and service',
    'HOME_SERVICE',
    '🖥️',
    11,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Desktops',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'DESKTOPS')
LIMIT 1;

-- Home Appliance Categories (direct children of ELECTRICAL)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'AC',
    'Air Conditioners',
    'AC installation, repair and service',
    'HOME_SERVICE',
    '❄️',
    12,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Air Conditioners',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'AC')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'WINDOW_AC',
    'Window AC',
    'Window AC installation and repair',
    'HOME_SERVICE',
    '❄️',
    13,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Window AC',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'WINDOW_AC')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'SPLIT_AC',
    'Split AC',
    'Split AC installation and repair',
    'HOME_SERVICE',
    '❄️',
    14,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Split AC',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'SPLIT_AC')
LIMIT 1;

INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'REFRIGERATORS',
    'Refrigerators',
    'Refrigerator repair and service',
    'HOME_SERVICE',
    '🧊',
    15,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRICAL' LIMIT 1),
    1,
    'Electronics & Electrical/Refrigerators',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'REFRIGERATORS')
LIMIT 1;
