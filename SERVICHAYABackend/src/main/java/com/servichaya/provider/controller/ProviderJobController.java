package com.servichaya.provider.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import com.servichaya.job.service.JobStatusService;
import com.servichaya.job.dto.JobStatusUpdateDto;
import com.servichaya.auth.service.JwtService;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Provider Job Actions Controller
 * Handles all provider-specific job actions
 */
@RestController
@RequestMapping("/provider/jobs")
@RequiredArgsConstructor
@Slf4j
public class ProviderJobController {

    private final JobService jobService;
    private final JobStatusService jobStatusService;
    private final JwtService jwtService;
    private final ServiceProviderProfileRepository providerRepository;

    /**
     * Get job details for provider
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobDto>> getJobDetails(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Provider requesting job details for jobId: {}", jobId);
        
        Long providerId = extractUserIdFromToken(request);
        JobDto job = jobService.getJobById(jobId);
        
        // Verify provider is assigned to this job (if job is accepted)
        if (job.getProviderId() != null && !job.getProviderId().equals(getProviderProfileId(providerId))) {
            log.error("Provider {} attempted to access job {} not assigned to them", providerId, jobId);
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized: You can only access jobs assigned to you"));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Job fetched successfully", job));
    }

    /**
     * Start job (provider action)
     */
    @PostMapping("/{jobId}/start")
    public ResponseEntity<ApiResponse<String>> startJob(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Provider requesting to start jobId: {}", jobId);
        
        Long providerId = extractUserIdFromToken(request);
        jobStatusService.startJob(jobId, providerId);
        return ResponseEntity.ok(ApiResponse.success("Job started successfully", "Job started"));
    }

    /**
     * Complete job (provider action)
     */
    @PostMapping("/{jobId}/complete")
    public ResponseEntity<ApiResponse<String>> completeJob(
            @PathVariable Long jobId,
            @RequestBody JobStatusUpdateDto dto,
            HttpServletRequest request) {
        log.info("Provider requesting to complete jobId: {} with finalPrice: {}, paymentChannel: {}", 
                jobId, dto.getFinalPrice(), dto.getPaymentChannel());
        
        if (dto.getFinalPrice() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Final price is required"));
        }
        
        if (dto.getPaymentChannel() == null || dto.getPaymentChannel().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Payment channel (CASH or ONLINE) is required"));
        }
        
        Long providerId = extractUserIdFromToken(request);
        jobStatusService.completeJob(jobId, providerId, dto.getFinalPrice(), dto.getPaymentChannel());
        return ResponseEntity.ok(ApiResponse.success("Job completed successfully", "Job completed"));
    }

    /**
     * Cancel job (provider action)
     */
    @PostMapping("/{jobId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelJob(
            @PathVariable Long jobId,
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        log.info("Provider requesting to cancel jobId: {}", jobId);
        
        Long providerId = extractUserIdFromToken(request);
        String cancelReason = requestBody.getOrDefault("cancelReason", "Provider cancelled");
        
        jobStatusService.cancelJob(jobId, providerId, cancelReason, true);
        return ResponseEntity.ok(ApiResponse.success("Job cancelled successfully", "Job cancelled"));
    }

    /**
     * Get cancellation fee estimate (provider action)
     */
    @GetMapping("/{jobId}/cancellation-fee")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCancellationFee(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Provider requesting cancellation fee for jobId: {}", jobId);
        
        Long providerId = extractUserIdFromToken(request);
        Map<String, Object> feeInfo = jobStatusService.getCancellationFeeEstimate(jobId, providerId, true);
        return ResponseEntity.ok(ApiResponse.success("Cancellation fee calculated", feeInfo));
    }

    /**
     * Track job status (provider action)
     */
    @GetMapping("/{jobId}/track")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trackJob(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Provider tracking jobId: {}", jobId);
        
        Long providerId = extractUserIdFromToken(request);
        JobDto job = jobService.getJobById(jobId);
        
        // Verify provider is assigned to this job
        if (job.getProviderId() == null || !job.getProviderId().equals(getProviderProfileId(providerId))) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized"));
        }
        
        Map<String, Object> trackingInfo = Map.of(
            "jobId", job.getId(),
            "jobCode", job.getJobCode(),
            "status", job.getStatus(),
            "customerId", job.getCustomerId(),
            "acceptedAt", job.getAcceptedAt() != null ? job.getAcceptedAt() : "Not accepted",
            "startedAt", job.getStartedAt() != null ? job.getStartedAt() : "Not started",
            "completedAt", job.getCompletedAt() != null ? job.getCompletedAt() : "Not completed",
            "finalPrice", job.getFinalPrice() != null ? job.getFinalPrice() : "Not set"
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

    private Long getProviderProfileId(Long userId) {
        ServiceProviderProfile providerProfile = providerRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("Provider profile not found for userId: {}", userId);
                    return new RuntimeException("Provider profile not found");
                });
        return providerProfile.getId();
    }
}
