package com.servichaya.matching.service;

import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.matching.dto.MatchingResultDto;
import com.servichaya.matching.dto.ProviderMatchCandidateDto;
import com.servichaya.matching.dto.ProviderMatchDto;
import com.servichaya.matching.entity.JobProviderMatch;
import com.servichaya.matching.entity.MatchingRuleMaster;
import com.servichaya.matching.repository.JobProviderMatchRepository;
import com.servichaya.matching.repository.MatchingRepository;
import com.servichaya.matching.repository.MatchingRuleMasterRepository;
import com.servichaya.matching.repository.ProviderMatchCandidateProjection;
import com.servichaya.common.service.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Optimized Matching Service
 * 
 * Performance improvements:
 * 1. Single SQL query with JOINs instead of N+1 queries
 * 2. Database-level filtering instead of Java streams
 * 3. Batch operations for scoring and saving
 * 4. Caching for matching rules
 * 5. Parallel processing where safe
 * 6. Two-phase matching: Hard filters (SQL) + Scoring (optimized)
 * 
 * Algorithm inspired by:
 * - Uber's driver matching (distance + rating + availability)
 * - DoorDash's merchant matching (location + rating + capacity)
 * - Elasticsearch function_score (weighted scoring)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OptimizedMatchingService {

    private final JobMasterRepository jobRepository;
    private final MatchingRepository matchingRepository;
    private final com.servichaya.provider.repository.ProviderCustomerLinkRepository providerCustomerLinkRepository;
    private final MatchingRuleMasterRepository ruleRepository;
    private final JobProviderMatchRepository matchRepository;
    private final ConfigService configService;
    private final com.servichaya.notification.service.NotificationService notificationService;
    private final com.servichaya.job.service.JobStateMachine stateMachine;
    private final com.servichaya.provider.repository.ServiceProviderProfileRepository providerRepository;

    private static final int DEFAULT_TOP_N = 5;
    private static final int MAX_CANDIDATES = 100; // Limit candidates for scoring

    /**
     * Public method to get eligible providers for a job (for admin selection)
     */
    public List<ProviderMatchCandidateDto> findEligibleProviders(Long jobId) {
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        BigDecimal minRating = configService.getMinRatingForProvider();
        return findEligibleProviders(job, minRating);
    }

    @Transactional
    public MatchingResultDto matchJobToProviders(Long jobId) {
        long startTime = System.currentTimeMillis();
        log.info("Starting optimized matching process for jobId: {}", jobId);

        // Step 1: Load job (single query)
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        // Step 2: Get matching rules (cached)
        List<MatchingRuleMaster> rules = getMatchingRules();
        if (rules.isEmpty()) {
            log.warn("No active matching rules found. Using default rules.");
            rules = getDefaultRules();
        }

        // Step 3: Get minimum rating from business rule
        BigDecimal minRating = configService.getMinRatingForProvider();
        
        // Step 4: Find eligible providers using optimized SQL query
        List<ProviderMatchCandidateDto> candidates = findEligibleProviders(job, minRating);
        log.info("Found {} eligible providers for jobId: {} (min rating: {})", candidates.size(), jobId, minRating);

        if (candidates.isEmpty()) {
            log.warn("No eligible providers found for jobId: {}", jobId);
            
            // Update job status back to PENDING if no providers found
            try {
                if ("MATCHING".equals(job.getStatus())) {
                    stateMachine.validateTransition("MATCHING", "PENDING");
                    job.setStatus("PENDING");
                    jobRepository.save(job);
                }
            } catch (Exception e) {
                log.error("Failed to update job status when no providers found", e);
            }
            
            // Notify customer that no providers found
            try {
                notificationService.createNotification(
                        job.getCustomerId(), "CUSTOMER", "JOB_NO_PROVIDERS_FOUND",
                        "Finding Providers",
                        String.format("We couldn't find available providers for '%s' in your area. Our team will review and assign manually.", job.getTitle()),
                        "JOB", jobId,
                        String.format("/customer/jobs/%d", jobId),
                        Map.of("jobCode", job.getJobCode())
                );
            } catch (Exception e) {
                log.error("Failed to send no providers notification", e);
            }
            
            return MatchingResultDto.builder()
                    .jobId(jobId)
                    .jobCode(job.getJobCode())
                    .totalProvidersMatched(0)
                    .providersNotified(0)
                    .matches(new ArrayList<>())
                    .build();
        }

        // Step 4: Batch load provider statistics (single query)
        enrichCandidatesWithStatistics(candidates);

        // Step 5: Calculate scores in batch (parallel processing)
        List<ProviderMatchDto> matches = calculateScoresBatch(job, candidates, rules);

        // Step 5b: Boost matches for referred / primary providers, if any
        try {
            List<com.servichaya.provider.entity.ProviderCustomerLink> primaryLinks =
                    providerCustomerLinkRepository.findByCustomerIdAndCategoryIdAndIsPrimaryTrue(
                            job.getCustomerId(), job.getServiceSkillId());

            if (!primaryLinks.isEmpty()) {
                Long preferredProviderId = primaryLinks.get(0).getProviderId();
                log.info("Found primary provider {} for customer {} and serviceSkillId {}. Applying priority boost.",
                        preferredProviderId, job.getCustomerId(), job.getServiceSkillId());

                for (ProviderMatchDto match : matches) {
                    if (match.getProviderId().equals(preferredProviderId)) {
                        // Small boost to ensure preferred provider floats to top if otherwise eligible
                        match.setMatchScore(match.getMatchScore().add(new BigDecimal("5.0")));
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Error applying referral-based priority in matching for jobId: {}", jobId, ex);
        }

        // Step 6: Filter by minimum match score (from business rule)
        BigDecimal minMatchScore = configService.getMinMatchScore();
        matches = matches.stream()
                .filter(match -> match.getMatchScore().compareTo(minMatchScore) >= 0)
                .collect(Collectors.toList());
        log.info("After minimum match score filter (min: {}): {} providers", minMatchScore, matches.size());

        // Step 7: Sort by score (already sorted by SQL, but re-sort for final ranking)
        matches.sort((a, b) -> b.getMatchScore().compareTo(a.getMatchScore()));

        // Step 7: Select top N providers (from configuration)
        int topN = configService.getMaxProvidersToNotify();
        if (topN <= 0) {
            topN = DEFAULT_TOP_N; // Fallback to default
        }
        List<ProviderMatchDto> topMatches = matches.stream()
                .limit(topN)
                .collect(Collectors.toList());

        // Step 8: Batch save matches (bulk insert)
        saveMatchesBatch(jobId, matches, topMatches);

        // Step 9: Update job status to MATCHED
        try {
            if ("MATCHING".equals(job.getStatus()) || "PENDING".equals(job.getStatus())) {
                stateMachine.validateTransition(job.getStatus(), "MATCHED");
                job.setStatus("MATCHED");
                jobRepository.save(job);
                log.info("Job {} status updated to MATCHED", jobId);
            }
        } catch (Exception e) {
            log.error("Failed to update job status to MATCHED", e);
        }

        // Step 10: Send notifications to providers
        sendProviderNotifications(job, topMatches);

        // Step 11: Notify customer about matching results
        try {
            notificationService.createNotification(
                    job.getCustomerId(), "CUSTOMER", "JOB_MATCHED",
                    "Providers Found",
                    String.format("We found %d provider(s) for '%s'. They will respond shortly.", topMatches.size(), job.getTitle()),
                    "JOB", jobId,
                    String.format("/customer/jobs/%d", jobId),
                    Map.of("jobCode", job.getJobCode(), "providersMatched", topMatches.size())
            );
        } catch (Exception e) {
            log.error("Failed to send customer matching notification", e);
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("Matching completed for jobId: {} in {}ms. Matched {} providers, notified {} providers", 
                jobId, duration, matches.size(), topMatches.size());

        return MatchingResultDto.builder()
                .jobId(jobId)
                .jobCode(job.getJobCode())
                .totalProvidersMatched(matches.size())
                .providersNotified(topMatches.size())
                .matches(topMatches)
                .build();
    }

    /**
     * Send notifications to matched providers
     */
    private void sendProviderNotifications(JobMaster job, List<ProviderMatchDto> topMatches) {
        for (ProviderMatchDto match : topMatches) {
            try {
                // Get provider user ID
                com.servichaya.provider.entity.ServiceProviderProfile provider = providerRepository.findById(match.getProviderId())
                        .orElse(null);
                
                if (provider != null && provider.getUserId() != null) {
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("jobCode", job.getJobCode());
                    metadata.put("jobId", job.getId());
                    if (match.getMatchId() != null) {
                        metadata.put("matchId", match.getMatchId());
                    }
                    if (match.getMatchScore() != null) {
                        metadata.put("matchScore", match.getMatchScore());
                    }
                    metadata.put("estimatedBudget", job.getEstimatedBudget() != null ? job.getEstimatedBudget() : BigDecimal.ZERO);
                    metadata.put("isEmergency", job.getIsEmergency() != null ? job.getIsEmergency() : false);

                    notificationService.createNotification(
                            provider.getUserId(), "PROVIDER", "JOB_MATCHED",
                            "New Job Available",
                            String.format("New job '%s' matches your profile. Match score: %.0f%%. Respond within 2 minutes!",
                                    job.getTitle(), match.getMatchScore()),
                            "JOB", job.getId(),
                            String.format("/provider/jobs/available"),
                            metadata
                    );
                    log.info("Notification sent to provider {} for job {}", match.getProviderId(), job.getId());
                }
            } catch (Exception e) {
                log.error("Failed to send notification to provider {} for job {}", match.getProviderId(), job.getId(), e);
                // Continue with other providers even if one fails
            }
        }
    }

    /**
     * Get matching rules with caching
     */
    @Cacheable(value = "matchingRules", unless = "#result.isEmpty()")
    private List<MatchingRuleMaster> getMatchingRules() {
        return ruleRepository.findByIsActiveTrueOrderByPriorityOrderAsc();
    }

    /**
     * Find eligible providers using optimized SQL query
     * Single query with JOINs replaces multiple findAll() + stream filters
     */
    private List<ProviderMatchCandidateDto> findEligibleProviders(JobMaster job, BigDecimal minRating) {
        List<ProviderMatchCandidateProjection> projections = matchingRepository.findEligibleProvidersOptimized(
                job.getId(),
                job.getPodId(),
                job.getZoneId(),
                job.getCityId(),
                job.getServiceSkillId(),
                minRating,
                MAX_CANDIDATES
        );
        
        // Convert projections to DTOs
        return projections.stream()
                .map(p -> ProviderMatchCandidateDto.builder()
                        .providerId(p.getProviderId())
                        .providerCode(p.getProviderCode())
                        .userId(p.getUserId())
                        .rating(p.getRating())
                        .profileStatus(p.getProfileStatus())
                        .isAvailable(p.getIsAvailable())
                        .isOnline(p.getIsOnline())
                        .totalJobsCompleted(p.getTotalJobsCompleted())
                        .avgResponseTimeMinutes(p.getAvgResponseTimeMinutes())
                        .hasPodMatch(p.getHasPodMatch())
                        .hasZoneMatch(p.getHasZoneMatch())
                        .hasCityMatch(p.getHasCityMatch())
                        .hasSkillMatch(p.getHasSkillMatch())
                        .distanceKm(p.getDistanceKm())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Enrich candidates with provider statistics in batch
     * Single query instead of N queries
     */
    private void enrichCandidatesWithStatistics(List<ProviderMatchCandidateDto> candidates) {
        List<Long> providerIds = candidates.stream()
                .map(ProviderMatchCandidateDto::getProviderId)
                .collect(Collectors.toList());

        List<Object[]> stats = matchingRepository.getProviderStatistics(providerIds);
        
        // Create a map for O(1) lookup
        Map<Long, Object[]> statsMap = new HashMap<>();
        for (Object[] stat : stats) {
            Long providerId = ((Number) stat[0]).longValue();
            statsMap.put(providerId, stat);
        }

        // Enrich candidates with statistics
        // Note: totalJobsCompleted is already populated from the main query
        for (ProviderMatchCandidateDto candidate : candidates) {
            Object[] stat = statsMap.get(candidate.getProviderId());
            if (stat != null) {
                // stat[0] = providerId (already have)
                // stat[1] = completedJobs
                // stat[2] = acceptedJobs
                // stat[3] = avgResponseTimeSeconds
                // stat[4] = acceptedMatches
                // stat[5] = totalMatches
                candidate.setCompletedJobs(((Number) stat[1]).longValue());
                candidate.setAcceptedJobs(((Number) stat[2]).longValue());
                candidate.setAvgResponseTimeSeconds(stat[3] != null ? 
                    new BigDecimal(stat[3].toString()) : null);
                candidate.setAcceptedMatches(((Number) stat[4]).longValue());
                candidate.setTotalMatches(((Number) stat[5]).longValue());
            }
        }
    }

    /**
     * Calculate scores in batch with parallel processing
     */
    private List<ProviderMatchDto> calculateScoresBatch(
            JobMaster job, 
            List<ProviderMatchCandidateDto> candidates, 
            List<MatchingRuleMaster> rules) {
        
        return candidates.parallelStream()
                .map(candidate -> {
                    BigDecimal score = calculateMatchScore(job, candidate, rules);
                    return ProviderMatchDto.builder()
                            .providerId(candidate.getProviderId())
                            .matchScore(score)
                            .status("PENDING")
                            .build();
                })
                .filter(match -> match.getMatchScore().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());
    }

    /**
     * Optimized score calculation using pre-fetched data
     */
    private BigDecimal calculateMatchScore(
            JobMaster job, 
            ProviderMatchCandidateDto candidate, 
            List<MatchingRuleMaster> rules) {
        
        BigDecimal totalScore = BigDecimal.ZERO;

        for (MatchingRuleMaster rule : rules) {
            BigDecimal factorScore = calculateFactorScore(job, candidate, rule);
            BigDecimal weight = rule.getWeightPercentage()
                    .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            BigDecimal weightedScore = factorScore.multiply(weight);
            totalScore = totalScore.add(weightedScore);
        }

        // Apply bonus factors
        totalScore = applyBonusFactors(job, candidate, totalScore);

        return totalScore.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate factor score using pre-fetched data (no additional queries)
     */
    private BigDecimal calculateFactorScore(
            JobMaster job, 
            ProviderMatchCandidateDto candidate, 
            MatchingRuleMaster rule) {
        
        switch (rule.getRuleType()) {
            case "SKILL_MATCH":
                return calculateSkillMatchScore(candidate);
            case "DISTANCE":
                return calculateDistanceScore(candidate);
            case "RATING":
                return calculateRatingScore(candidate);
            case "SUBSCRIPTION_TIER":
                return calculateSubscriptionScore(candidate);
            case "ACCEPTANCE_RATE":
                return calculateAcceptanceRateScore(candidate);
            case "RESPONSE_TIME":
                return calculateResponseTimeScore(candidate);
            case "JOB_HISTORY":
                return calculateJobHistoryScore(candidate);
            default:
                return BigDecimal.ZERO;
        }
    }

    private BigDecimal calculateSkillMatchScore(ProviderMatchCandidateDto candidate) {
        if (candidate.getHasSkillMatch() != null && candidate.getHasSkillMatch() == 1) {
            return new BigDecimal("100");
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateDistanceScore(ProviderMatchCandidateDto candidate) {
        // POD match = 100, Zone = 80, City = 60
        if (candidate.getHasPodMatch() != null && candidate.getHasPodMatch() == 1) {
            return new BigDecimal("100");
        }
        if (candidate.getHasZoneMatch() != null && candidate.getHasZoneMatch() == 1) {
            return new BigDecimal("80");
        }
        if (candidate.getHasCityMatch() != null && candidate.getHasCityMatch() == 1) {
            return new BigDecimal("60");
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateRatingScore(ProviderMatchCandidateDto candidate) {
        if (candidate.getRating() == null) {
            return new BigDecimal("70");
        }
        BigDecimal rating = candidate.getRating();
        if (rating.compareTo(new BigDecimal("5.0")) >= 0) return new BigDecimal("100");
        if (rating.compareTo(new BigDecimal("4.5")) >= 0) return new BigDecimal("90");
        if (rating.compareTo(new BigDecimal("4.0")) >= 0) return new BigDecimal("80");
        if (rating.compareTo(new BigDecimal("3.5")) >= 0) return new BigDecimal("70");
        return new BigDecimal("60");
    }

    private BigDecimal calculateSubscriptionScore(ProviderMatchCandidateDto candidate) {
        // Subscription tier not available in current schema
        // Use is_online as a proxy for premium/active providers
        if (candidate.getIsOnline() != null && candidate.getIsOnline()) {
            return new BigDecimal("80"); // Online providers get higher score
        }
        return new BigDecimal("60"); // Default score
    }

    private BigDecimal calculateAcceptanceRateScore(ProviderMatchCandidateDto candidate) {
        if (candidate.getTotalMatches() == null || candidate.getTotalMatches() == 0) {
            return new BigDecimal("80"); // Default for new providers
        }
        if (candidate.getAcceptedMatches() == null) {
            return new BigDecimal("80");
        }
        
        BigDecimal acceptanceRate = new BigDecimal(candidate.getAcceptedMatches())
                .divide(new BigDecimal(candidate.getTotalMatches()), 2, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
        
        if (acceptanceRate.compareTo(new BigDecimal("90")) >= 0) return new BigDecimal("100");
        if (acceptanceRate.compareTo(new BigDecimal("75")) >= 0) return new BigDecimal("90");
        if (acceptanceRate.compareTo(new BigDecimal("60")) >= 0) return new BigDecimal("80");
        if (acceptanceRate.compareTo(new BigDecimal("50")) >= 0) return new BigDecimal("70");
        return new BigDecimal("60");
    }

    private BigDecimal calculateResponseTimeScore(ProviderMatchCandidateDto candidate) {
        if (candidate.getAvgResponseTimeMinutes() == null) {
            return new BigDecimal("80");
        }
        
        Integer avgMinutes = candidate.getAvgResponseTimeMinutes();
        // Under 5 minutes = 100, 5-10 = 90, 10-15 = 80, 15-30 = 70, >30 = 60
        if (avgMinutes <= 5) return new BigDecimal("100");
        if (avgMinutes <= 10) return new BigDecimal("90");
        if (avgMinutes <= 15) return new BigDecimal("80");
        if (avgMinutes <= 30) return new BigDecimal("70");
        return new BigDecimal("60");
    }

    private BigDecimal calculateJobHistoryScore(ProviderMatchCandidateDto candidate) {
        if (candidate.getTotalJobsCompleted() == null || candidate.getTotalJobsCompleted() == 0) {
            return BigDecimal.ZERO;
        }
        // More completed jobs = higher score (capped at 100)
        int completed = candidate.getTotalJobsCompleted();
        if (completed >= 100) return new BigDecimal("100");
        if (completed >= 50) return new BigDecimal("90");
        if (completed >= 20) return new BigDecimal("80");
        if (completed >= 10) return new BigDecimal("70");
        if (completed >= 5) return new BigDecimal("60");
        return new BigDecimal("50");
    }

    private BigDecimal applyBonusFactors(JobMaster job, ProviderMatchCandidateDto candidate, BigDecimal baseScore) {
        BigDecimal bonus = BigDecimal.ZERO;

        // Emergency service capability
        if (job.getIsEmergency() != null && job.getIsEmergency()) {
            bonus = bonus.add(new BigDecimal("10"));
        }

        // Verified badge
        if ("ACTIVE".equals(candidate.getProfileStatus())) {
            bonus = bonus.add(new BigDecimal("5"));
        }

        return baseScore.add(bonus);
    }

    /**
     * Batch save matches (bulk insert)
     */
    private void saveMatchesBatch(Long jobId, List<ProviderMatchDto> matches, List<ProviderMatchDto> topMatches) {
        int rank = 1;
        List<JobProviderMatch> matchEntities = new ArrayList<>();
        
        for (ProviderMatchDto match : matches) {
            JobProviderMatch matchEntity = JobProviderMatch.builder()
                    .jobId(jobId)
                    .providerId(match.getProviderId())
                    .matchScore(match.getMatchScore())
                    .status("PENDING")
                    .rankOrder(rank++)
                    .build();
            matchEntities.add(matchEntity);
        }
        
        // Bulk save
        matchRepository.saveAll(matchEntities);
        
        // Update top matches to NOTIFIED
        Set<Long> topProviderIds = topMatches.stream()
                .map(ProviderMatchDto::getProviderId)
                .collect(Collectors.toSet());
        
        matchEntities.stream()
                .filter(m -> topProviderIds.contains(m.getProviderId()))
                .forEach(m -> {
                    m.setStatus("NOTIFIED");
                    m.setNotifiedAt(LocalDateTime.now());
                });
        
        matchRepository.saveAll(matchEntities);
        
        // Update DTOs
        for (ProviderMatchDto match : topMatches) {
            match.setStatus("NOTIFIED");
            match.setNotifiedAt(LocalDateTime.now());
        }
    }

    private List<MatchingRuleMaster> getDefaultRules() {
        List<MatchingRuleMaster> rules = new ArrayList<>();
        rules.add(createDefaultRule("SKILL_MATCH", "Skill Match", 30.0));
        rules.add(createDefaultRule("DISTANCE", "Geographic Proximity", 25.0));
        rules.add(createDefaultRule("RATING", "Provider Rating", 20.0));
        rules.add(createDefaultRule("SUBSCRIPTION_TIER", "Subscription Tier", 10.0));
        rules.add(createDefaultRule("ACCEPTANCE_RATE", "Acceptance Rate", 8.0));
        rules.add(createDefaultRule("RESPONSE_TIME", "Response Time", 5.0));
        rules.add(createDefaultRule("JOB_HISTORY", "Job History", 2.0));
        return rules;
    }

    private MatchingRuleMaster createDefaultRule(String code, String name, Double weight) {
        return MatchingRuleMaster.builder()
                .ruleCode(code)
                .ruleName(name)
                .ruleType(code)
                .weightPercentage(new BigDecimal(weight.toString()))
                .isActive(true)
                .priorityOrder(0)
                .build();
    }
}
