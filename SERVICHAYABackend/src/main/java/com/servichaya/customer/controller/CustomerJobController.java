package com.servichaya.customer.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import com.servichaya.job.service.JobStatusService;
import com.servichaya.auth.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Customer Job Actions Controller
 * Handles all customer-specific job actions
 */
@RestController
@RequestMapping("/customer/jobs")
@RequiredArgsConstructor
@Slf4j
public class CustomerJobController {

    private final JobService jobService;
    private final JobStatusService jobStatusService;
    private final JwtService jwtService;

    /**
     * Get job details for customer
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobDto>> getJobDetails(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Customer requesting job details for jobId: {}", jobId);
        
        Long customerId = extractUserIdFromToken(request);
        JobDto job = jobService.getJobById(jobId);
        
        // Verify customer owns this job
        if (!job.getCustomerId().equals(customerId)) {
            log.error("Customer {} attempted to access job {} not belonging to them", customerId, jobId);
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized: You can only access your own jobs"));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Job fetched successfully", job));
    }

    /**
     * Cancel job (customer action)
     */
    @PostMapping("/{jobId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelJob(
            @PathVariable Long jobId,
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        log.info("Customer requesting to cancel jobId: {}", jobId);
        
        Long customerId = extractUserIdFromToken(request);
        String cancelReason = requestBody.getOrDefault("cancelReason", "Customer cancelled");
        
        jobStatusService.cancelJob(jobId, customerId, cancelReason, false);
        return ResponseEntity.ok(ApiResponse.success("Job cancelled successfully", "Job cancelled"));
    }

    /**
     * Get cancellation fee estimate (customer action)
     */
    @GetMapping("/{jobId}/cancellation-fee")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCancellationFee(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Customer requesting cancellation fee for jobId: {}", jobId);
        
        Long customerId = extractUserIdFromToken(request);
        Map<String, Object> feeInfo = jobStatusService.getCancellationFeeEstimate(jobId, customerId, false);
        return ResponseEntity.ok(ApiResponse.success("Cancellation fee calculated", feeInfo));
    }

    /**
     * Complete cancellation after fee payment (customer action)
     */
    @PostMapping("/{jobId}/complete-cancellation")
    public ResponseEntity<ApiResponse<String>> completeCancellation(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Customer completing cancellation for jobId: {}", jobId);
        
        Long customerId = extractUserIdFromToken(request);
        
        // Verify customer owns this job
        JobDto job = jobService.getJobById(jobId);
        if (!job.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized"));
        }
        
        jobStatusService.completeCancellation(jobId);
        return ResponseEntity.ok(ApiResponse.success("Cancellation completed successfully", "Job cancelled"));
    }

    /**
     * Track job status (customer action)
     */
    @GetMapping("/{jobId}/track")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trackJob(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Customer tracking jobId: {}", jobId);
        
        Long customerId = extractUserIdFromToken(request);
        JobDto job = jobService.getJobById(jobId);
        
        // Verify customer owns this job
        if (!job.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized"));
        }
        
        Map<String, Object> trackingInfo = Map.of(
            "jobId", job.getId(),
            "jobCode", job.getJobCode(),
            "status", job.getStatus(),
            "providerId", job.getProviderId() != null ? job.getProviderId() : "Not assigned",
            "acceptedAt", job.getAcceptedAt() != null ? job.getAcceptedAt() : "Not accepted",
            "startedAt", job.getStartedAt() != null ? job.getStartedAt() : "Not started",
            "completedAt", job.getCompletedAt() != null ? job.getCompletedAt() : "Not completed"
        );
        
        return ResponseEntity.ok(ApiResponse.success("Job tracking info fetched", trackingInfo));
    }

    private Long extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("Authorization header missing or invalid");
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }
        
        String token = authHeader.substring(7);
        try {
            return jwtService.extractUserId(token);
        } catch (Exception e) {
            log.error("Error extracting userId from token", e);
            throw new RuntimeException("Unauthorized: Invalid token", e);
        }
    }
}
