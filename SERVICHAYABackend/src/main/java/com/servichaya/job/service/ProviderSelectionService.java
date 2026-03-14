package com.servichaya.job.service;

import com.servichaya.job.dto.ProviderSelectionDto;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.entity.ProviderJobBid;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.job.repository.ProviderJobBidRepository;
import com.servichaya.matching.dto.ProviderMatchCandidateDto;
import com.servichaya.matching.service.OptimizedMatchingService;
import com.servichaya.matching.entity.JobProviderMatch;
import com.servichaya.matching.repository.JobProviderMatchRepository;
import com.servichaya.payment.service.PaymentService;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ProviderPodMapRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Provider Selection Service
 * Handles provider ranking, bidding, and selection for jobs
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderSelectionService {

    private final ProviderJobBidRepository bidRepository;
    private final JobMasterRepository jobRepository;
    private final ServiceProviderProfileRepository providerRepository;
    private final OptimizedMatchingService matchingService;
    private final ProviderPodMapRepository providerPodRepository;
    private final JobProviderMatchRepository matchRepository;
    private final NotificationService notificationService;
    private final JobStateMachine stateMachine;
    private final PaymentService paymentService;
    private final JobWorkflowService jobWorkflowService;
    private final com.servichaya.common.service.ConfigService configService;

    /**
     * Get available providers for a job with ranking
     * Ranking algorithm: bidAmount (DESC) > rating (DESC) > distance (ASC) > totalJobsCompleted (DESC)
     */
    @Transactional
    public Page<ProviderSelectionDto> getAvailableProviders(Long jobId, int page, int size) {
        log.info("Fetching available providers for jobId: {}, page: {}, size: {}", jobId, page, size);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        // Step 1: Auto-match providers (if not already matched and AUTO_MATCHING_FEATURE is enabled)
        if (!"MATCHED".equals(job.getStatus()) && !"ACCEPTED".equals(job.getStatus())) {
            try {
                if (configService.isAutoMatchingEnabled()) {
                    matchingService.matchJobToProviders(jobId);
                    log.info("AUTO_MATCHING_FEATURE enabled. Auto-matched providers for jobId: {}", jobId);
                } else {
                    log.debug("AUTO_MATCHING_FEATURE disabled. Skipping auto-matching for jobId: {}. Admin can manually assign.", jobId);
                }
            } catch (Exception e) {
                log.warn("Auto-matching failed for jobId: {}", jobId, e);
            }
        }

        // Step 2: Get eligible providers (from matching or all active providers in POD)
        List<ServiceProviderProfile> eligibleProviders = getEligibleProviders(job);

        // Step 3: Calculate ranking for each provider
        List<ProviderSelectionDto> rankedProviders = new ArrayList<>();
        
        for (ServiceProviderProfile provider : eligibleProviders) {
            // Get or create bid
            ProviderJobBid bid = bidRepository.findByJobIdAndProviderId(jobId, provider.getId())
                    .orElse(ProviderJobBid.builder()
                            .jobId(jobId)
                            .providerId(provider.getId())
                            .bidAmount(BigDecimal.ZERO) // Default bid
                            .status("PENDING")
                            .rankOrder(Integer.MAX_VALUE) // Will be recalculated
                            .build());

            // Calculate distance (simplified - use POD-based distance if available)
            // In production, you'd calculate from provider's current location
            Double distanceKm = null;
            // Distance calculation can be added later when provider location tracking is implemented

            // Get provider name (business name or from UserAccount for individuals)
            String providerName = provider.getBusinessName();
            if (provider.getProviderType() != null && "INDIVIDUAL".equals(provider.getProviderType())) {
                // For individuals, we'll use providerCode or a generic name
                // In production, you'd fetch from UserAccount
                providerName = provider.getProviderCode() != null 
                        ? "Provider " + provider.getProviderCode() 
                        : "Provider " + provider.getId();
            }

            // Determine if provider is "paid" (has bid amount > 0)
            boolean isPaidProvider = bid.getBidAmount() != null && bid.getBidAmount().compareTo(BigDecimal.ZERO) > 0;
            
            rankedProviders.add(ProviderSelectionDto.builder()
                    .providerId(provider.getId())
                    .providerCode(provider.getProviderCode())
                    .providerName(providerName)
                    .providerType(provider.getProviderType())
                    .rating(provider.getRating() != null ? provider.getRating().doubleValue() : 0.0)
                    .ratingCount(provider.getRatingCount() != null ? provider.getRatingCount() : 0)
                    .totalJobsCompleted(provider.getTotalJobsCompleted() != null ? provider.getTotalJobsCompleted() : 0)
                    .experienceYears(provider.getExperienceYears() != null ? provider.getExperienceYears() : 0)
                    .verificationStatus(provider.getVerificationStatus())
                    .bidAmount(bid.getBidAmount())
                    .proposedPrice(bid.getProposedPrice())
                    .rankOrder(bid.getRankOrder())
                    .distanceKm(distanceKm)
                    .bio(provider.getBio())
                    .isPaidProvider(isPaidProvider)
                    .build());
        }
        
        // Sort by ranking algorithm with paid provider prioritization
        rankedProviders.sort((a, b) -> {
            // Priority 1: Paid providers (bidAmount > 0) come first
            boolean aIsPaid = a.getBidAmount() != null && a.getBidAmount().compareTo(BigDecimal.ZERO) > 0;
            boolean bIsPaid = b.getBidAmount() != null && b.getBidAmount().compareTo(BigDecimal.ZERO) > 0;
            
            if (aIsPaid != bIsPaid) {
                return bIsPaid ? 1 : -1; // Paid providers first
            }
            
            // Priority 2: Within paid/unpaid groups, rank by bidAmount DESC
            int bidCompare = b.getBidAmount().compareTo(a.getBidAmount());
            if (bidCompare != 0) return bidCompare;

            // Priority 3: Rating DESC
            int ratingCompare = Double.compare(b.getRating(), a.getRating());
            if (ratingCompare != 0) return ratingCompare;

            // Priority 4: Distance ASC (closer is better)
            if (a.getDistanceKm() != null && b.getDistanceKm() != null) {
                int distanceCompare = Double.compare(a.getDistanceKm(), b.getDistanceKm());
                if (distanceCompare != 0) return distanceCompare;
            }

            // Priority 5: Total jobs completed DESC
            return Integer.compare(b.getTotalJobsCompleted(), a.getTotalJobsCompleted());
        });

        // Step 4: Update rank orders in database
        for (int i = 0; i < rankedProviders.size(); i++) {
            ProviderSelectionDto dto = rankedProviders.get(i);
            dto.setRankOrder(i + 1);

            // Update or create bid with rank
            ProviderJobBid bid = bidRepository.findByJobIdAndProviderId(jobId, dto.getProviderId())
                    .orElse(ProviderJobBid.builder()
                            .jobId(jobId)
                            .providerId(dto.getProviderId())
                            .bidAmount(dto.getBidAmount())
                            .status("PENDING")
                            .build());

            bid.setRankOrder(i + 1);
            bidRepository.save(bid);
        }

        // Step 5: Paginate
        int start = page * size;
        int end = Math.min(start + size, rankedProviders.size());
        List<ProviderSelectionDto> pageContent = start < rankedProviders.size()
                ? rankedProviders.subList(start, end)
                : Collections.emptyList();

        return new PageImpl<>(pageContent, PageRequest.of(page, size), rankedProviders.size());
    }

    /**
     * Submit or update a provider bid
     */
    @Transactional
    public ProviderJobBid submitBid(Long jobId, Long providerId, BigDecimal bidAmount, 
                                    BigDecimal proposedPrice, String notes) {
        log.info("Provider {} submitting bid for job {}: bidAmount={}, proposedPrice={}", 
                providerId, jobId, bidAmount, proposedPrice);

        // Validate job exists and is in correct status
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!"PENDING".equals(job.getStatus()) && !"MATCHED".equals(job.getStatus())) {
            throw new RuntimeException("Cannot bid on job with status: " + job.getStatus());
        }

        // Get or create bid
        ProviderJobBid bid = bidRepository.findByJobIdAndProviderId(jobId, providerId)
                .orElse(ProviderJobBid.builder()
                        .jobId(jobId)
                        .providerId(providerId)
                        .status("PENDING")
                        .build());

        bid.setBidAmount(bidAmount != null ? bidAmount : BigDecimal.ZERO);
        bid.setProposedPrice(proposedPrice);
        bid.setNotes(notes);

        bid = bidRepository.save(bid);

        // Recalculate rankings
        recalculateRankings(jobId);

        return bid;
    }

    /**
     * Get provider's bid for a job
     */
    @Transactional(readOnly = true)
    public ProviderJobBid getProviderBid(Long jobId, Long providerId) {
        return bidRepository.findByJobIdAndProviderId(jobId, providerId).orElse(null);
    }

    /**
     * Recalculate rankings for all bids on a job
     */
    @Transactional
    public void recalculateRankings(Long jobId) {
        log.info("Recalculating rankings for jobId: {}", jobId);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        List<ProviderJobBid> bids = bidRepository.findBidsByJobIdOrderByRank(jobId, Pageable.unpaged()).getContent();

        // Get provider details for ranking
        Map<Long, ServiceProviderProfile> providerMap = bids.stream()
                .map(ProviderJobBid::getProviderId)
                .distinct()
                .map(providerRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toMap(ServiceProviderProfile::getId, p -> p));

        // Sort by ranking algorithm
        bids.sort((a, b) -> {
            ServiceProviderProfile providerA = providerMap.get(a.getProviderId());
            ServiceProviderProfile providerB = providerMap.get(b.getProviderId());

            // bidAmount DESC
            int bidCompare = b.getBidAmount().compareTo(a.getBidAmount());
            if (bidCompare != 0) return bidCompare;

            // rating DESC
            if (providerA != null && providerB != null) {
                BigDecimal ratingA = providerA.getRating() != null ? providerA.getRating() : BigDecimal.ZERO;
                BigDecimal ratingB = providerB.getRating() != null ? providerB.getRating() : BigDecimal.ZERO;
                int ratingCompare = ratingB.compareTo(ratingA);
                if (ratingCompare != 0) return ratingCompare;
            }

            // distance ASC (if available)
            // jobsCompleted DESC
            if (providerA != null && providerB != null) {
                Integer jobsA = providerA.getTotalJobsCompleted() != null ? providerA.getTotalJobsCompleted() : 0;
                Integer jobsB = providerB.getTotalJobsCompleted() != null ? providerB.getTotalJobsCompleted() : 0;
                return Integer.compare(jobsB, jobsA);
            }

            return 0;
        });

        // Update rank orders
        for (int i = 0; i < bids.size(); i++) {
            bids.get(i).setRankOrder(i + 1);
        }

        bidRepository.saveAll(bids);
        log.info("Rankings recalculated for {} providers", bids.size());
    }

    /**
     * Customer confirms a provider who has accepted the job
     * This is the final step - customer accepts the provider's acceptance
     */
    @Transactional
    public void confirmProviderAcceptance(Long jobId, Long providerId, Long customerId) {
        log.info("Customer {} confirming provider {} acceptance for job {}", customerId, providerId, jobId);

        // Validate job exists and belongs to customer
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!job.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: Job does not belong to customer");
        }

        // Validate job is in correct state (MATCHED with PROVIDER_ACCEPTED subStatus)
        if (!"MATCHED".equals(job.getStatus())) {
            throw new RuntimeException("Job must be in MATCHED status. Current status: " + job.getStatus());
        }

        if (!"PROVIDER_ACCEPTED".equals(job.getSubStatus())) {
            throw new RuntimeException("No provider has accepted this job yet. Current subStatus: " + job.getSubStatus());
        }

        // Validate provider matches
        if (job.getProviderId() == null || !job.getProviderId().equals(providerId)) {
            throw new RuntimeException("Provider mismatch. Expected provider: " + job.getProviderId() + ", got: " + providerId);
        }

        // Validate provider exists
        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found: " + providerId));

        // Now confirm the acceptance - move to ACCEPTED status
        job.setAcceptedAt(java.time.LocalDateTime.now());
        job.setSubStatus(null); // Clear subStatus as we're moving to ACCEPTED
        
        // Determine next status based on payment preference
        String nextStatus = "ACCEPTED"; // Default
        com.servichaya.payment.entity.ProviderPaymentPreference preference = null;
        
        try {
            preference = paymentService.getProviderPaymentPreference(providerId, job.getServiceCategoryId());
            
            if (preference != null && ("PARTIAL".equals(preference.getPaymentType()) || "FULL".equals(preference.getPaymentType()))) {
                nextStatus = "PENDING_FOR_PAYMENT";
            }
        } catch (Exception e) {
            log.warn("Could not determine payment preference: {}", e.getMessage());
        }
        
        // FIX BUG #4: Create payment schedule ONLY when customer confirms (not when provider accepts)
        // Check if payment schedule already exists to prevent duplicates
        try {
            if (preference != null && job.getEstimatedBudget() != null) {
                // Check if payment schedule already exists
                com.servichaya.payment.entity.JobPaymentSchedule existingSchedule = 
                    paymentService.getPaymentSchedule(job.getId());
                
                if (existingSchedule == null) {
                    // Only create if it doesn't exist (prevents duplicate creation)
                    paymentService.createPaymentSchedule(
                            job.getId(),
                            preference.getPaymentType(),
                            job.getEstimatedBudget(),
                            preference.getHourlyRate(),
                            null,
                            preference.getPartialPaymentPercentage()
                    );
                    log.info("Payment schedule created for job {} after customer confirmation", job.getId());
                } else {
                    log.info("Payment schedule already exists for job {}. Skipping creation.", job.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Could not create payment schedule: {}", e.getMessage());
        }
        
        // Update job status
        String oldStatus = job.getStatus();
        stateMachine.validateTransition(oldStatus, nextStatus);
        job.setStatus(nextStatus);
        jobRepository.save(job);
        
        // Sync workflow with status change
        try {
            jobWorkflowService.onStatusChanged(jobId, oldStatus, nextStatus);
        } catch (Exception e) {
            log.error("Failed to sync workflow for jobId: {} on status change {} -> {}",
                    jobId, oldStatus, nextStatus, e);
        }

        // Reject other matches now that customer confirmed
        List<com.servichaya.matching.entity.JobProviderMatch> otherMatches = 
                matchRepository.findByJobIdOrderByMatchScoreDesc(jobId)
                        .stream()
                        .filter(m -> !m.getProviderId().equals(providerId))
                        .filter(m -> "PENDING".equals(m.getStatus()) || "NOTIFIED".equals(m.getStatus()) || "ACCEPTED".equals(m.getStatus()))
                        .collect(java.util.stream.Collectors.toList());

        for (com.servichaya.matching.entity.JobProviderMatch otherMatch : otherMatches) {
            otherMatch.setStatus("REJECTED");
            matchRepository.save(otherMatch);
        }

        // Send notifications
        try {
            notificationService.createNotification(
                    provider.getUserId(),
                    "PROVIDER",
                    "JOB_CONFIRMED",
                    "Job Confirmed!",
                    String.format("Customer has confirmed your acceptance for job: %s. You can now start the work.", job.getTitle()),
                    "JOB",
                    jobId,
                    "/provider/jobs/" + jobId,
                    Map.of("jobId", jobId, "jobCode", job.getJobCode())
            );
            
            notificationService.createNotification(
                    customerId,
                    "CUSTOMER",
                    "PROVIDER_CONFIRMED",
                    "Provider Confirmed",
                    String.format("You have confirmed provider for job: %s. Work can now begin.", job.getTitle()),
                    "JOB",
                    jobId,
                    "/customer/jobs/" + jobId,
                    Map.of("jobId", jobId, "jobCode", job.getJobCode())
            );
        } catch (Exception e) {
            log.warn("Failed to send notifications: {}", e.getMessage());
        }

        log.info("Customer {} confirmed provider {} for job {}. Job status: {}", customerId, providerId, jobId, nextStatus);
    }

    /**
     * Customer selects a provider for their job (manual selection before provider accepts)
     * Creates/updates match record and notifies provider
     */
    @Transactional
    public void selectProvider(Long jobId, Long providerId, Long customerId) {
        log.info("Customer {} selecting provider {} for job {}", customerId, providerId, jobId);

        // Validate job exists and belongs to customer
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!job.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: Job does not belong to customer");
        }

        // Validate job status
        if (!"PENDING".equals(job.getStatus()) && !"MATCHED".equals(job.getStatus())) {
            throw new RuntimeException("Cannot select provider for job with status: " + job.getStatus());
        }

        // Validate provider exists
        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found: " + providerId));

        // Check if match already exists first (to avoid creating duplicates)
        // Use findAll and filter to handle potential duplicates
        List<JobProviderMatch> existingMatches = matchRepository.findByJobIdOrderByMatchScoreDesc(jobId)
                .stream()
                .filter(m -> m.getProviderId().equals(providerId))
                .collect(java.util.stream.Collectors.toList());
        
        Optional<JobProviderMatch> existingMatch;
        if (!existingMatches.isEmpty()) {
            // If multiple matches exist (shouldn't happen, but handle it), use the first one
            // and delete others
            if (existingMatches.size() > 1) {
                log.warn("Found {} duplicate matches for jobId: {} and providerId: {}. Keeping the first one and deleting others.", 
                        existingMatches.size(), jobId, providerId);
                for (int i = 1; i < existingMatches.size(); i++) {
                    matchRepository.delete(existingMatches.get(i));
                }
            }
            existingMatch = Optional.of(existingMatches.get(0));
        } else {
            // No match exists, ensure provider is matched to this job
            // If AUTO_MATCHING_FEATURE is enabled, run full matching; otherwise create manual match
            if (configService.isAutoMatchingEnabled()) {
                matchingService.matchJobToProviders(jobId);
                
                // Try to find the match again after matching
                existingMatch = matchRepository.findByJobIdOrderByMatchScoreDesc(jobId)
                        .stream()
                        .filter(m -> m.getProviderId().equals(providerId))
                        .findFirst();
            } else {
                // AUTO_MATCHING_FEATURE disabled - will create manual match below
                existingMatch = Optional.empty();
                log.debug("AUTO_MATCHING_FEATURE disabled. Will create manual match for customer-selected provider.");
            }
        }
        
        JobProviderMatch match;
        if (existingMatch.isPresent()) {
            match = existingMatch.get();
            // Update match to NOTIFIED status so provider gets notified
            if (!"NOTIFIED".equals(match.getStatus()) && !"ACCEPTED".equals(match.getStatus())) {
                match.setStatus("NOTIFIED");
                match.setNotifiedAt(java.time.LocalDateTime.now());
                match.setRankOrder(1); // Top priority for customer selection
                matchRepository.save(match);
            }
        } else {
            // Create new match record
            match = JobProviderMatch.builder()
                    .jobId(jobId)
                    .providerId(providerId)
                    .matchScore(BigDecimal.valueOf(100)) // High score for customer selection
                    .status("NOTIFIED")
                    .notifiedAt(java.time.LocalDateTime.now())
                    .rankOrder(1) // Top priority
                    .build();
            matchRepository.save(match);
        }
        
        // Update job status to MATCHED if not already
        if (!"MATCHED".equals(job.getStatus())) {
            stateMachine.validateTransition(job.getStatus(), "MATCHED");
            job.setStatus("MATCHED");
            jobRepository.save(job);
        }
        
        // Send notification to provider
        try {
            String providerName = provider.getBusinessName() != null 
                    ? provider.getBusinessName() 
                    : provider.getProviderCode();
            
            notificationService.createNotification(
                    provider.getUserId(),
                    "PROVIDER",
                    "PROVIDER_SELECTED",
                    "Customer Selected You!",
                    String.format("Customer has selected you for job: %s. Please accept the job to proceed.", job.getTitle()),
                    "JOB",
                    jobId,
                    "/provider/jobs/" + jobId,
                    Map.of("jobId", jobId, "jobCode", job.getJobCode(), "customerId", customerId)
            );
            
            log.info("Notification sent to provider {} for job {}", providerId, jobId);
        } catch (Exception e) {
            log.warn("Failed to send notification to provider: {}", e.getMessage());
        }
        
        log.info("Provider {} selected by customer {} for job {}", providerId, customerId, jobId);
    }

    /**
     * Get eligible providers for a job (from matching or POD-based)
     */
    private List<ServiceProviderProfile> getEligibleProviders(JobMaster job) {
        // Try to get from matching first
        try {
            List<ProviderMatchCandidateDto> candidates = matchingService.findEligibleProviders(job.getId());
            List<ServiceProviderProfile> providers = new ArrayList<>();
            for (ProviderMatchCandidateDto candidate : candidates) {
                providerRepository.findById(candidate.getProviderId())
                        .ifPresent(providers::add);
            }
            return providers;
        } catch (Exception e) {
            log.warn("Could not get providers from matching service, falling back to POD-based search", e);
            
            // Fallback: Get providers from same POD
            if (job.getPodId() != null) {
                List<ServiceProviderProfile> providers = new ArrayList<>();
                for (var podMap : providerPodRepository.findByPodId(job.getPodId())) {
                    providerRepository.findById(podMap.getProviderId())
                            .filter(p -> "ACTIVE".equals(p.getProfileStatus()))
                            .ifPresent(providers::add);
                }
                return providers;
            }
            
            return Collections.emptyList();
        }
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    private Double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

}
