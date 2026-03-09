-- ============================================
-- STEP-BY-STEP DIAGNOSTIC QUERY
-- Shows providers at each filtering stage
-- ============================================

-- Step 1: All providers (no filters)
SELECT 'Step 1: All Providers' as stage, COUNT(*) as count
FROM service_provider_profile p
WHERE (p.is_deleted IS NULL OR p.is_deleted = false);

-- Step 2: After is_deleted filter
SELECT 'Step 2: Not Deleted' as stage, COUNT(*) as count
FROM service_provider_profile p
WHERE (p.is_deleted IS NULL OR p.is_deleted = false);

-- Step 3: After profile_status = 'ACTIVE'
SELECT 'Step 3: Active Status' as stage, COUNT(*) as count
FROM service_provider_profile p
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE';

-- Step 4: After is_available filter
SELECT 'Step 4: Available' as stage, COUNT(*) as count
FROM service_provider_profile p
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true);

-- Step 5: After rating >= 3.0 filter
SELECT 'Step 5: Rating >= 3.0' as stage, COUNT(*) as count
FROM service_provider_profile p
WHERE (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- Step 6: With POD 4 match
SELECT 'Step 6: With POD 4 Match' as stage, COUNT(DISTINCT p.id) as count
FROM service_provider_profile p
INNER JOIN provider_pod_map pod ON pod.provider_id = p.id
WHERE pod.pod_id = 4
  AND (pod.is_deleted IS NULL OR pod.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- Step 7: With Zone 4 match (no POD)
SELECT 'Step 7: With Zone 4 Match (No POD)' as stage, COUNT(DISTINCT p.id) as count
FROM service_provider_profile p
INNER JOIN provider_pod_map zone ON zone.provider_id = p.id
LEFT JOIN provider_pod_map pod ON pod.provider_id = p.id AND pod.pod_id = 4
WHERE zone.zone_id = 4
  AND pod.id IS NULL
  AND (zone.is_deleted IS NULL OR zone.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- Step 8: With City 2 match (no POD/Zone)
SELECT 'Step 8: With City 2 Match (No POD/Zone)' as stage, COUNT(DISTINCT p.id) as count
FROM service_provider_profile p
INNER JOIN provider_pod_map city ON city.provider_id = p.id
LEFT JOIN provider_pod_map pod ON pod.provider_id = p.id AND pod.pod_id = 4
LEFT JOIN provider_pod_map zone ON zone.provider_id = p.id AND zone.zone_id = 4
WHERE city.city_id = 2
  AND pod.id IS NULL
  AND zone.id IS NULL
  AND (city.is_deleted IS NULL OR city.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- Step 9: With Skill 3 match
SELECT 'Step 9: With Skill 3 Match' as stage, COUNT(DISTINCT p.id) as count
FROM service_provider_profile p
INNER JOIN provider_skill_map skill ON skill.provider_id = p.id
WHERE skill.skill_id = 3
  AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
  AND (p.is_deleted IS NULL OR p.is_deleted = false)
  AND p.profile_status = 'ACTIVE'
  AND (p.is_available IS NULL OR p.is_available = true)
  AND (p.rating IS NULL OR p.rating >= 3.0);

-- Step 10: FINAL - POD 4 + Skill 3
SELECT 'Step 10: FINAL - POD 4 + Skill 3' as stage, COUNT(DISTINCT p.id) as count
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

-- ============================================
-- SHOW ACTUAL PROVIDER DATA
-- ============================================
SELECT '=== PROVIDER DETAILS ===' as info;
SELECT 
    p.id,
    p.provider_code,
    p.profile_status,
    p.is_available,
    p.rating,
    p.is_deleted
FROM service_provider_profile p
ORDER BY p.id
LIMIT 20;

-- ============================================
-- SHOW PROVIDER POD MAPPINGS
-- ============================================
SELECT '=== PROVIDER POD MAPPINGS ===' as info;
SELECT 
    pod.provider_id,
    pod.pod_id,
    pod.zone_id,
    pod.city_id,
    pod.is_deleted
FROM provider_pod_map pod
ORDER BY pod.provider_id, pod.pod_id
LIMIT 20;

-- ============================================
-- SHOW PROVIDER SKILL MAPPINGS
-- ============================================
SELECT '=== PROVIDER SKILL MAPPINGS ===' as info;
SELECT 
    skill.provider_id,
    skill.skill_id,
    skill.is_deleted
FROM provider_skill_map skill
ORDER BY skill.provider_id, skill.skill_id
LIMIT 20;
