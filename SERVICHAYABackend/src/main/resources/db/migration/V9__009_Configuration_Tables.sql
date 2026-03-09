-- ============================================
-- Flyway Migration: Configuration Tables
-- ============================================
-- IMPORTANT: Schema changes (CREATE TABLE) for configuration system
-- These tables are managed by JPA but we create them here for production
-- ============================================

-- Business Rule Master Table
CREATE TABLE IF NOT EXISTS business_rule_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(100) UNIQUE NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_value JSON,
    rule_type VARCHAR(50) NOT NULL COMMENT 'PERCENTAGE, FIXED_AMOUNT, TIME_DURATION, BOOLEAN',
    applies_to VARCHAR(50) NOT NULL COMMENT 'CUSTOMER, PROVIDER, PLATFORM, ALL',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_rule_code (rule_code),
    INDEX idx_active (is_active),
    INDEX idx_applies_to (applies_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature Flag Master Table
CREATE TABLE IF NOT EXISTS feature_flag_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feature_code VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    enabled_for_users JSON COMMENT 'Array of user IDs',
    enabled_for_cities JSON COMMENT 'Array of city IDs',
    rollout_percentage INT DEFAULT 0 COMMENT '0-100',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_feature_code (feature_code),
    INDEX idx_active (is_active),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
