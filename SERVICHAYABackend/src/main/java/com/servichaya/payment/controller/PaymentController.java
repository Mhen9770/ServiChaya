package com.servichaya.payment.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.payment.dto.*;
import com.servichaya.payment.service.EarningsService;
import com.servichaya.payment.service.PaymentPreferenceService;
import com.servichaya.payment.service.PaymentService;
import com.servichaya.payment.service.PayoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentPreferenceService preferenceService;
    private final EarningsService earningsService;
    private final PayoutService payoutService;

    @PostMapping("/schedule")
    public ResponseEntity<ApiResponse<PaymentScheduleDto>> createPaymentSchedule(
            @RequestParam Long jobId,
            @RequestBody CreatePaymentScheduleDto dto) {
        log.info("Creating payment schedule for jobId: {}", jobId);
        var schedule = paymentService.createPaymentSchedule(
                jobId, dto.getPaymentType(), dto.getTotalAmount(),
                dto.getHourlyRate(), dto.getEstimatedHours(), dto.getUpfrontPercentage());
        return ResponseEntity.ok(ApiResponse.success("Payment schedule created", mapToScheduleDto(schedule)));
    }

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<String>> processPayment(@RequestBody PaymentRequestDto dto) {
        log.info("Processing payment for jobId: {}", dto.getJobId());
        paymentService.processPayment(
                dto.getJobId(), null, dto.getAmount(), dto.getPaymentMethod(),
                dto.getRazorpayOrderId(), dto.getRazorpayPaymentId(), dto.getRazorpaySignature());
        return ResponseEntity.ok(ApiResponse.success("Payment processed successfully", "Payment successful"));
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<List<PaymentPreferenceDto>>> getPaymentPreferences(
            @RequestParam Long providerId) {
        log.info("Fetching payment preferences for providerId: {}", providerId);
        List<PaymentPreferenceDto> preferences = preferenceService.getProviderPreferences(providerId);
        return ResponseEntity.ok(ApiResponse.success("Preferences fetched", preferences));
    }

    @PostMapping("/preferences")
    public ResponseEntity<ApiResponse<PaymentPreferenceDto>> createPaymentPreference(
            @RequestParam Long providerId,
            @RequestBody CreatePaymentPreferenceDto dto) {
        log.info("Creating payment preference for providerId: {}", providerId);
        PaymentPreferenceDto preference = preferenceService.createPreference(providerId, dto);
        return ResponseEntity.ok(ApiResponse.success("Preference created", preference));
    }

    @PutMapping("/preferences/{preferenceId}")
    public ResponseEntity<ApiResponse<PaymentPreferenceDto>> updatePaymentPreference(
            @PathVariable Long preferenceId,
            @RequestBody CreatePaymentPreferenceDto dto) {
        log.info("Updating payment preference id: {}", preferenceId);
        PaymentPreferenceDto preference = preferenceService.updatePreference(preferenceId, dto);
        return ResponseEntity.ok(ApiResponse.success("Preference updated", preference));
    }

    @DeleteMapping("/preferences/{preferenceId}")
    public ResponseEntity<ApiResponse<String>> deletePaymentPreference(@PathVariable Long preferenceId) {
        log.info("Deleting payment preference id: {}", preferenceId);
        preferenceService.deletePreference(preferenceId);
        return ResponseEntity.ok(ApiResponse.success("Preference deleted", "Deleted"));
    }

    @GetMapping("/earnings/summary")
    public ResponseEntity<ApiResponse<EarningsSummaryDto>> getEarningsSummary(
            @RequestParam Long providerId) {
        log.info("Fetching earnings summary for providerId: {}", providerId);
        EarningsSummaryDto summary = earningsService.getEarningsSummary(providerId);
        return ResponseEntity.ok(ApiResponse.success("Earnings summary fetched", summary));
    }

    @GetMapping("/earnings/history")
    public ResponseEntity<ApiResponse<Page<EarningsDto>>> getEarningsHistory(
            @RequestParam Long providerId,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Fetching earnings history for providerId: {}", providerId);
        Page<EarningsDto> earnings = earningsService.getEarningsHistory(providerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Earnings history fetched", earnings));
    }

    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<PaymentScheduleDto>> getPaymentSchedule(@RequestParam Long jobId) {
        log.info("Fetching payment schedule for jobId: {}", jobId);
        try {
            var schedule = paymentService.getPaymentSchedule(jobId);
            return ResponseEntity.ok(ApiResponse.success("Payment schedule fetched", mapToScheduleDto(schedule)));
        } catch (RuntimeException e) {
            log.warn("Payment schedule not found for jobId: {}", jobId);
            return ResponseEntity.ok(ApiResponse.success("No payment schedule found", null));
        } catch (Exception e) {
            log.error("Error fetching payment schedule for jobId: {}", jobId, e);
            return ResponseEntity.ok(ApiResponse.success("No payment schedule found", null));
        }
    }

    @PostMapping("/create-link")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPaymentLink(
            @RequestBody Map<String, Object> request) {
        Long jobId = Long.valueOf(request.get("jobId").toString());
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String paymentChannel = request.get("paymentChannel") != null 
            ? request.get("paymentChannel").toString() : "ONLINE";
        
        log.info("Creating payment link for jobId: {}, amount: {}", jobId, amount);
        try {
            // Get customer ID from job
            com.servichaya.job.entity.JobMaster job = paymentService.getJobById(jobId);
            String paymentLink = paymentService.createPaymentLink(jobId, job.getCustomerId(), amount);
            
            // Get transaction code from the created transaction
            com.servichaya.payment.entity.PaymentTransaction transaction = 
                paymentService.getPendingTransactionByJobId(jobId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("paymentLink", paymentLink);
            response.put("transactionCode", transaction != null ? transaction.getTransactionCode() : null);
            response.put("orderId", transaction != null ? transaction.getRazorpayOrderId() : null);
            
            return ResponseEntity.ok(ApiResponse.success("Payment link created", response));
        } catch (Exception e) {
            log.error("Error creating payment link: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to create payment link: " + e.getMessage()));
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<String>> confirmPayment(
            @RequestParam Long jobId,
            @RequestParam String transactionCode,
            @RequestParam(required = false) String razorpayPaymentId,
            @RequestParam(required = false) String razorpayOrderId,
            @RequestParam(required = false) String razorpaySignature) {
        log.info("Confirming payment for jobId: {}, transactionCode: {}", jobId, transactionCode);
        try {
            paymentService.confirmPayment(jobId, transactionCode, razorpayPaymentId, 
                    razorpayOrderId, razorpaySignature, null);
            return ResponseEntity.ok(ApiResponse.success("Payment confirmed successfully", "Payment confirmed"));
        } catch (Exception e) {
            log.error("Error confirming payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to confirm payment: " + e.getMessage()));
        }
    }

    // Payout Endpoints
    @GetMapping("/payout/limits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPayoutLimits(
            @RequestParam Long providerId) {
        log.info("Fetching payout limits for providerId: {}", providerId);
        try {
            BigDecimal minWithdrawal = payoutService.getMinimumWithdrawalAmount();
            BigDecimal maxWithdrawal = payoutService.getMaximumWithdrawalAmount();
            BigDecimal availableBalance = payoutService.getAvailableBalance(providerId);
            
            Map<String, Object> limits = new HashMap<>();
            limits.put("minWithdrawal", minWithdrawal);
            limits.put("maxWithdrawal", maxWithdrawal);
            limits.put("availableBalance", availableBalance);
            
            return ResponseEntity.ok(ApiResponse.success("Payout limits fetched", limits));
        } catch (Exception e) {
            log.error("Error fetching payout limits: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch payout limits: " + e.getMessage()));
        }
    }

    @PostMapping("/payout/request")
    public ResponseEntity<ApiResponse<String>> requestPayout(
            @RequestParam Long providerId,
            @RequestBody Map<String, Object> request) {
        log.info("Processing payout request for providerId: {}", providerId);
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String payoutMethod = request.get("payoutMethod") != null 
                ? request.get("payoutMethod").toString() : "BANK_TRANSFER";
            
            // Validate payout request using business rules
            payoutService.validatePayoutRequest(providerId, amount);
            
            // TODO: Create payout record in database
            // TODO: Process payout via payment gateway
            // TODO: Update provider balance
            // TODO: Send notification to provider
            
            log.info("Payout request validated successfully for providerId: {}, amount: {}", providerId, amount);
            return ResponseEntity.ok(ApiResponse.success("Payout request submitted successfully", 
                "Your payout request has been submitted. Processing time: 24-48 hours"));
        } catch (RuntimeException e) {
            log.warn("Payout validation failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error processing payout request: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to process payout request: " + e.getMessage()));
        }
    }

    private PaymentScheduleDto mapToScheduleDto(com.servichaya.payment.entity.JobPaymentSchedule schedule) {
        return PaymentScheduleDto.builder()
                .id(schedule.getId())
                .jobId(schedule.getJobId())
                .paymentType(schedule.getPaymentType())
                .hourlyRate(schedule.getHourlyRate())
                .estimatedHours(schedule.getEstimatedHours())
                .upfrontPercentage(schedule.getUpfrontPercentage())
                .upfrontAmount(schedule.getUpfrontAmount())
                .finalAmount(schedule.getFinalAmount())
                .totalAmount(schedule.getTotalAmount())
                .upfrontPaid(schedule.getUpfrontPaid())
                .finalPaid(schedule.getFinalPaid())
                .upfrontPaymentDate(schedule.getUpfrontPaymentDate())
                .finalPaymentDate(schedule.getFinalPaymentDate())
                .paymentStatus(schedule.getPaymentStatus())
                .build();
    }
}
