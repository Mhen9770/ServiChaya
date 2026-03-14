package com.servichaya.job.service;

import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.matching.entity.JobProviderMatch;
import com.servichaya.matching.repository.JobProviderMatchRepository;
import com.servichaya.common.service.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Matching Timeout Service
 * Handles timeout scenarios for jobs stuck in MATCHING or MATCHED status
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingTimeoutService {

    private final JobMasterRepository jobRepository;
    private final JobProviderMatchRepository matchRepository;
    private final ConfigService configService;
    private final JobStateMachine stateMachine;
    private final com.servichaya.job.service.JobWorkflowService jobWorkflowService;

    /**
     * Check for jobs stuck in MATCHING status (no providers found or matching failed)
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void checkMatchingTimeouts() {
        log.debug("Checking for jobs stuck in MATCHING status");
        
        Integer matchingTimeoutMinutes = configService.getMatchingTimeoutMinutes();
        if (matchingTimeoutMinutes == null || matchingTimeoutMinutes <= 0) {
            matchingTimeoutMinutes = 30; // Default 30 minutes
        }
        
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(matchingTimeoutMinutes);
        
        List<JobMaster> stuckJobs = jobRepository.findByStatusAndUpdatedAtBefore("MATCHING", timeoutThreshold);
        
        for (JobMaster job : stuckJobs) {
            try {
                log.info("Job {} stuck in MATCHING status for more than {} minutes. Reverting to PENDING.", 
                        job.getId(), matchingTimeoutMinutes);
                
                // Check if any matches exist
                List<JobProviderMatch> matches = matchRepository.findByJobIdOrderByMatchScoreDesc(job.getId());
                if (matches.isEmpty()) {
                    // No matches found - revert to PENDING
                    String oldStatus = job.getStatus();
                    stateMachine.validateTransition(oldStatus, "PENDING");
                    job.setStatus("PENDING");
                    jobRepository.save(job);
                    
                    // Sync workflow with status change
                    try {
                        jobWorkflowService.onStatusChanged(job.getId(), oldStatus, "PENDING");
                    } catch (Exception e) {
                        log.error("Failed to sync workflow for jobId: {} on status change {} -> PENDING",
                                job.getId(), oldStatus, e);
                    }
                    
                    log.info("Job {} reverted to PENDING (no matches found)", job.getId());
                } else {
                    // Matches exist but no acceptance - keep in MATCHED
                    if (!"MATCHED".equals(job.getStatus())) {
                        String oldStatus = job.getStatus();
                        stateMachine.validateTransition(oldStatus, "MATCHED");
                        job.setStatus("MATCHED");
                        jobRepository.save(job);
                        
                        // Sync workflow with status change
                        try {
                            jobWorkflowService.onStatusChanged(job.getId(), oldStatus, "MATCHED");
                        } catch (Exception e) {
                            log.error("Failed to sync workflow for jobId: {} on status change {} -> MATCHED",
                                    job.getId(), oldStatus, e);
                        }
                        
                        log.info("Job {} moved to MATCHED (matches exist)", job.getId());
                    }
                }
            } catch (Exception e) {
                log.error("Error handling timeout for job {}", job.getId(), e);
            }
        }
    }

    /**
     * Check for expired matches (providers didn't accept in time)
     * Runs every 2 minutes
     */
    @Scheduled(fixedRate = 300000) // 2 minutes
    @Transactional
    public void checkExpiredMatches() {
        log.debug("Checking for expired matches");
        
        Integer providerResponseTimeoutSeconds = configService.getProviderResponseTimeoutSeconds();
        if (providerResponseTimeoutSeconds == null || providerResponseTimeoutSeconds <= 0) {
            providerResponseTimeoutSeconds = 300; // Default 5 minutes
        }
        
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusSeconds(providerResponseTimeoutSeconds);
        
        // Use repository query instead of loading all matches
        List<JobProviderMatch> expiredMatches = matchRepository.findByStatusInAndNotifiedAtBefore(
                List.of("NOTIFIED", "PENDING"), timeoutThreshold);
        
        for (JobProviderMatch match : expiredMatches) {
            try {
                log.info("Match {} expired. Marking as EXPIRED.", match.getId());
                match.setStatus("EXPIRED");
                matchRepository.save(match);
            } catch (Exception e) {
                log.error("Error marking match {} as expired", match.getId(), e);
            }
        }
    }
}
