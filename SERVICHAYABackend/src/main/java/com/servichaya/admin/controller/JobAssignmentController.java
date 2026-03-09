package com.servichaya.admin.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.matching.dto.ProviderMatchDto;
import com.servichaya.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Admin Job Assignment Controller
 * Allows admin to manually assign jobs to providers
 */
@RestController
@RequestMapping("/admin/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobAssignmentController {

    private final MatchingService matchingService;

    /**
     * Manually assign a job to a provider
     * Creates entry in job_provider_match table
     */
    @PostMapping("/{jobId}/assign")
    public ResponseEntity<ApiResponse<String>> assignJobToProvider(
            @PathVariable Long jobId,
            @RequestParam Long providerId,
            @RequestParam(required = false) BigDecimal matchScore,
            @RequestParam(required = false) Integer rankOrder) {
        log.info("Admin assigning jobId: {} to providerId: {}", jobId, providerId);
        
        try {
            matchingService.manualAssignJob(jobId, providerId, matchScore, rankOrder);
            return ResponseEntity.ok(ApiResponse.success(
                    "Job assigned successfully", 
                    "Job has been assigned to provider"));
        } catch (Exception e) {
            log.error("Error assigning job: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to assign job: " + e.getMessage()));
        }
    }

    /**
     * Get available providers for a job (for admin selection)
     */
    @GetMapping("/{jobId}/available-providers")
    public ResponseEntity<ApiResponse<List<ProviderMatchDto>>> getAvailableProviders(
            @PathVariable Long jobId) {
        log.info("Fetching available providers for jobId: {}", jobId);
        
        try {
            List<ProviderMatchDto> providers = matchingService.getAvailableProvidersForJob(jobId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Available providers fetched", 
                    providers));
        } catch (Exception e) {
            log.error("Error fetching available providers: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch providers: " + e.getMessage()));
        }
    }

    /**
     * Get all assigned providers for a job
     */
    @GetMapping("/{jobId}/assignments")
    public ResponseEntity<ApiResponse<List<ProviderMatchDto>>> getJobAssignments(
            @PathVariable Long jobId) {
        log.info("Fetching assigned providers for jobId: {}", jobId);
        
        try {
            List<ProviderMatchDto> assignments = matchingService.getJobAssignments(jobId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Assignments fetched successfully", 
                    assignments));
        } catch (Exception e) {
            log.error("Error fetching assignments: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch assignments: " + e.getMessage()));
        }
    }

    /**
     * Remove a provider assignment from a job
     */
    @DeleteMapping("/{jobId}/assignments/{matchId}")
    public ResponseEntity<ApiResponse<String>> removeAssignment(
            @PathVariable Long jobId,
            @PathVariable Long matchId) {
        log.info("Admin removing assignment matchId: {} for jobId: {}", matchId, jobId);
        
        try {
            matchingService.removeJobAssignment(matchId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Assignment removed successfully", 
                    "Provider assignment has been removed"));
        } catch (Exception e) {
            log.error("Error removing assignment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to remove assignment: " + e.getMessage()));
        }
    }
}
