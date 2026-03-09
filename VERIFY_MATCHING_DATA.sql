-- ============================================
-- VERIFICATION QUERIES FOR MATCHING ALGORITHM
-- Job ID = 4: pod_id=4, service_skill_id=3, zone_id=4, city_id=2
-- ============================================

-- 1. VERIFY JOB DATA
SELECT '=== JOB DATA ===' as step;
SELECT id, job_code, pod_id, zone_id, city_id, service_category_id, service_skill_id, status
FROM job_master 
WHERE id = 4;

-- 2. CHECK IF ANY PROVIDERS EXIST
SELECT '=== TOTAL PROVIDERS ===' as step;
SELECT COUNT(*) as total_providers
FROM service_provider_profile
WHERE (is_deleted IS NULL OR is_deleted = false);

-- 3. CHECK PROVIDERS BY STATUS
SELECT '=== PROVIDERS BY STATUS ===' as step;
SELECT profile_status, COUNT(*) as count
FROM service_provider_profile
WHERE (is_deleted IS NULL OR is_deleted = false)
GROUP BY profile_status;

-- 4. CHECK ACTIVE PROVIDERS
SELECT '=== ACTIVE PROVIDERS ===' as step;
SELECT COUNT(*) as active_providers
FROM service_provider_profile
WHERE (is_deleted IS NULL OR is_deleted = false)
  AND profile_status = 'ACTIVE';

-- 5. CHECK AVAILABLE PROVIDERS
SELECT '=== AVAILABLE PROVIDERS ===' as step;
SELECT COUNT(*) as available_providers
FROM service_provider_profile
WHERE (is_deleted IS NULL OR is_deleted = false)
  AND profile_status = 'ACTIVE'
  AND (is_available IS NULL OR is_available = true);

-- 6. CHECK PROVIDERS WITH MINIMUM RATING
SELECT '=== PROVIDERS WITH RATING >= 3.0 ===' as step;
SELECT COUNT(*) as providers_with_rating
FROM service_provider_profile
WHERE (is_deleted IS NULL OR is_deleted = false)
  AND profile_status = 'ACTIVE'
  AND (is_available IS NULL OR is_available = true)
  AND (rating IS NULL OR rating >= 3.0);

