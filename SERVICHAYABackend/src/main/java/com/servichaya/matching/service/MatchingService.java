package com.servichaya.matching.service;

import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.job.service.JobStateMachine;
import com.servichaya.matching.dto.JobSummaryDto;
import com.servichaya.matching.dto.MatchingResultDto;
import com.servichaya.matching.dto.ProviderMatchCandidateDto;
import com.servichaya.matching.dto.ProviderMatchDto;
import com.servichaya.matching.entity.JobProviderMatch;
import com.servichaya.matching.repository.JobProviderMatchRepository;
import com.servichaya.matching.repository.MatchingRuleMasterRepository;
import com.servichaya.payment.entity.ProviderPaymentPreference;
import com.servichaya.payment.service.PaymentService;
import com.servichaya.notification.service.NotificationService;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ProviderPodMapRepository;
import com.servichaya.provider.repository.ProviderSkillMapRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.common.service.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * MatchingService - Delegates to OptimizedMatchingService
 * This maintains backward compatibility while using the optimized implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {
    
    private final OptimizedMatchingService optimizedMatchingService;
    private final JobMasterRepository jobRepository;
    private final ServiceProviderProfileRepository providerRepository;
    private final ProviderSkillMapRepository providerSkillRepository;
    private final ProviderPodMapRepository providerPodRepository;
    private final MatchingRuleMasterRepository ruleRepository;
    private final JobProviderMatchRepository matchRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final ConfigService configService;
    private final JobStateMachine stateMachine;

    @Transactional
    public MatchingResultDto matchJobToProviders(Long jobId) {
        // Delegate to optimized service
        return optimizedMatchingService.matchJobToProviders(jobId);
    }

//        JobMaster job = jobRepository.findById(jobId)
//                .orElseThrow(() -> {
//                    log.error("Job not found with id: {}", jobId);
//                    return new RuntimeException("Job not found");
//                });
//
//        // Step 1: Get active matching rules
//        List<MatchingRuleMaster> rules = ruleRepository.findByIsActiveTrueOrderByPriorityOrderAsc();
//        if (rules.isEmpty()) {
//            log.warn("No active matching rules found. Using default rules.");
//            rules = getDefaultRules();
//        }
//
//        // Step 2: Apply hard filters and get eligible providers
//        List<ServiceProviderProfile> eligibleProviders = getEligibleProviders(job);
//        log.info("Found {} eligible providers for jobId: {}", eligibleProviders.size(), jobId);
//
//        if (eligibleProviders.isEmpty()) {
//            log.warn("No eligible providers found for jobId: {}", jobId);
//            return MatchingResultDto.builder()
//                    .jobId(jobId)
//                    .jobCode(job.getJobCode())
//                    .totalProvidersMatched(0)
//                    .providersNotified(0)
//                    .matches(new ArrayList<>())
//                    .build();
//        }
//
//        // Step 3: Calculate match scores for each provider
//        List<ProviderMatchDto> matches = new ArrayList<>();
//        int rank = 1;
//
//        for (ServiceProviderProfile provider : eligibleProviders) {
//            BigDecimal totalScore = calculateMatchScore(job, provider, rules);
//
//            if (totalScore.compareTo(BigDecimal.ZERO) > 0) {
//                // Save match record
//                JobProviderMatch match = JobProviderMatch.builder()
//                        .jobId(jobId)
//                        .providerId(provider.getId())
//                        .matchScore(totalScore)
//                        .status("PENDING")
//                        .rankOrder(rank++)
//                        .build();
//
//                match = matchRepository.save(match);
//                log.info("Created match for jobId: {}, providerId: {}, score: {}", jobId, provider.getId(), totalScore);
//
//                matches.add(ProviderMatchDto.builder()
//                        .matchId(match.getId())
//                        .jobId(jobId)
//                        .providerId(provider.getId())
//                        .matchScore(totalScore)
//                        .status("PENDING")
//                        .rankOrder(rank - 1)
//                        .build());
//            }
//        }
//
//        // Step 4: Sort by score descending
//        matches.sort((a, b) -> b.getMatchScore().compareTo(a.getMatchScore()));
//
//        // Step 5: Select top N providers (default: 5)
//        int topN = 5;
//        List<ProviderMatchDto> topMatches = matches.stream()
//                .limit(topN)
//                .collect(Collectors.toList());
//
//        // Step 6: Mark top matches as NOTIFIED
//        for (ProviderMatchDto match : topMatches) {
//            JobProviderMatch matchEntity = matchRepository.findById(match.getMatchId())
//                    .orElseThrow(() -> new RuntimeException("Match not found"));
//            matchEntity.setStatus("NOTIFIED");
//            matchEntity.setNotifiedAt(LocalDateTime.now());
//            matchRepository.save(matchEntity);
//            match.setStatus("NOTIFIED");
//            match.setNotifiedAt(LocalDateTime.now());
//        }
//
//        log.info("Matching completed for jobId: {}. Matched {} providers, notified {} providers",
//                jobId, matches.size(), topMatches.size());
//
//        // TODO: Send notifications to top providers (implement notification service)
//
//        return MatchingResultDto.builder()
//                .jobId(jobId)
//                .jobCode(job.getJobCode())
//                .totalProvidersMatched(matches.size())
//                .providersNotified(topMatches.size())
//                .matches(topMatches)
//                .build();
//    }

    private List<ServiceProviderProfile> getEligibleProviders(JobMaster job) {
        log.debug("Applying hard filters for jobId: {}", job.getId());

        List<ServiceProviderProfile> providers = providerRepository.findAll().stream()
                .filter(p -> p.getIsDeleted() == null || !p.getIsDeleted())
                .filter(p -> "ACTIVE".equals(p.getProfileStatus()))
                .filter(p -> p.getIsAvailable() != null && p.getIsAvailable())
//                .filter(p -> p.getRating() == null || p.getRating().compareTo(new BigDecimal("3.0")) >= 0)
                .collect(Collectors.toList());

        log.debug("After basic filters: {} providers", providers.size());

        // Filter by skill if specified
        if (job.getServiceSkillId() != null) {
            providers = providers.stream()
                    .filter(p -> providerSkillRepository.findByProviderIdAndSkillId(p.getId(), job.getServiceSkillId()).isPresent())
                    .collect(Collectors.toList());
            log.debug("After skill filter: {} providers", providers.size());
        }

        // Filter by service area (POD/Zone/City)
        if (job.getPodId() != null) {
            providers = providers.stream()
                    .filter(p -> providerPodRepository.findByProviderIdAndPodId(p.getId(), job.getPodId()).isPresent())
                    .collect(Collectors.toList());
            log.debug("After POD filter: {} providers", providers.size());
        } else if (job.getZoneId() != null) {
            providers = providers.stream()
                    .filter(p -> providerPodRepository.findByProviderIdAndZoneId(p.getId(), job.getZoneId()).isPresent())
                    .collect(Collectors.toList());
            log.debug("After Zone filter: {} providers", providers.size());
        } else if (job.getCityId() != null) {
            providers = providers.stream()
                    .filter(p -> providerPodRepository.findByProviderIdAndCityId(p.getId(), job.getCityId()).isPresent())
                    .collect(Collectors.toList());
            log.debug("After City filter: {} providers", providers.size());
        }

        return providers;
    }

//    private BigDecimal calculateMatchScore(JobMaster job, ServiceProviderProfile provider, List<MatchingRuleMaster> rules) {
//        BigDecimal totalScore = BigDecimal.ZERO;
//
//        for (MatchingRuleMaster rule : rules) {
//            BigDecimal factorScore = calculateFactorScore(job, provider, rule);
//            BigDecimal weight = rule.getWeightPercentage().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
//            BigDecimal weightedScore = factorScore.multiply(weight);
//            totalScore = totalScore.add(weightedScore);
//
//            log.debug("Rule: {}, Factor Score: {}, Weight: {}, Weighted: {}",
//                    rule.getRuleCode(), factorScore, weight, weightedScore);
//        }
//
//        // Apply bonus factors
//        totalScore = applyBonusFactors(job, provider, totalScore);
//
//        return totalScore.setScale(2, RoundingMode.HALF_UP);
//    }
//
//    private BigDecimal calculateFactorScore(JobMaster job, ServiceProviderProfile provider, MatchingRuleMaster rule) {
//        switch (rule.getRuleType()) {
//            case "SKILL_MATCH":
//                return calculateSkillMatchScore(job, provider);
//            case "DISTANCE":
//                return calculateDistanceScore(job, provider);
//            case "RATING":
//                return calculateRatingScore(provider);
//            case "SUBSCRIPTION_TIER":
//                return calculateSubscriptionScore(provider);
//            case "ACCEPTANCE_RATE":
//                return calculateAcceptanceRateScore(provider);
//            case "RESPONSE_TIME":
//                return calculateResponseTimeScore(provider);
//            case "JOB_HISTORY":
//                return calculateJobHistoryScore(job, provider);
//            default:
//                return BigDecimal.ZERO;
//        }
//    }

//    private BigDecimal calculateSkillMatchScore(JobMaster job, ServiceProviderProfile provider) {
//        if (job.getServiceSkillId() == null) {
//            return new BigDecimal("50"); // Partial match if no skill specified
//        }
//
//        boolean hasSkill = providerSkillRepository.findByProviderIdAndSkillId(provider.getId(), job.getServiceSkillId()).isPresent();
//        if (hasSkill) {
//            return new BigDecimal("100"); // Perfect match
//        }
//        return BigDecimal.ZERO; // No match
//    }
//
//    private BigDecimal calculateDistanceScore(JobMaster job, ServiceProviderProfile provider) {
//        // Check POD match
//        if (job.getPodId() != null) {
//            boolean podMatch = providerPodRepository.findByProviderIdAndPodId(provider.getId(), job.getPodId()).isPresent();
//            if (podMatch) return new BigDecimal("100");
//        }
//
//        // Check Zone match
//        if (job.getZoneId() != null) {
//            boolean zoneMatch = providerPodRepository.findByProviderIdAndZoneId(provider.getId(), job.getZoneId()).isPresent();
//            if (zoneMatch) return new BigDecimal("80");
//        }
//
//        // Check City match
//        if (job.getCityId() != null) {
//            boolean cityMatch = providerPodRepository.findByProviderIdAndCityId(provider.getId(), job.getCityId()).isPresent();
//            if (cityMatch) return new BigDecimal("60");
//        }
//
//        return BigDecimal.ZERO;
//    }
//
//    private BigDecimal calculateRatingScore(ServiceProviderProfile provider) {
//        if (provider.getRating() == null) {
//            return new BigDecimal("70"); // Default for new providers
//        }
//
//        BigDecimal rating = provider.getRating();
//        if (rating.compareTo(new BigDecimal("5.0")) >= 0) return new BigDecimal("100");
//        if (rating.compareTo(new BigDecimal("4.5")) >= 0) return new BigDecimal("90");
//        if (rating.compareTo(new BigDecimal("4.0")) >= 0) return new BigDecimal("80");
//        if (rating.compareTo(new BigDecimal("3.5")) >= 0) return new BigDecimal("70");
//        return new BigDecimal("60");
//    }
//
//    private BigDecimal calculateSubscriptionScore(ServiceProviderProfile provider) {
//        // TODO: Implement subscription tier logic when subscription system is added
//        // For now, return default score
//        return new BigDecimal("60");
//    }
//
//    private BigDecimal calculateAcceptanceRateScore(ServiceProviderProfile provider) {
//        // TODO: Calculate acceptance rate from job history
//        // For now, return default score
//        return new BigDecimal("80");
//    }
//
//    private BigDecimal calculateResponseTimeScore(ServiceProviderProfile provider) {
//        // TODO: Calculate average response time from match history
//        // For now, return default score
//        return new BigDecimal("80");
//    }
//
//    private BigDecimal calculateJobHistoryScore(JobMaster job, ServiceProviderProfile provider) {
//        // TODO: Check if provider has previous jobs with same customer
//        // For now, return default score
//        return BigDecimal.ZERO;
//    }
//
//    private BigDecimal applyBonusFactors(JobMaster job, ServiceProviderProfile provider, BigDecimal baseScore) {
//        BigDecimal bonus = BigDecimal.ZERO;
//
//        // Emergency service capability
//        if (job.getIsEmergency() != null && job.getIsEmergency()) {
//            // TODO: Check if provider has emergency service capability
//            bonus = bonus.add(new BigDecimal("10"));
//        }
//
//        // Verified badge
//        if ("ACTIVE".equals(provider.getProfileStatus())) {
//            bonus = bonus.add(new BigDecimal("5"));
//        }
//
//        return baseScore.add(bonus);
//    }
//
//    private List<MatchingRuleMaster> getDefaultRules() {
//        List<MatchingRuleMaster> rules = new ArrayList<>();
//
//        rules.add(createDefaultRule("SKILL_MATCH", "Skill Match", 30.0));
//        rules.add(createDefaultRule("DISTANCE", "Geographic Proximity", 25.0));
//        rules.add(createDefaultRule("RATING", "Provider Rating", 20.0));
//        rules.add(createDefaultRule("SUBSCRIPTION_TIER", "Subscription Tier", 10.0));
//        rules.add(createDefaultRule("ACCEPTANCE_RATE", "Acceptance Rate", 8.0));
//        rules.add(createDefaultRule("RESPONSE_TIME", "Response Time", 5.0));
//        rules.add(createDefaultRule("JOB_HISTORY", "Job History", 2.0));
//
//        return rules;
//    }

//    private MatchingRuleMaster createDefaultRule(String code, String name, Double weight) {
//        return MatchingRuleMaster.builder()
//                .ruleCode(code)
//                .ruleName(name)
//                .ruleType(code)
//                .weightPercentage(new BigDecimal(weight.toString()))
//                .isActive(true)
//                .priorityOrder(0)
//                .build();
//    }

    public List<ProviderMatchDto> getAvailableJobsForProvider(Long providerId) {
        log.info("Fetching available jobs for providerId: {}", providerId);
        
        List<JobProviderMatch> matches = matchRepository.findAvailableJobsForProvider(providerId);
        List<ProviderMatchDto> result = new ArrayList<>();
        
        for (JobProviderMatch match : matches) {
            JobMaster job = jobRepository.findById(match.getJobId())
                    .orElseThrow(() -> new RuntimeException("Job not found"));
            
            ProviderMatchDto dto = ProviderMatchDto.builder()
                    .matchId(match.getId())
                    .jobId(match.getJobId())
                    .providerId(match.getProviderId())
                    .matchScore(match.getMatchScore())
                    .status(match.getStatus())
                    .notifiedAt(match.getNotifiedAt())
                    .rankOrder(match.getRankOrder())
                    .job(JobSummaryDto.builder()
                            .id(job.getId())
                            .jobCode(job.getJobCode())
                            .title(job.getTitle())
                            .description(job.getDescription())
                            .preferredTime(job.getPreferredTime())
                            .isEmergency(job.getIsEmergency() != null ? job.getIsEmergency() : false)
                            .estimatedBudget(job.getEstimatedBudget())
                            .addressLine1(job.getAddressLine1())
                            .build())
                    .build();
            result.add(dto);
        }
        
        return result;
    }

    @Transactional
    public void acceptJob(Long matchId, Long userId) {
        log.info("User {} accepting job match {}", userId, matchId);
        
        // Convert userId to provider profile ID
        ServiceProviderProfile providerProfile = providerRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("Provider profile not found for userId: {}", userId);
                    return new RuntimeException("Provider profile not found");
                });
        Long providerProfileId = providerProfile.getId();
        
        JobProviderMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> {
                    log.error("Match not found with id: {}", matchId);
                    return new RuntimeException("Match not found");
                });

        // Compare with provider profile ID (match stores provider profile ID, not user_id)
        if (!match.getProviderId().equals(providerProfileId)) {
            log.error("Provider {} (profileId: {}) attempted to accept match {} belonging to provider {}", 
                    userId, providerProfileId, matchId, match.getProviderId());
            throw new RuntimeException("Unauthorized");
        }

        if (!"NOTIFIED".equals(match.getStatus()) && !"PENDING".equals(match.getStatus())) {
            log.error("Match {} is not in acceptable state. Current status: {}", matchId, match.getStatus());
            throw new RuntimeException("Match is not available for acceptance");
        }

        // Check if match has expired (timeout check using business rule)
        if (match.getNotifiedAt() != null) {
            Integer timeoutSeconds = configService.getProviderResponseTimeoutSeconds();
            long elapsedSeconds = java.time.Duration.between(match.getNotifiedAt(), LocalDateTime.now()).getSeconds();
            
            if (elapsedSeconds > timeoutSeconds) {
                log.warn("Match {} has expired. Elapsed: {}s, Timeout: {}s", matchId, elapsedSeconds, timeoutSeconds);
                match.setStatus("EXPIRED");
                matchRepository.save(match);
                throw new RuntimeException("Match has expired. Please accept jobs within " + timeoutSeconds + " seconds of notification.");
            }
        }

        // Update match status
        match.setStatus("ACCEPTED");
        match.setRespondedAt(LocalDateTime.now());
        if (match.getNotifiedAt() != null) {
            long seconds = java.time.Duration.between(match.getNotifiedAt(), LocalDateTime.now()).getSeconds();
            match.setResponseTimeSeconds(seconds);
        }
        matchRepository.save(match);

        // Update job status - store provider profile ID (not user_id)
        JobMaster job = jobRepository.findById(match.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found"));
        job.setProviderId(providerProfileId); // Store provider profile ID, not user_id
        job.setAcceptedAt(LocalDateTime.now());

        // Business Logic: Create payment schedule based on provider preference
        ProviderPaymentPreference preference = null;
        String nextStatus = "ACCEPTED"; // Default to ACCEPTED (for POST_WORK payment)
        
        try {
            preference = paymentService.getProviderPaymentPreference(providerProfileId, job.getServiceCategoryId());
            
            if (preference != null && job.getEstimatedBudget() != null) {
                BigDecimal totalAmount = job.getEstimatedBudget();
                paymentService.createPaymentSchedule(
                        job.getId(), 
                        preference.getPaymentType(),
                        totalAmount,
                        preference.getHourlyRate(),
                        null,
                        preference.getPartialPaymentPercentage()
                );
                log.info("Payment schedule created for job {}", job.getId());
                
                // If payment type is PARTIAL or FULL, move job to PENDING_FOR_PAYMENT
                if ("PARTIAL".equals(preference.getPaymentType()) || "FULL".equals(preference.getPaymentType())) {
                    nextStatus = "PENDING_FOR_PAYMENT";
                    log.info("Job {} requires upfront payment. Moving to PENDING_FOR_PAYMENT status", job.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Could not create payment schedule: {}", e.getMessage());
        }
        
        // Update job status using state machine validation
        try {
            stateMachine.validateTransition(job.getStatus(), nextStatus);
            job.setStatus(nextStatus);
            jobRepository.save(job);
            log.info("Job {} status updated to {}", job.getId(), nextStatus);
        } catch (Exception e) {
            log.error("Failed to update job status: {}", e.getMessage());
            throw new RuntimeException("Failed to update job status: " + e.getMessage());
        }

        // Business Logic: Send notifications
        try {
            // Build notification message based on payment preference
            String notificationMessage;
            String notificationTitle = "Provider Assigned";
            
            if (preference != null && preference.getPaymentType().equals("PARTIAL") && 
                preference.getPartialPaymentPercentage() != null) {
                notificationMessage = String.format(
                    "A provider has accepted your job: %s. Please pay ₹%.2f (%.0f%% upfront) to proceed.",
                    job.getTitle(),
                    job.getEstimatedBudget() != null ? 
                        job.getEstimatedBudget().multiply(preference.getPartialPaymentPercentage())
                            .divide(new BigDecimal(100), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO,
                    preference.getPartialPaymentPercentage()
                );
                notificationTitle = "Payment Required - Upfront Payment";
            } else if (preference != null && preference.getPaymentType().equals("FULL")) {
                notificationMessage = String.format(
                    "A provider has accepted your job: %s. Please pay ₹%.2f (full amount) to proceed.",
                    job.getTitle(),
                    job.getEstimatedBudget() != null ? job.getEstimatedBudget() : BigDecimal.ZERO
                );
                notificationTitle = "Payment Required - Full Payment";
            } else {
                notificationMessage = String.format("A provider has accepted your job: %s", job.getTitle());
            }
            
            // Notify customer
            notificationService.createNotification(
                    job.getCustomerId(), "CUSTOMER", "JOB_ACCEPTED",
                    notificationTitle,
                    notificationMessage,
                    "JOB", job.getId(),
                    String.format("/customer/jobs/%d", job.getId()),
                    Map.of("jobCode", job.getJobCode()));
            
            log.info("Notifications sent for job acceptance");
        } catch (Exception e) {
            log.warn("Could not send notifications: {}", e.getMessage());
        }

        // Reject other matches for this job
        List<JobProviderMatch> otherMatches = matchRepository.findByJobIdOrderByMatchScoreDesc(match.getJobId())
                .stream()
                .filter(m -> !m.getId().equals(matchId))
                .filter(m -> "PENDING".equals(m.getStatus()) || "NOTIFIED".equals(m.getStatus()))
                .collect(Collectors.toList());

        for (JobProviderMatch otherMatch : otherMatches) {
            otherMatch.setStatus("REJECTED");
            matchRepository.save(otherMatch);
        }

        log.info("Job {} accepted by provider {}. Rejected {} other matches", 
                match.getJobId(), userId, otherMatches.size());
    }

    /**
     * Manual job assignment by admin
     * Creates entry in job_provider_match table
     */
    @Transactional
    public void manualAssignJob(Long jobId, Long providerId, BigDecimal matchScore, Integer rankOrder) {
        log.info("Admin manually assigning jobId: {} to providerId: {}, matchScore: {}, rankOrder: {}", 
                jobId, providerId, matchScore, rankOrder);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        // Check if assignment already exists
        Optional<JobProviderMatch> existingMatch = matchRepository.findByJobIdAndProviderId(jobId, providerId);
        if (existingMatch.isPresent()) {
            log.warn("Assignment already exists for jobId: {} and providerId: {}", jobId, providerId);
            throw new RuntimeException("Job is already assigned to this provider");
        }

        // Use provided matchScore or default to 100 (perfect match for manual assignment)
        BigDecimal finalMatchScore = matchScore != null ? matchScore : new BigDecimal("100.00");
        
        // Use provided rankOrder or set to 1 (highest priority for manual assignment)
        Integer finalRankOrder = rankOrder != null ? rankOrder : 1;

        JobProviderMatch match = JobProviderMatch.builder()
                .jobId(jobId)
                .providerId(providerId)
                .matchScore(finalMatchScore)
                .status("NOTIFIED") // Directly notify provider
                .notifiedAt(LocalDateTime.now())
                .rankOrder(finalRankOrder)
                .build();

        matchRepository.save(match);
        log.info("Job {} manually assigned to provider {} with matchScore: {}", jobId, providerId, finalMatchScore);

        // Notify provider
        try {
            notificationService.createNotification(
                    providerId, "PROVIDER", "JOB_ASSIGNED",
                    "New Job Assigned",
                    String.format("Admin has assigned you a new job: %s", job.getTitle()),
                    "JOB", jobId,
                    String.format("/provider/jobs/%d", jobId),
                    Map.of("jobCode", job.getJobCode(), "matchScore", finalMatchScore.toString()));
        } catch (Exception e) {
            log.warn("Could not send notification: {}", e.getMessage());
        }
    }

    /**
     * Get all assigned providers for a job (from job_provider_match table)
     */
    public List<ProviderMatchDto> getJobAssignments(Long jobId) {
        log.info("Fetching assigned providers for jobId: {}", jobId);

        List<JobProviderMatch> matches = matchRepository.findByJobIdOrderByMatchScoreDesc(jobId);
        List<ProviderMatchDto> result = new ArrayList<>();
        
        for (JobProviderMatch match : matches) {
            JobMaster job = jobRepository.findById(match.getJobId())
                    .orElse(null); // Job might not exist, but we'll continue
            
            ProviderMatchDto dto = ProviderMatchDto.builder()
                    .matchId(match.getId())
                    .jobId(match.getJobId())
                    .providerId(match.getProviderId())
                    .matchScore(match.getMatchScore())
                    .status(match.getStatus())
                    .notifiedAt(match.getNotifiedAt())
                    .respondedAt(match.getRespondedAt())
                    .rankOrder(match.getRankOrder())
                    .job(job != null ? JobSummaryDto.builder()
                            .id(job.getId())
                            .jobCode(job.getJobCode())
                            .title(job.getTitle())
                            .description(job.getDescription())
                            .preferredTime(job.getPreferredTime())
                            .isEmergency(job.getIsEmergency() != null ? job.getIsEmergency() : false)
                            .estimatedBudget(job.getEstimatedBudget())
                            .addressLine1(job.getAddressLine1())
                            .build() : null)
                    .build();
            result.add(dto);
        }
        
        return result;
    }

    /**
     * Get available providers for a job (for admin selection)
     */
    public List<ProviderMatchDto> getAvailableProvidersForJob(Long jobId) {
        log.info("Fetching available providers for jobId: {}", jobId);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        // Get eligible providers using optimized matching (public method that takes jobId)
        List<ProviderMatchCandidateDto> candidates = optimizedMatchingService.findEligibleProviders(jobId);
        
        // Convert to ProviderMatchDto
        // Note: matchScore and rankOrder are not in ProviderMatchCandidateDto, 
        // they are calculated during scoring. For admin selection, we'll use default values.
        List<ProviderMatchDto> result = new ArrayList<>();
        int rank = 1;
        for (ProviderMatchCandidateDto candidate : candidates) {
            // Calculate a simple match score based on available data
            BigDecimal matchScore = calculateSimpleMatchScore(candidate);
            
            ProviderMatchDto matchDto = ProviderMatchDto.builder()
                    .matchId(null) // Not yet created
                    .jobId(jobId)
                    .providerId(candidate.getProviderId())
                    .matchScore(matchScore)
                    .status("PENDING")
                    .rankOrder(rank++)
                    .job(JobSummaryDto.builder()
                            .id(job.getId())
                            .jobCode(job.getJobCode())
                            .title(job.getTitle())
                            .description(job.getDescription())
                            .preferredTime(job.getPreferredTime())
                            .isEmergency(job.getIsEmergency() != null ? job.getIsEmergency() : false)
                            .estimatedBudget(job.getEstimatedBudget())
                            .addressLine1(job.getAddressLine1())
                            .build())
                    .build();
            result.add(matchDto);
        }
        
        return result;
    }

    /**
     * Calculate a simple match score for admin display
     * This is a simplified version - full scoring happens during actual matching
     */
    private BigDecimal calculateSimpleMatchScore(ProviderMatchCandidateDto candidate) {
        BigDecimal score = new BigDecimal("50.00"); // Base score
        
        // Add points for location match (priority: POD > Zone > City)
        if (candidate.getHasPodMatch() != null && candidate.getHasPodMatch() == 1) {
            score = score.add(new BigDecimal("30.00"));
        } else if (candidate.getHasZoneMatch() != null && candidate.getHasZoneMatch() == 1) {
            score = score.add(new BigDecimal("20.00"));
        } else if (candidate.getHasCityMatch() != null && candidate.getHasCityMatch() == 1) {
            score = score.add(new BigDecimal("10.00"));
        }
        
        // Add points for skill match
        if (candidate.getHasSkillMatch() != null && candidate.getHasSkillMatch() == 1) {
            score = score.add(new BigDecimal("10.00"));
        }
        
        // Add points for rating
        if (candidate.getRating() != null && candidate.getRating().compareTo(BigDecimal.ZERO) > 0) {
            score = score.add(candidate.getRating().multiply(new BigDecimal("2")));
        }
        
        // Cap at 100
        if (score.compareTo(new BigDecimal("100.00")) > 0) {
            score = new BigDecimal("100.00");
        }
        
        return score;
    }

    /**
     * Remove a job assignment
     */
    @Transactional
    public void removeJobAssignment(Long matchId) {
        log.info("Removing job assignment matchId: {}", matchId);

        JobProviderMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> {
                    log.error("Match not found with id: {}", matchId);
                    return new RuntimeException("Match not found");
                });

        // Only allow removal if not already accepted
        if ("ACCEPTED".equals(match.getStatus())) {
            throw new RuntimeException("Cannot remove an accepted assignment");
        }

        matchRepository.delete(match);
        log.info("Job assignment removed: matchId: {}", matchId);
    }
}
