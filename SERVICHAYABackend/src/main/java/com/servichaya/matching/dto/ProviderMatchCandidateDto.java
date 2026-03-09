package com.servichaya.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for provider match candidates from optimized SQL query
 * Contains all data needed for scoring without additional queries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderMatchCandidateDto {
    private Long providerId;
    private String providerCode;
    private Long userId;
    private BigDecimal rating;
    private String profileStatus;
    private Boolean isAvailable;
    private Boolean isOnline;
    private Integer totalJobsCompleted;
    private Integer avgResponseTimeMinutes;
    
    // Location matching flags (from JOINs)
    private Integer hasPodMatch;
    private Integer hasZoneMatch;
    private Integer hasCityMatch;
    
    // Skill matching flag
    private Integer hasSkillMatch;
    
    // Distance in kilometers (NULL for now, can be calculated later if needed)
    private BigDecimal distanceKm;
    
    // Statistics (populated separately from job history)
    private Long completedJobs; // From job_master where status = 'COMPLETED'
    private Long acceptedJobs; // From job_master where status = 'ACCEPTED'
    private BigDecimal avgResponseTimeSeconds; // From job_provider_match
    private Long acceptedMatches; // From job_provider_match where status = 'ACCEPTED'
    private Long totalMatches; // From job_provider_match
}
