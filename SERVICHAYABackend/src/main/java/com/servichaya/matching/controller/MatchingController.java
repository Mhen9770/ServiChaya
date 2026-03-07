package com.servichaya.matching.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.matching.dto.MatchingResultDto;
import com.servichaya.matching.dto.ProviderMatchDto;
import com.servichaya.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/matching")
@RequiredArgsConstructor
@Slf4j
public class MatchingController {

    private final MatchingService matchingService;

    @PostMapping("/job/{jobId}/match")
    public ResponseEntity<ApiResponse<MatchingResultDto>> matchJobToProviders(@PathVariable Long jobId) {
        log.info("Received matching request for jobId: {}", jobId);
        MatchingResultDto result = matchingService.matchJobToProviders(jobId);
        log.info("Matching completed for jobId: {}. Matched {} providers, notified {}", 
                jobId, result.getTotalProvidersMatched(), result.getProvidersNotified());
        return ResponseEntity.ok(ApiResponse.success("Matching completed successfully", result));
    }

    @GetMapping("/provider/{providerId}/available-jobs")
    public ResponseEntity<ApiResponse<List<ProviderMatchDto>>> getAvailableJobsForProvider(@PathVariable Long providerId) {
        log.info("Fetching available jobs for providerId: {}", providerId);
        List<ProviderMatchDto> jobs = matchingService.getAvailableJobsForProvider(providerId);
        log.info("Found {} available jobs for providerId: {}", jobs.size(), providerId);
        return ResponseEntity.ok(ApiResponse.success("Available jobs fetched successfully", jobs));
    }

    @PostMapping("/match/{matchId}/accept")
    public ResponseEntity<ApiResponse<String>> acceptJob(
            @PathVariable Long matchId,
            @RequestParam Long providerId) {
        log.info("Provider {} accepting match {}", providerId, matchId);
        matchingService.acceptJob(matchId, providerId);
        log.info("Job accepted successfully. MatchId: {}, ProviderId: {}", matchId, providerId);
        return ResponseEntity.ok(ApiResponse.success("Job accepted successfully", "Job has been accepted"));
    }
}
