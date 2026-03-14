-- Migration: Add Provider Selection and Messaging Tables
-- Created: 2026-03-14
-- Description: Adds tables for provider bidding/ranking and job messaging

-- Provider Job Bid Table
CREATE TABLE IF NOT EXISTS provider_job_bid (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rank_order INT,
    status VARCHAR(50) DEFAULT 'PENDING',
    proposed_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE KEY uk_job_provider (job_id, provider_id),
    INDEX idx_job_bid_rank (job_id, bid_amount DESC, rank_order),
    INDEX idx_provider_bids (provider_id),
    INDEX idx_status (status),
    FOREIGN KEY (job_id) REFERENCES job_master(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES service_provider_profile(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Message Table
CREATE TABLE IF NOT EXISTS job_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_type VARCHAR(50) NOT NULL COMMENT 'CUSTOMER or PROVIDER',
    message TEXT NOT NULL,
    attachment_url VARCHAR(500),
    attachment_type VARCHAR(50) COMMENT 'IMAGE, PDF, DOCUMENT, OTHER',
    status VARCHAR(50) DEFAULT 'SENT' COMMENT 'SENT, DELIVERED, READ',
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_job_messages (job_id, created_at),
    INDEX idx_sender_messages (sender_id, sender_type),
    INDEX idx_status (status),
    FOREIGN KEY (job_id) REFERENCES job_master(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
