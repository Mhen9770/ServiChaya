package com.servichaya.payment.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.payment.dto.*;
import com.servichaya.payment.service.EarningsService;
import com.servichaya.payment.service.PaymentPreferenceService;
import com.servichaya.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentPreferenceService preferenceService;
    private final EarningsService earningsService;

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
