package com.servichaya.job.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.JobStatusUpdateDto;
import com.servichaya.job.service.JobStatusService;
import com.servichaya.job.service.JobWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobStatusController {

    private final JobWorkflowService jobWorkflowService;
    private final JobStatusService jobStatusService;

    @PostMapping("/{jobId}/start")
    public ResponseEntity<ApiResponse<String>> startJob(
            @PathVariable Long jobId,
            @RequestParam Long providerId) {
        log.info("Request to start jobId: {} by providerId: {}", jobId, providerId);
        jobWorkflowService.performAction(jobId, providerId, true, "START_WORK", null);
        return ResponseEntity.ok(ApiResponse.success("Job started successfully", "Job started"));
    }

    @PostMapping("/{jobId}/complete")
    public ResponseEntity<ApiResponse<String>> completeJob(
            @PathVariable Long jobId,
            @RequestParam Long providerId,
            @RequestBody JobStatusUpdateDto dto) {
        log.info("Request to complete jobId: {} by providerId: {} with finalPrice: {}, paymentChannel: {}", 
                jobId, providerId, dto.getFinalPrice(), dto.getPaymentChannel());
        
        if (dto.getFinalPrice() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Final price is required"));
        }
        
        if (dto.getPaymentChannel() == null || dto.getPaymentChannel().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Payment channel (CASH or ONLINE) is required"));
        }
        
        jobWorkflowService.performAction(jobId, providerId, true, "COMPLETE_WORK", dto);
        return ResponseEntity.ok(ApiResponse.success("Job completed successfully", "Job completed"));
    }

    @GetMapping("/{jobId}/cancellation-fee")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCancellationFee(
            @PathVariable Long jobId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean isProvider) {
        log.info("Request to get cancellation fee for jobId: {} by userId: {}, isProvider: {}", jobId, userId, isProvider);
        Map<String, Object> feeInfo = jobStatusService.getCancellationFeeEstimate(jobId, userId, isProvider);
        return ResponseEntity.ok(ApiResponse.success("Cancellation fee calculated", feeInfo));
    }

    @PostMapping("/{jobId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelJob(
            @PathVariable Long jobId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean isProvider,
            @RequestBody JobStatusUpdateDto dto) {
        log.info("Request to cancel jobId: {} by userId: {}, isProvider: {}", jobId, userId, isProvider);
        jobWorkflowService.performAction(jobId, userId, isProvider, "CANCEL_JOB", dto);
        return ResponseEntity.ok(ApiResponse.success("Job cancelled successfully", "Job cancelled"));
    }

    @PostMapping("/{jobId}/complete-cancellation")
    public ResponseEntity<ApiResponse<String>> completeCancellation(
            @PathVariable Long jobId) {
        log.info("Request to complete cancellation for jobId: {}", jobId);
        jobStatusService.completeCancellation(jobId);
        return ResponseEntity.ok(ApiResponse.success("Cancellation completed successfully", "Job cancelled"));
    }
}
