-- Matching Rules Master Data
-- These rules are configurable and can be updated via admin panel

INSERT INTO matching_rule_master (rule_code, rule_name, rule_type, weight_percentage, calculation_logic, is_active, priority_order, created_at, updated_at, is_deleted)
VALUES
('SKILL_MATCH', 'Skill Match', 'SKILL_MATCH', 30.00, '{"perfect":100,"related":70,"partial":50}', true, 1, NOW(), NOW(), false),
('DISTANCE', 'Geographic Proximity', 'DISTANCE', 25.00, '{"pod":100,"zone":80,"city":60}', true, 2, NOW(), NOW(), false),
('RATING', 'Provider Rating', 'RATING', 20.00, '{"5.0":100,"4.5":90,"4.0":80,"3.5":70}', true, 3, NOW(), NOW(), false),
('SUBSCRIPTION_TIER', 'Subscription Tier', 'SUBSCRIPTION_TIER', 10.00, '{"enterprise":100,"professional":80,"basic":60,"free":40}', true, 4, NOW(), NOW(), false),
('ACCEPTANCE_RATE', 'Acceptance Rate', 'ACCEPTANCE_RATE', 8.00, '{"above90":100,"80to90":85,"70to80":70,"60to70":50,"below60":30}', true, 5, NOW(), NOW(), false),
('RESPONSE_TIME', 'Response Time', 'RESPONSE_TIME', 5.00, '{"under1min":100,"1to2min":80,"2to5min":60,"above5min":40}', true, 6, NOW(), NOW(), false),
('JOB_HISTORY', 'Job History with Customer', 'JOB_HISTORY', 2.00, '{"perJob":20}', true, 7, NOW(), NOW(), false);
