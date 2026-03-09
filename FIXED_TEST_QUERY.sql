-- ============================================
-- FIXED TEST QUERY FOR JOB ID = 4
-- Issue Found: Rating filter was too strict (excluded 0.00 ratings)
-- Fix: Allow NULL, 0.00, or >= 3.0 ratings
-- ============================================

SELECT DISTINCT
    p.id as providerId,
    p.provider_code as providerCode,
    p.user_id as userId,
    p.rating,
    p.profile_status as profileStatus,
    p.is_available as isAvailable,
    p.is_online as isOnline,
    p.total_jobs_completed as totalJobsCompleted,
    p.avg_response_time_minutes as avgResponseTimeMinutes,
    CASE WHEN pod.id IS NOT NULL THEN 1 ELSE 0 END as hasPodMatch,
    CASE WHEN zone.id IS NOT NULL AND pod.id IS NULL THEN 1 ELSE 0 END as hasZoneMatch,
    CASE WHEN city.id IS NOT NULL AND pod.id IS NULL AND zone.id IS NULL THEN 1 ELSE 0 END as hasCityMatch,
    CASE WHEN skill.id IS NOT NULL THEN 1 ELSE 0 END as hasSkillMatch,
    NULL as distanceKm
FROM service_provider_profile p
CROSS JOIN job_master j
-- POD match (highest priority) - pod_id = 4
LEFT JOIN provider_pod_map pod ON pod.provider_id = p.id 
    AND pod.pod_id = 4
    AND (pod.is_deleted IS NULL OR pod.is_deleted = false)
-- Zone match (fallback if no POD) - zone_id = 4
LEFT JOIN provider_pod_map zone ON zone.provider_id = p.id 
    AND zone.zone_id = 4
    AND (zone.is_deleted IS NULL OR zone.is_deleted = false)
-- City match (fallback if no POD or Zone) - city_id = 2
LEFT JOIN provider_pod_map city ON city.provider_id = p.id 
    AND city.city_id = 2
    AND (city.is_deleted IS NULL OR city.is_deleted = false)
-- Skill match - service_skill_id = 3
LEFT JOIN provider_skill_map skill ON skill.provider_id = p.id 
    AND skill.skill_id = 3
    AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
WHERE j.id = 4
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  -- FIXED: Allow NULL, 0.00 (new providers), or >= 3.0 ratings
  AND (p.rating IS NULL OR p.rating = 0 OR p.rating >= 3.0)
  -- Must have at least one location match
  AND (pod.id IS NOT NULL OR zone.id IS NOT NULL OR city.id IS NOT NULL)
  -- Must have skill match (service_skill_id = 3 is not NULL, so skill must match)
  AND skill.id IS NOT NULL
ORDER BY 
    CASE WHEN pod.id IS NOT NULL THEN 1 ELSE 2 END,
    p.rating DESC,
    p.total_jobs_completed DESC
LIMIT 100;
