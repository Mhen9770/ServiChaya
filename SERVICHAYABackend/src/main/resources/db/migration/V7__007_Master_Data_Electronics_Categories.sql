-- ============================================
-- Flyway Migration: Master Data Only
-- ============================================
-- IMPORTANT: This file contains ONLY master data (INSERT/UPDATE statements)
-- Schema changes (CREATE TABLE, ALTER TABLE, etc.) are NOT allowed here
-- Schema is managed by JPA/Hibernate (ddl-auto: update)
-- ============================================
-- Master Data: Electronics Category Hierarchy
-- Focus: Electronics with unlimited depth hierarchy

-- Root Category: Electronics
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'ELECTRONICS',
    'Electronics',
    'All electronics repair and service categories',
    'ELECTRONICS',
    '📱',
    1,
    true,
    true,
    NULL,
    0,
    'Electronics',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'ELECTRONICS')
LIMIT 1;

-- Level 1: Mobile Phones (under Electronics)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'MOBILE_PHONES',
    'Mobile Phones',
    'Mobile phone repair and service',
    'ELECTRONICS',
    '📱',
    1,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRONICS' LIMIT 1),
    1,
    'Electronics/Mobile Phones',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'MOBILE_PHONES')
LIMIT 1;

-- Level 1: Laptops & Computers (under Electronics)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'LAPTOPS_COMPUTERS',
    'Laptops & Computers',
    'Laptop and computer repair services',
    'ELECTRONICS',
    '💻',
    2,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRONICS' LIMIT 1),
    1,
    'Electronics/Laptops & Computers',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'LAPTOPS_COMPUTERS')
LIMIT 1;

-- Level 1: Home Appliances (under Electronics)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'HOME_APPLIANCES',
    'Home Appliances',
    'Home appliance repair and service',
    'ELECTRONICS',
    '🏠',
    3,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'ELECTRONICS' LIMIT 1),
    1,
    'Electronics/Home Appliances',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'HOME_APPLIANCES')
LIMIT 1;

-- Level 2: Smartphones (under Mobile Phones)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'SMARTPHONES',
    'Smartphones',
    'Smartphone repair and service',
    'ELECTRONICS',
    '📱',
    1,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'MOBILE_PHONES' LIMIT 1),
    2,
    'Electronics/Mobile Phones/Smartphones',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'SMARTPHONES')
LIMIT 1;

-- Level 2: Feature Phones (under Mobile Phones)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'FEATURE_PHONES',
    'Feature Phones',
    'Feature phone repair and service',
    'ELECTRONICS',
    '📞',
    2,
    false,
    true,
    (SELECT id FROM service_category_master WHERE code = 'MOBILE_PHONES' LIMIT 1),
    2,
    'Electronics/Mobile Phones/Feature Phones',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'FEATURE_PHONES')
LIMIT 1;

-- Level 2: Laptops (under Laptops & Computers)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'LAPTOPS',
    'Laptops',
    'Laptop repair and service',
    'ELECTRONICS',
    '💻',
    1,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'LAPTOPS_COMPUTERS' LIMIT 1),
    2,
    'Electronics/Laptops & Computers/Laptops',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'LAPTOPS')
LIMIT 1;

-- Level 2: Desktops (under Laptops & Computers)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'DESKTOPS',
    'Desktops',
    'Desktop computer repair and service',
    'ELECTRONICS',
    '🖥️',
    2,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'LAPTOPS_COMPUTERS' LIMIT 1),
    2,
    'Electronics/Laptops & Computers/Desktops',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'DESKTOPS')
LIMIT 1;

-- Level 2: AC (under Home Appliances)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'AC',
    'Air Conditioners',
    'AC installation, repair and service',
    'ELECTRONICS',
    '❄️',
    1,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'HOME_APPLIANCES' LIMIT 1),
    2,
    'Electronics/Home Appliances/Air Conditioners',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'AC')
LIMIT 1;

-- Level 2: Refrigerators (under Home Appliances)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'REFRIGERATORS',
    'Refrigerators',
    'Refrigerator repair and service',
    'ELECTRONICS',
    '🧊',
    2,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'HOME_APPLIANCES' LIMIT 1),
    2,
    'Electronics/Home Appliances/Refrigerators',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'REFRIGERATORS')
LIMIT 1;

-- Level 3: iPhone (under Smartphones)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'IPHONE',
    'iPhone',
    'iPhone repair and service',
    'ELECTRONICS',
    '📱',
    1,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'SMARTPHONES' LIMIT 1),
    3,
    'Electronics/Mobile Phones/Smartphones/iPhone',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'IPHONE')
LIMIT 1;

-- Level 3: Android Phones (under Smartphones)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'ANDROID_PHONES',
    'Android Phones',
    'Android phone repair and service',
    'ELECTRONICS',
    '📱',
    2,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'SMARTPHONES' LIMIT 1),
    3,
    'Electronics/Mobile Phones/Smartphones/Android Phones',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'ANDROID_PHONES')
LIMIT 1;

-- Level 3: Window AC (under AC)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'WINDOW_AC',
    'Window AC',
    'Window AC installation and repair',
    'ELECTRONICS',
    '❄️',
    1,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'AC' LIMIT 1),
    3,
    'Electronics/Home Appliances/Air Conditioners/Window AC',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'WINDOW_AC')
LIMIT 1;

-- Level 3: Split AC (under AC)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'SPLIT_AC',
    'Split AC',
    'Split AC installation and repair',
    'ELECTRONICS',
    '❄️',
    2,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'AC' LIMIT 1),
    3,
    'Electronics/Home Appliances/Air Conditioners/Split AC',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'SPLIT_AC')
LIMIT 1;

-- Level 4: iPhone Screen Repair (under iPhone)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'IPHONE_SCREEN',
    'iPhone Screen Repair',
    'iPhone screen replacement and repair',
    'ELECTRONICS',
    '📱',
    1,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'IPHONE' LIMIT 1),
    4,
    'Electronics/Mobile Phones/Smartphones/iPhone/iPhone Screen Repair',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'IPHONE_SCREEN')
LIMIT 1;

-- Level 4: iPhone Battery (under iPhone)
INSERT INTO service_category_master (code, name, description, category_type, icon_url, display_order, is_featured, is_active, parent_id, level, path, created_at, updated_at)
SELECT 
    'IPHONE_BATTERY',
    'iPhone Battery Replacement',
    'iPhone battery replacement service',
    'ELECTRONICS',
    '🔋',
    2,
    true,
    true,
    (SELECT id FROM service_category_master WHERE code = 'IPHONE' LIMIT 1),
    4,
    'Electronics/Mobile Phones/Smartphones/iPhone/iPhone Battery Replacement',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM service_category_master WHERE code = 'IPHONE_BATTERY')
LIMIT 1;
