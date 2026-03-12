-- ============================================
-- Flyway Migration: Workflow Master Data (Electronics & Electrical)
-- ============================================
-- IMPORTANT:
--  - ONLY master data (INSERT/UPDATE) is allowed here.
--  - Schema (tables/columns) is managed by JPA/Hibernate.
-- ============================================

-- 1. Workflow Template: Electronics - Simple Service
INSERT INTO job_workflow_template (workflow_code, workflow_name, description, is_active, created_at, updated_at)
SELECT
    'ELECTRONICS_SIMPLE',
    'Electronics - Simple Service',
    'Standard flow for electronics services: BOOK -> MATCHING -> ACCEPTED -> IN_PROGRESS -> PAYMENT_PENDING -> COMPLETED',
    TRUE,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM job_workflow_template WHERE workflow_code = 'ELECTRONICS_SIMPLE'
)
LIMIT 1;

-- Steps for ELECTRONICS_SIMPLE
-- Step 1: BOOK (PENDING)
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    1,
    'BOOK',
    'STATUS_CHANGE',
    'PENDING',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRONICS_SIMPLE'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 1
  )
LIMIT 1;

-- Step 2: MATCHING
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    2,
    'MATCHING',
    'STATUS_CHANGE',
    'MATCHING',
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRONICS_SIMPLE'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 2
  )
LIMIT 1;

-- Step 3: ACCEPTED
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    3,
    'ACCEPTED',
    'STATUS_CHANGE',
    'ACCEPTED',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRONICS_SIMPLE'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 3
  )
LIMIT 1;

-- Step 4: IN_PROGRESS
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    4,
    'IN_PROGRESS',
    'STATUS_CHANGE',
    'IN_PROGRESS',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRONICS_SIMPLE'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 4
  )
LIMIT 1;

-- Step 5: PAYMENT_PENDING
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    5,
    'PAYMENT_PENDING',
    'PAYMENT',
    'PAYMENT_PENDING',
    'POST_WORK',
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRONICS_SIMPLE'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 5
  )
LIMIT 1;

-- Step 6: COMPLETED
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    6,
    'COMPLETED',
    'STATUS_CHANGE',
    'COMPLETED',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRONICS_SIMPLE'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 6
  )
LIMIT 1;

-- Assignment: Electronics & Electrical root category uses ELECTRONICS_SIMPLE workflow
INSERT INTO job_workflow_assignment (workflow_template_id, service_type_id, service_category_id, service_subcategory_id, priority, is_active, created_at, updated_at)
SELECT
    t.id,
    NULL,
    c.id,
    NULL,
    10,
    TRUE,
    NOW(),
    NOW()
FROM job_workflow_template t
JOIN service_category_master c ON c.code = 'ELECTRICAL'
WHERE t.workflow_code = 'ELECTRONICS_SIMPLE'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_assignment a
      WHERE a.workflow_template_id = t.id
        AND a.service_category_id = c.id
        AND a.service_subcategory_id IS NULL
  )
LIMIT 1;


-- 2. Workflow Template: Electrical - Visit Then Work
INSERT INTO job_workflow_template (workflow_code, workflow_name, description, is_active, created_at, updated_at)
SELECT
    'ELECTRICAL_VISIT',
    'Electrical - Visit Then Work',
    'Flow for electrical services requiring an initial visit before main work.',
    TRUE,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM job_workflow_template WHERE workflow_code = 'ELECTRICAL_VISIT'
)
LIMIT 1;

-- Steps for ELECTRICAL_VISIT
-- Step 1: BOOK (PENDING)
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    1,
    'BOOK',
    'STATUS_CHANGE',
    'PENDING',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 1
  )
LIMIT 1;

-- Step 2: MATCHING
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    2,
    'MATCHING',
    'STATUS_CHANGE',
    'MATCHING',
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 2
  )
LIMIT 1;

-- Step 3: ACCEPTED
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    3,
    'ACCEPTED',
    'STATUS_CHANGE',
    'ACCEPTED',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 3
  )
LIMIT 1;

-- Step 4: VISIT (no status change, used for visit charges / scheduling)
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    4,
    'VISIT',
    'VISIT',
    NULL,
    NULL,
    TRUE,
    FALSE,
    '{"visitRequired":true}',
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 4
  )
LIMIT 1;

-- Step 5: IN_PROGRESS (main work)
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    5,
    'IN_PROGRESS',
    'STATUS_CHANGE',
    'IN_PROGRESS',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 5
  )
LIMIT 1;

-- Step 6: PAYMENT_PENDING
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    6,
    'PAYMENT_PENDING',
    'PAYMENT',
    'PAYMENT_PENDING',
    'POST_WORK',
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 6
  )
LIMIT 1;

-- Step 7: COMPLETED
INSERT INTO job_workflow_step_template (workflow_template_id, step_order, step_code, step_type, status_value, payment_type, is_mandatory, auto_advance, config_json, created_at, updated_at)
SELECT
    t.id,
    7,
    'COMPLETED',
    'STATUS_CHANGE',
    'COMPLETED',
    NULL,
    TRUE,
    FALSE,
    NULL,
    NOW(),
    NOW()
FROM job_workflow_template t
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_step_template
      WHERE workflow_template_id = t.id AND step_order = 7
  )
LIMIT 1;

-- Assignment: ELECTRICAL root category uses ELECTRICAL_VISIT workflow (if category exists)
INSERT INTO job_workflow_assignment (workflow_template_id, service_type_id, service_category_id, service_subcategory_id, priority, is_active, created_at, updated_at)
SELECT
    t.id,
    NULL,
    c.id,
    NULL,
    10,
    TRUE,
    NOW(),
    NOW()
FROM job_workflow_template t
JOIN service_category_master c ON c.code = 'ELECTRICAL'
WHERE t.workflow_code = 'ELECTRICAL_VISIT'
  AND NOT EXISTS (
      SELECT 1 FROM job_workflow_assignment a
      WHERE a.workflow_template_id = t.id
        AND a.service_category_id = c.id
        AND a.service_subcategory_id IS NULL
  )
LIMIT 1;

