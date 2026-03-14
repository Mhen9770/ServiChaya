-- Add sub_status column to job_master table for detailed state tracking
ALTER TABLE job_master 
ADD COLUMN sub_status VARCHAR(50) NULL 
COMMENT 'Sub-status for detailed state tracking. Examples: PROVIDER_ACCEPTED, CUSTOMER_SELECTED, WAITING_FOR_PROVIDER';

-- Add index for sub_status queries
CREATE INDEX idx_job_sub_status ON job_master(status, sub_status);
