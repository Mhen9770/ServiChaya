package com.servichaya.job.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.JobStatusUpdateDto;
import com.servichaya.job.service.JobStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobStatusController {

    private final JobStatusService jobStatusService;

    @PostMapping("/{jobId}/start")
    public ResponseEntity<ApiResponse<String>> startJob(
            @PathVariable Long jobId,
            @RequestParam Long providerId) {
        log.info("Request to start jobId: {} by providerId: {}", jobId, providerId);
        jobStatusService.startJob(jobId, providerId);
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
        
        jobStatusService.completeJob(jobId, providerId, dto.getFinalPrice(), dto.getPaymentChannel());
        return ResponseEntity.ok(ApiResponse.success("Job completed successfully", "Job completed"));
    }

    @PostMapping("/{jobId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelJob(
            @PathVariable Long jobId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean isProvider,
            @RequestBody JobStatusUpdateDto dto) {
        log.info("Request to cancel jobId: {} by userId: {}, isProvider: {}", jobId, userId, isProvider);
        jobStatusService.cancelJob(jobId, userId, dto.getCancelReason(), isProvider);
        return ResponseEntity.ok(ApiResponse.success("Job cancelled successfully", "Job cancelled"));
    }
}