-- 7. CHECK PROVIDERS IN POD 4
SELECT '=== PROVIDERS IN POD 4 ===' as step;
SELECT COUNT(DISTINCT p.id) as providers_in_pod
FROM service_provider_profile p
INNER JOIN provider_pod_map pod ON pod.provider_id = p.id
WHERE pod.pod_id = 4
  AND (pod.is_deleted IS NULL OR pod.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE';

-- 8. CHECK PROVIDERS IN ZONE 4
SELECT '=== PROVIDERS IN ZONE 4 ===' as step;
SELECT COUNT(DISTINCT p.id) as providers_in_zone
FROM service_provider_profile p
INNER JOIN provider_pod_map zone ON zone.provider_id = p.id
WHERE zone.zone_id = 4
  AND (zone.is_deleted IS NULL OR zone.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE';

-- 9. CHECK PROVIDERS IN CITY 2
SELECT '=== PROVIDERS IN CITY 2 ===' as step;
SELECT COUNT(DISTINCT p.id) as providers_in_city
FROM service_provider_profile p
INNER JOIN provider_pod_map city ON city.provider_id = p.id
WHERE city.city_id = 2
  AND (city.is_deleted IS NULL OR city.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE';

-- 10. CHECK PROVIDERS WITH SKILL 3
SELECT '=== PROVIDERS WITH SKILL 3 ===' as step;
SELECT COUNT(DISTINCT p.id) as providers_with_skill
FROM service_provider_profile p
INNER JOIN provider_skill_map skill ON skill.provider_id = p.id
WHERE skill.skill_id = 3
  AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE';

-- 11. CHECK PROVIDERS WITH POD 4 + ALL FILTERS
SELECT '=== PROVIDERS: POD 4 + ALL FILTERS ===' as step;
SELECT COUNT(DISTINCT p.id) as matching_providers
FROM service_provider_profile p
INNER JOIN provider_pod_map pod ON pod.provider_id = p.id
INNER JOIN provider_skill_map skill ON skill.provider_id = p.id
WHERE pod.pod_id = 4
  AND skill.skill_id = 3
  AND (pod.is_deleted IS NULL OR pod.is_deleted = false)
  AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- 12. CHECK PROVIDERS WITH ZONE 4 + ALL FILTERS (if no POD match)
SELECT '=== PROVIDERS: ZONE 4 + ALL FILTERS ===' as step;
SELECT COUNT(DISTINCT p.id) as matching_providers
FROM service_provider_profile p
INNER JOIN provider_pod_map zone ON zone.provider_id = p.id
INNER JOIN provider_skill_map skill ON skill.provider_id = p.id
LEFT JOIN provider_pod_map pod ON pod.provider_id = p.id AND pod.pod_id = 4
WHERE zone.zone_id = 4
  AND skill.skill_id = 3
  AND pod.id IS NULL  -- No POD match
  AND (zone.is_deleted IS NULL OR zone.is_deleted = false)
  AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- 13. CHECK PROVIDERS WITH CITY 2 + ALL FILTERS (if no POD/Zone match)
SELECT '=== PROVIDERS: CITY 2 + ALL FILTERS ===' as step;
SELECT COUNT(DISTINCT p.id) as matching_providers
FROM service_provider_profile p
INNER JOIN provider_pod_map city ON city.provider_id = p.id
INNER JOIN provider_skill_map skill ON skill.provider_id = p.id
LEFT JOIN provider_pod_map pod ON pod.provider_id = p.id AND pod.pod_id = 4
LEFT JOIN provider_pod_map zone ON zone.provider_id = p.id AND zone.zone_id = 4
WHERE city.city_id = 2
  AND skill.skill_id = 3
  AND pod.id IS NULL  -- No POD match
  AND zone.id IS NULL  -- No Zone match
  AND (city.is_deleted IS NULL OR city.is_deleted = false)
  AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- 14. DETAILED VIEW: Show actual providers that should match
SELECT '=== DETAILED MATCHING PROVIDERS ===' as step;
SELECT DISTINCT
    p.id,
    p.provider_code,
    p.profile_status,
    p.is_available,
    p.rating,
    CASE WHEN pod.id IS NOT NULL THEN 'POD' 
         WHEN zone.id IS NOT NULL THEN 'ZONE'
         WHEN city.id IS NOT NULL THEN 'CITY'
         ELSE 'NONE' END as location_match_type,
    CASE WHEN skill.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_skill
FROM service_provider_profile p
LEFT JOIN provider_pod_map pod ON pod.provider_id = p.id 
    AND pod.pod_id = 4
    AND (pod.is_deleted IS NULL OR pod.is_deleted = false)
LEFT JOIN provider_pod_map zone ON zone.provider_id = p.id 
    AND zone.zone_id = 4
    AND (zone.is_deleted IS NULL OR zone.is_deleted = false)
LEFT JOIN provider_pod_map city ON city.provider_id = p.id 
    AND city.city_id = 2
    AND (city.is_deleted IS NULL OR city.is_deleted = false)
LEFT JOIN provider_skill_map skill ON skill.provider_id = p.id 
    AND skill.skill_id = 3
    AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0)
ORDER BY 
    CASE WHEN pod.id IS NOT NULL THEN 1 
         WHEN zone.id IS NOT NULL THEN 2 
         WHEN city.id IS NOT NULL THEN 3 
         ELSE 4 END,
    p.rating DESC;

-- 15. CHECK WHAT PODS/ZONES/CITIES PROVIDERS ARE IN
SELECT '=== PROVIDER LOCATION DISTRIBUTION ===' as step;
SELECT 
    'POD' as location_type,
    pod.pod_id as location_id,
    COUNT(DISTINCT p.id) as provider_count
FROM service_provider_profile p
INNER JOIN provider_pod_map pod ON pod.provider_id = p.id
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (pod.is_deleted IS NULL OR pod.is_deleted = false)
GROUP BY pod.pod_id
UNION ALL
SELECT 
    'ZONE' as location_type,
    zone.zone_id as location_id,
    COUNT(DISTINCT p.id) as provider_count
FROM service_provider_profile p
INNER JOIN provider_pod_map zone ON zone.provider_id = p.id
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (zone.is_deleted IS NULL OR zone.is_deleted = false)
  AND zone.zone_id IS NOT NULL
GROUP BY zone.zone_id
UNION ALL
SELECT 
    'CITY' as location_type,
    city.city_id as location_id,
    COUNT(DISTINCT p.id) as provider_count
FROM service_provider_profile p
INNER JOIN provider_pod_map city ON city.provider_id = p.id
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (city.is_deleted IS NULL OR city.is_deleted = false)
GROUP BY city.city_id
ORDER BY location_type, location_id;

-- 16. CHECK WHAT SKILLS PROVIDERS HAVE
SELECT '=== PROVIDER SKILL DISTRIBUTION ===' as step;
SELECT 
    skill.skill_id,
    COUNT(DISTINCT p.id) as provider_count
FROM service_provider_profile p
INNER JOIN provider_skill_map skill ON skill.provider_id = p.id
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
GROUP BY skill.skill_id
ORDER BY skill.skill_id;
