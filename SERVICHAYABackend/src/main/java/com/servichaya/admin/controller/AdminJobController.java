package com.servichaya.admin.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import com.servichaya.job.service.JobStatusService;
import com.servichaya.matching.service.MatchingService;
import com.servichaya.auth.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin Job Management Controller
 * Handles all admin-specific job actions
 */
@RestController
@RequestMapping("/admin/jobs")
@RequiredArgsConstructor
@Slf4j
public class AdminJobController {

    private final JobService jobService;
    private final JobStatusService jobStatusService;
    private final MatchingService matchingService;
    private final JwtService jwtService;

    /**
     * Get job details (admin can view any job)
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobDto>> getJobDetails(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Admin requesting job details for jobId: {}", jobId);
        
        extractAdminIdFromToken(request); // Verify admin
        
        JobDto job = jobService.getJobById(jobId);
        return ResponseEntity.ok(ApiResponse.success("Job fetched successfully", job));
    }

    /**
     * Force match job to providers (admin action)
     */
    @PostMapping("/{jobId}/force-match")
    public ResponseEntity<ApiResponse<String>> forceMatchJob(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Admin forcing match for jobId: {}", jobId);
        
        extractAdminIdFromToken(request);
        
        matchingService.matchJobToProviders(jobId);
        return ResponseEntity.ok(ApiResponse.success("Job matching triggered successfully", "Matching completed"));
    }

    /**
     * Manually assign job to provider (admin action)
     */
    @PostMapping("/{jobId}/assign")
    public ResponseEntity<ApiResponse<String>> assignJob(
            @PathVariable Long jobId,
            @RequestParam Long providerId,
            @RequestParam(required = false) java.math.BigDecimal matchScore,
            @RequestParam(required = false) Integer rankOrder,
            HttpServletRequest request) {
        log.info("Admin assigning jobId: {} to providerId: {}", jobId, providerId);
        
        extractAdminIdFromToken(request);
        
        matchingService.manualAssignJob(jobId, providerId, matchScore, rankOrder);
        return ResponseEntity.ok(ApiResponse.success("Job assigned successfully", "Job assigned"));
    }

    /**
     * Cancel job (admin action - can cancel any job)
     */
    @PostMapping("/{jobId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelJob(
            @PathVariable Long jobId,
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        log.info("Admin cancelling jobId: {}", jobId);
        
        extractAdminIdFromToken(request);
        String cancelReason = requestBody.getOrDefault("cancelReason", "Admin cancelled");
        String cancelledBy = requestBody.getOrDefault("cancelledBy", "ADMIN");
        
        // Admin can cancel on behalf of customer or provider
        boolean isProvider = "PROVIDER".equals(cancelledBy);
        Long userId = Long.valueOf(requestBody.getOrDefault("userId", "0"));
        
        if (userId > 0) {
            jobStatusService.cancelJob(jobId, userId, cancelReason, isProvider);
        } else {
            // Admin direct cancellation
            JobDto job = jobService.getJobById(jobId);
            if (job.getProviderId() != null) {
                // Cancel as provider
                jobStatusService.cancelJob(jobId, job.getProviderId(), cancelReason, true);
            } else {
                // Cancel as customer
                jobStatusService.cancelJob(jobId, job.getCustomerId(), cancelReason, false);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success("Job cancelled successfully", "Job cancelled"));
    }

    /**
     * Update job status (admin action - can override state machine)
     */
    @PostMapping("/{jobId}/status")
    public ResponseEntity<ApiResponse<String>> updateJobStatus(
            @PathVariable Long jobId,
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        log.info("Admin updating jobId: {} status", jobId);
        
        extractAdminIdFromToken(request);
        
        String newStatus = requestBody.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Status is required"));
        }
        
        JobDto job = jobService.getJobById(jobId);
        jobService.updateJobStatus(jobId, job.getStatus(), newStatus);
        
        return ResponseEntity.ok(ApiResponse.success("Job status updated successfully", "Status updated"));
    }

    /**
     * Get job analytics (admin action)
     */
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getJobAnalytics(
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            HttpServletRequest request) {
        log.info("Admin requesting job analytics");
        
        extractAdminIdFromToken(request);
        
        // TODO: Implement analytics service
        Map<String, Object> analytics = Map.of(
            "totalJobs", 0,
            "pendingJobs", 0,
            "completedJobs", 0,
            "cancelledJobs", 0,
            "totalRevenue", 0
        );
        
        return ResponseEntity.ok(ApiResponse.success("Analytics fetched", analytics));
    }

    private Long extractAdminIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("Authorization header missing or invalid");
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }
        
        String token = authHeader.substring(7);
        try {
            Long userId = jwtService.extractUserId(token);
            String role = jwtService.extractRole(token);
            
            if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
                throw new RuntimeException("Unauthorized: Admin access required");
            }
            
            return userId;
        } catch (Exception e) {
            log.error("Error extracting admin userId from token", e);
            throw new RuntimeException("Unauthorized: Invalid token", e);
        }
    }
}
