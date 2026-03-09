package com.servichaya.matching.repository;

import com.servichaya.job.entity.JobMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Optimized repository for matching operations using native SQL queries
 * This eliminates N+1 query problems by using JOINs and database-level filtering
 */
@Repository
public interface MatchingRepository extends JpaRepository<JobMaster, Long> {
    
    /**
     * Find eligible providers using a single optimized SQL query with JOINs
     * This replaces multiple findAll() + stream filter operations
     * 
     * Performance: O(n) where n = eligible providers (not all providers)
     * Uses database indexes for filtering
     * 
     * Using interface projection - Spring will map columns to interface methods
     */
    @Query(value = """
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
        -- POD match (highest priority)
        LEFT JOIN provider_pod_map pod ON pod.provider_id = p.id 
            AND pod.pod_id = :podId 
            AND (pod.is_deleted IS NULL OR pod.is_deleted = false)
        -- Zone match (fallback if no POD match)
        LEFT JOIN provider_pod_map zone ON zone.provider_id = p.id 
            AND zone.zone_id = :zoneId 
            AND (zone.is_deleted IS NULL OR zone.is_deleted = false)
        -- City match (fallback if no POD or Zone match)
        LEFT JOIN provider_pod_map city ON city.provider_id = p.id 
            AND city.city_id = :cityId 
            AND (city.is_deleted IS NULL OR city.is_deleted = false)
        -- Skill match (if required)
        LEFT JOIN provider_skill_map skill ON skill.provider_id = p.id 
            AND skill.skill_id = :skillId 
            AND (skill.is_deleted IS NULL OR skill.is_deleted = false)
        WHERE j.id = :jobId
          AND (p.is_deleted IS NULL OR p.is_deleted = false)
          AND p.profile_status = 'ACTIVE'
          AND (p.is_available IS NULL OR p.is_available = true)
          AND (p.rating IS NULL OR p.rating = 0 OR p.rating >= :minRating)
          -- Must have at least one location match (POD, Zone, or City)
          AND (pod.id IS NOT NULL OR zone.id IS NOT NULL OR city.id IS NOT NULL)
          -- Must have skill match if skill is required (if skillId is not NULL, skill must match)
          AND (:skillId IS NULL OR skill.id IS NOT NULL)
        ORDER BY 
            CASE WHEN hasPodMatch THEN 1 ELSE 2 END,
            p.rating DESC,
            p.total_jobs_completed DESC
        LIMIT :maxResults
        """, nativeQuery = true)
    List<ProviderMatchCandidateProjection> findEligibleProvidersOptimized(
            @Param("jobId") Long jobId,
            @Param("podId") Long podId,
            @Param("zoneId") Long zoneId,
            @Param("cityId") Long cityId,
            @Param("skillId") Long skillId,
            @Param("minRating") java.math.BigDecimal minRating,
            @Param("maxResults") int maxResults
    );

    /**
     * Batch fetch provider statistics for scoring
     * Reduces N+1 queries by fetching all stats in one query
     */
    @Query(value = """
        SELECT 
            p.id as providerId,
            COUNT(DISTINCT CASE WHEN jm.status = 'COMPLETED' THEN jm.id END) as completedJobs,
            COUNT(DISTINCT CASE WHEN jm.status = 'ACCEPTED' THEN jm.id END) as acceptedJobs,
            AVG(CASE WHEN jpm.response_time_seconds IS NOT NULL 
                THEN jpm.response_time_seconds ELSE NULL END) as avgResponseTimeSeconds,
            COUNT(DISTINCT CASE WHEN jpm.status = 'ACCEPTED' AND jpm.notified_at IS NOT NULL 
                THEN jpm.id END) as acceptedMatches,
            COUNT(DISTINCT CASE WHEN jpm.status IN ('NOTIFIED', 'PENDING') 
                THEN jpm.id END) as totalMatches
        FROM service_provider_profile p
        LEFT JOIN job_master jm ON jm.provider_id = p.id 
            AND (jm.is_deleted IS NULL OR jm.is_deleted = false)
        LEFT JOIN job_provider_match jpm ON jpm.provider_id = p.id
        WHERE p.id IN :providerIds
          AND (p.is_deleted IS NULL OR p.is_deleted = false)
        GROUP BY p.id
        """, nativeQuery = true)
    List<Object[]> getProviderStatistics(@Param("providerIds") List<Long> providerIds);
}
