package com.servichaya.payment.service;

import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.payment.entity.*;
import com.servichaya.payment.repository.*;
import com.servichaya.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final JobPaymentScheduleRepository paymentScheduleRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ProviderEarningsRepository earningsRepository;
    private final ProviderCommissionOverrideRepository commissionOverrideRepository;
    private final ProviderPaymentPreferenceRepository paymentPreferenceRepository;
    private final JobMasterRepository jobRepository;
    private final CommissionService commissionService;
    private final NotificationService notificationService;

    @Transactional
    public JobPaymentSchedule createPaymentSchedule(Long jobId, String paymentType, 
                                                    BigDecimal totalAmount, BigDecimal hourlyRate, 
                                                    BigDecimal estimatedHours, BigDecimal upfrontPercentage) {
        log.info("Creating payment schedule for jobId: {}, paymentType: {}, totalAmount: {}", 
                jobId, paymentType, totalAmount);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        JobPaymentSchedule schedule = JobPaymentSchedule.builder()
                .jobId(jobId)
                .paymentType(paymentType)
                .totalAmount(totalAmount)
                .hourlyRate(hourlyRate)
                .estimatedHours(estimatedHours)
                .upfrontPercentage(upfrontPercentage)
                .build();

        if ("PARTIAL".equals(paymentType)) {
            BigDecimal upfront = totalAmount.multiply(upfrontPercentage)
                    .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
            schedule.setUpfrontAmount(upfront);
            schedule.setFinalAmount(totalAmount.subtract(upfront));
        } else if ("FULL".equals(paymentType)) {
            schedule.setUpfrontAmount(totalAmount);
            schedule.setFinalAmount(BigDecimal.ZERO);
        } else {
            schedule.setUpfrontAmount(BigDecimal.ZERO);
            schedule.setFinalAmount(totalAmount);
        }

        schedule.setPaymentStatus("PENDING");
        return paymentScheduleRepository.save(schedule);
    }

    @Transactional
    public PaymentTransaction processPayment(Long jobId, Long userId, BigDecimal amount, 
                                              String paymentMethod, String razorpayOrderId, 
                                              String razorpayPaymentId, String razorpaySignature) {
        log.info("Processing payment for jobId: {}, userId: {}, amount: {}", jobId, userId, amount);

        JobPaymentSchedule schedule = paymentScheduleRepository.findByJobId(jobId)
                .orElseThrow(() -> {
                    log.error("Payment schedule not found for jobId: {}", jobId);
                    return new RuntimeException("Payment schedule not found");
                });

        String transactionCode = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionCode(transactionCode)
                .jobId(jobId)
                .userId(userId)
                .transactionType("PAYMENT")
                .amount(amount)
                .paymentMethod(paymentMethod)
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(razorpayPaymentId)
                .razorpaySignature(razorpaySignature)
                .status("SUCCESS")
                .completedAt(LocalDateTime.now())
                .build();

        transaction = paymentTransactionRepository.save(transaction);

        if (schedule.getUpfrontAmount().compareTo(BigDecimal.ZERO) > 0 && !schedule.getUpfrontPaid()) {
            schedule.setUpfrontPaid(true);
            schedule.setUpfrontPaymentDate(LocalDateTime.now());
            if (schedule.getFinalAmount().compareTo(BigDecimal.ZERO) == 0) {
                schedule.setPaymentStatus("COMPLETED");
            } else {
                schedule.setPaymentStatus("PARTIAL");
            }
        } else if (schedule.getFinalAmount().compareTo(BigDecimal.ZERO) > 0 && !schedule.getFinalPaid()) {
            schedule.setFinalPaid(true);
            schedule.setFinalPaymentDate(LocalDateTime.now());
            schedule.setPaymentStatus("COMPLETED");
        }

        paymentScheduleRepository.save(schedule);
        log.info("Payment processed successfully. TransactionCode: {}", transactionCode);

        // Business Logic: If final payment completed, trigger earnings calculation
        if (schedule.getPaymentStatus().equals("COMPLETED") && schedule.getFinalPaid()) {
            try {
                JobMaster job = jobRepository.findById(jobId)
                        .orElseThrow(() -> new RuntimeException("Job not found"));
                
                if (job.getProviderId() != null && job.getFinalPrice() != null) {
                    // Only calculate if not already calculated
                    if (!earningsRepository.findByJobId(jobId).isPresent()) {
                        calculateAndCreateEarnings(jobId, job.getProviderId(), job.getFinalPrice());
                        log.info("Earnings calculated after final payment");
                    }
                }
            } catch (Exception e) {
                log.warn("Could not calculate earnings after payment: {}", e.getMessage());
            }
        }

        // Business Logic: Send notification
        try {
            JobMaster job = jobRepository.findById(jobId).orElse(null);
            if (job != null) {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("amount", amount.toString());
                metadata.put("transactionCode", transactionCode);
                
                notificationService.createNotification(
                        userId, "CUSTOMER", "PAYMENT_SUCCESS",
                        "Payment Successful",
                        String.format("Payment of ₹%s processed successfully for job: %s", amount, job.getTitle()),
                        "PAYMENT", jobId,
                        String.format("/customer/jobs/%d", jobId),
                        metadata);
            }
        } catch (Exception e) {
            log.warn("Could not send payment notification: {}", e.getMessage());
        }

        return transaction;
    }

    @Transactional
    public ProviderEarnings calculateAndCreateEarnings(Long jobId, Long providerId, BigDecimal jobAmount) {
        log.info("Calculating earnings for jobId: {}, providerId: {}, jobAmount: {}", 
                jobId, providerId, jobAmount);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        BigDecimal commissionPercentage = commissionService.getCommissionRate(
                providerId, job.getServiceCategoryId());

        BigDecimal commissionAmount = jobAmount.multiply(commissionPercentage)
                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);

        BigDecimal netEarnings = jobAmount.subtract(commissionAmount);

        ProviderEarnings earnings = ProviderEarnings.builder()
                .providerId(providerId)
                .jobId(jobId)
                .jobAmount(jobAmount)
                .commissionPercentage(commissionPercentage)
                .commissionAmount(commissionAmount)
                .netEarnings(netEarnings)
                .payoutStatus("PENDING")
                .build();

        earnings = earningsRepository.save(earnings);
        log.info("Earnings created. EarningsId: {}, NetEarnings: {}", earnings.getId(), netEarnings);

        return earnings;
    }

    public ProviderPaymentPreference getProviderPaymentPreference(Long providerId, Long serviceCategoryId) {
        log.info("Getting payment preference for providerId: {}, serviceCategoryId: {}", 
                providerId, serviceCategoryId);

        if (serviceCategoryId != null) {
            return paymentPreferenceRepository.findByProviderIdAndServiceCategoryId(providerId, serviceCategoryId)
                    .orElseGet(() -> paymentPreferenceRepository.findDefaultByProviderId(providerId)
                            .orElse(null));
        }

        return paymentPreferenceRepository.findDefaultByProviderId(providerId).orElse(null);
    }

    public JobPaymentSchedule getPaymentSchedule(Long jobId) {
        log.info("Getting payment schedule for jobId: {}", jobId);
        return paymentScheduleRepository.findByJobId(jobId)
                .orElseThrow(() -> {
                    log.error("Payment schedule not found for jobId: {}", jobId);
                    return new RuntimeException("Payment schedule not found");
                });
    }
}
