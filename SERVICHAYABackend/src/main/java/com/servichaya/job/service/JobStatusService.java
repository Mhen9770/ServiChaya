package com.servichaya.job.service;

import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.matching.service.MatchingService;
import com.servichaya.payment.entity.ProviderPaymentPreference;
import com.servichaya.payment.service.PaymentService;
import com.servichaya.notification.service.NotificationService;
import com.servichaya.kundali.service.ActivityLogService;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.common.service.ConfigService;
import com.servichaya.config.service.BusinessRuleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobStatusService {

    private final JobMasterRepository jobRepository;
    private final MatchingService matchingService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;
    private final ServiceProviderProfileRepository providerRepository;
    private final ConfigService configService;
    private final BusinessRuleService businessRuleService;
    private final JobStateMachine stateMachine;

    @Transactional
    public void startJob(Long jobId, Long userId) {
        log.info("Starting jobId: {} by userId: {}", jobId, userId);

        // Convert userId to provider profile ID
        ServiceProviderProfile providerProfile = providerRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("Provider profile not found for userId: {}", userId);
                    return new RuntimeException("Provider profile not found");
                });
        Long providerProfileId = providerProfile.getId();

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        // Compare with provider profile ID (job stores provider profile ID, not user_id)
        if (!job.getProviderId().equals(providerProfileId)) {
            log.error("Provider {} (profileId: {}) attempted to start job {} belonging to provider {}", 
                    userId, providerProfileId, jobId, job.getProviderId());
            throw new RuntimeException("Unauthorized");
        }

        // Validate state transition using state machine
        stateMachine.validateTransition(job.getStatus(), "IN_PROGRESS");

        job.setStatus("IN_PROGRESS");
        job.setStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Business Logic: Log activity
        activityLogService.logProviderActivity(userId, "JOB_STARTED", 
                Map.of("jobId", jobId, "jobCode", job.getJobCode()), null, null, null, null);

        // Business Logic: Notify customer
        notificationService.createNotification(
                job.getCustomerId(), "CUSTOMER", "JOB_STARTED",
                "Service Started", 
                String.format("Provider has started working on your job: %s", job.getTitle()),
                "JOB", jobId, 
                String.format("/customer/jobs/%d", jobId),
                Map.of("jobCode", job.getJobCode()));

        log.info("Job {} started successfully", jobId);
    }

    @Transactional
    public void completeJob(Long jobId, Long userId, BigDecimal finalPrice, String paymentChannel) {
        log.info("Completing jobId: {} by userId: {} with finalPrice: {}, paymentChannel: {}", 
                jobId, userId, finalPrice, paymentChannel);

        // Validate payment channel
        if (paymentChannel == null || (!paymentChannel.equals("CASH") && !paymentChannel.equals("ONLINE"))) {
            throw new RuntimeException("Invalid payment channel. Must be CASH or ONLINE");
        }

        // Convert userId to provider profile ID
        ServiceProviderProfile providerProfile = providerRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("Provider profile not found for userId: {}", userId);
                    return new RuntimeException("Provider profile not found");
                });
        Long providerProfileId = providerProfile.getId();

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        // Validate job duration (from business rule)
        if (job.getStartedAt() != null) {
            Integer maxDurationHours = configService.getMaxJobDurationHours();
            long durationHours = java.time.Duration.between(job.getStartedAt(), LocalDateTime.now()).toHours();
            if (durationHours > maxDurationHours) {
                log.warn("Job {} duration ({}) exceeds maximum allowed duration ({} hours)", 
                        jobId, durationHours, maxDurationHours);
                throw new RuntimeException(String.format(
                        "Job duration (%d hours) exceeds maximum allowed duration (%d hours). Please contact support.", 
                        durationHours, maxDurationHours));
            }
        }

        // Compare with provider profile ID (job stores provider profile ID, not user_id)
        if (!job.getProviderId().equals(providerProfileId)) {
            log.error("Provider {} (profileId: {}) attempted to complete job {} belonging to provider {}", 
                    userId, providerProfileId, jobId, job.getProviderId());
            throw new RuntimeException("Unauthorized");
        }

        // Validate state transition using state machine
        stateMachine.validateTransition(job.getStatus(), "PAYMENT_PENDING");

        // Set job to PAYMENT_PENDING instead of COMPLETED
        job.setStatus("PAYMENT_PENDING");
        job.setFinalPrice(finalPrice);
        job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Business Logic: Create/Update payment schedule for POST_WORK payment
        try {
            // Check if payment schedule already exists
            com.servichaya.payment.entity.JobPaymentSchedule existingSchedule = null;
            try {
                existingSchedule = paymentService.getPaymentSchedule(jobId);
            } catch (Exception e) {
                log.debug("No existing payment schedule found, will create new one");
            }
            
            if (existingSchedule == null) {
                // Create new payment schedule for POST_WORK (after completion)
                ProviderPaymentPreference preference = paymentService.getProviderPaymentPreference(
                        providerProfileId, job.getServiceCategoryId());
                
                paymentService.createPaymentSchedule(jobId, "POST_WORK", finalPrice, 
                        preference != null ? preference.getHourlyRate() : null, null, null);
                log.info("Payment schedule created for POST_WORK payment");
            } else {
                // Update existing schedule with final price
                existingSchedule.setTotalAmount(finalPrice);
                // For POST_WORK, final amount equals total amount
                if ("POST_WORK".equals(existingSchedule.getPaymentType())) {
                    existingSchedule.setFinalAmount(finalPrice);
                } else {
                    // For PARTIAL/FULL, adjust final amount if needed
                    BigDecimal upfrontAmount = existingSchedule.getUpfrontAmount() != null 
                        ? existingSchedule.getUpfrontAmount() : BigDecimal.ZERO;
                    existingSchedule.setFinalAmount(finalPrice.subtract(upfrontAmount));
                }
                existingSchedule.setPaymentStatus("PENDING");
                // Save the updated schedule
                paymentService.updatePaymentSchedule(existingSchedule);
                log.info("Payment schedule updated with final price: {}", finalPrice);
            }
        } catch (Exception e) {
            log.warn("Could not create/update payment schedule: {}", e.getMessage());
        }

        // Business Logic: Handle payment based on channel
        try {
            if ("CASH".equals(paymentChannel)) {
                // For CASH payment, mark as paid immediately and complete the job
                paymentService.processCashPayment(jobId, job.getCustomerId(), finalPrice);
                log.info("Cash payment processed for job {}", jobId);
                
                // Update job status to COMPLETED after cash payment
                job.setStatus("COMPLETED");
                jobRepository.save(job);
                
                // Calculate earnings for cash payment
                try {
                    paymentService.calculateAndCreateEarnings(jobId, providerProfileId, finalPrice);
                    log.info("Earnings calculated for provider {}", providerProfileId);
                } catch (Exception e) {
                    log.error("Failed to calculate earnings: {}", e.getMessage());
                }
            } else if ("ONLINE".equals(paymentChannel)) {
                // For ONLINE payment, create payment link and notify customer
                String paymentLink = paymentService.createPaymentLink(jobId, job.getCustomerId(), finalPrice);
                log.info("Payment link created for job {}: {}", jobId, paymentLink);
                
                // Notify customer with payment link
                notificationService.createNotification(
                        job.getCustomerId(), "CUSTOMER", "PAYMENT_PENDING",
                        "Payment Required",
                        String.format("Please complete payment of ₹%s for job: %s", finalPrice, job.getTitle()),
                        "PAYMENT", jobId,
                        String.format("/customer/jobs/%d/payment", jobId),
                        Map.of("amount", finalPrice.toString(), "paymentLink", paymentLink, "jobCode", job.getJobCode()));
            }
        } catch (Exception e) {
            log.error("Failed to process payment: {}", e.getMessage());
            throw new RuntimeException("Failed to process payment: " + e.getMessage());
        }

        // Business Logic: Update provider stats
        try {
            if (providerProfile != null) {
                providerProfile.setTotalJobsCompleted(
                        (providerProfile.getTotalJobsCompleted() != null ? providerProfile.getTotalJobsCompleted() : 0) + 1);
                providerRepository.save(providerProfile);
            }
        } catch (Exception e) {
            log.warn("Could not update provider stats: {}", e.getMessage());
        }

        // Business Logic: Log activity
        activityLogService.logProviderActivity(userId, "JOB_COMPLETED",
                Map.of("jobId", jobId, "jobCode", job.getJobCode(), "finalPrice", finalPrice),
                null, null, null, null);

        // Business Logic: Notify customer - job completed, payment due
        notificationService.createNotification(
                job.getCustomerId(), "CUSTOMER", "JOB_COMPLETED",
                "Service Completed",
                String.format("Your job %s has been completed. Final amount: ₹%s", job.getTitle(), finalPrice),
                "JOB", jobId,
                String.format("/customer/jobs/%d", jobId),
                Map.of("jobCode", job.getJobCode(), "finalPrice", finalPrice.toString()));

        log.info("Job {} completed successfully with finalPrice: {}", jobId, finalPrice);
    }

    @Transactional
    public void cancelJob(Long jobId, Long userId, String cancelReason, boolean isProvider) {
        log.info("Cancelling jobId: {} by userId: {}, isProvider: {}, reason: {}", 
                jobId, userId, isProvider, cancelReason);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        if (isProvider) {
            // Convert userId to provider profile ID for comparison
            ServiceProviderProfile providerProfile = providerRepository.findByUserId(userId)
                    .orElse(null);
            if (providerProfile == null) {
                log.error("Provider profile not found for userId: {}", userId);
                throw new RuntimeException("Provider profile not found");
            }
            Long providerProfileId = providerProfile.getId();
            
            // Compare with provider profile ID (job stores provider profile ID, not user_id)
            if (job.getProviderId() == null || !job.getProviderId().equals(providerProfileId)) {
                log.error("Provider {} (profileId: {}) attempted to cancel job {} not assigned to them", 
                        userId, providerProfileId, jobId);
                throw new RuntimeException("Unauthorized");
            }
        } else {
            if (!job.getCustomerId().equals(userId)) {
                log.error("Customer {} attempted to cancel job {} not belonging to them", userId, jobId);
                throw new RuntimeException("Unauthorized");
            }
        }

        List<String> cancellableStatuses = Arrays.asList("PENDING", "MATCHED", "ACCEPTED", "IN_PROGRESS");
        if (!cancellableStatuses.contains(job.getStatus())) {
            log.error("Job {} cannot be cancelled in status: {}", jobId, job.getStatus());
            throw new RuntimeException("Job cannot be cancelled in current state");
        }

        String previousStatus = job.getStatus();
        job.setStatus("CANCELLED");
        jobRepository.save(job);

        // Business Logic: Calculate cancellation fee and refund based on business rules
        BigDecimal cancellationFee = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
        BigDecimal jobAmount = job.getFinalPrice() != null ? job.getFinalPrice() : 
                               (job.getEstimatedBudget() != null ? job.getEstimatedBudget() : BigDecimal.ZERO);
        
        try {
            if (isProvider) {
                // Provider cancellation - penalty on provider
                if ("ACCEPTED".equals(previousStatus) || "IN_PROGRESS".equals(previousStatus)) {
                    BigDecimal penaltyPercent = businessRuleService.getRuleValueAsBigDecimal(
                        "PROVIDER_CANCELLATION_PENALTY", new BigDecimal("5.00"));
                    // Penalty is on provider earnings, not customer refund
                    // Customer gets 100% refund
                    refundAmount = jobAmount;
                    log.info("Provider cancellation penalty: {}% (applied to provider earnings)", penaltyPercent);
                }
            } else {
                // Customer cancellation - fee based on job status
                if ("PENDING".equals(previousStatus) || "MATCHED".equals(previousStatus)) {
                    // Before provider accepts - no fee, 100% refund
                    refundAmount = jobAmount;
                    cancellationFee = BigDecimal.ZERO;
                } else if ("ACCEPTED".equals(previousStatus)) {
                    // After provider accepts but before start - 10% fee (min ₹50)
                    BigDecimal feePercent = businessRuleService.getRuleValueAsBigDecimal(
                        "CANCELLATION_FEE_BEFORE_START", new BigDecimal("10.00"));
                    cancellationFee = jobAmount.multiply(feePercent)
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    BigDecimal minFee = new BigDecimal("50.00");
                    if (cancellationFee.compareTo(minFee) < 0) {
                        cancellationFee = minFee;
                    }
                    refundAmount = jobAmount.subtract(cancellationFee);
                    log.info("Customer cancellation fee (before start): {}% = ₹{}", feePercent, cancellationFee);
                } else if ("IN_PROGRESS".equals(previousStatus)) {
                    // After provider started - 20% fee (min ₹100)
                    BigDecimal feePercent = businessRuleService.getRuleValueAsBigDecimal(
                        "CANCELLATION_FEE_AFTER_START", new BigDecimal("20.00"));
                    cancellationFee = jobAmount.multiply(feePercent)
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    BigDecimal minFee = new BigDecimal("100.00");
                    if (cancellationFee.compareTo(minFee) < 0) {
                        cancellationFee = minFee;
                    }
                    refundAmount = jobAmount.subtract(cancellationFee);
                    log.info("Customer cancellation fee (after start): {}% = ₹{}", feePercent, cancellationFee);
                }
            }
            
            // TODO: Process actual refund transaction
            log.info("Cancellation calculated - Fee: ₹{}, Refund: ₹{}", cancellationFee, refundAmount);
        } catch (Exception e) {
            log.warn("Cancellation fee calculation failed: {}", e.getMessage());
            // Fallback: Full refund if calculation fails
            refundAmount = jobAmount;
        }

        // Business Logic: Reassign if provider cancelled after acceptance
        if (isProvider && ("ACCEPTED".equals(previousStatus) || "IN_PROGRESS".equals(previousStatus))) {
            log.info("Provider cancelled job. Attempting reassignment for jobId: {}", jobId);
            try {
                reassignJob(jobId, userId);
            } catch (Exception e) {
                log.error("Failed to reassign job {}: {}", jobId, e.getMessage());
            }
        }

        // Business Logic: Log activity
        if (isProvider) {
            activityLogService.logProviderActivity(userId, "JOB_CANCELLED",
                    Map.of("jobId", jobId, "jobCode", job.getJobCode(), "reason", cancelReason),
                    null, null, null, null);
        } else {
            activityLogService.logCustomerActivity(userId, "JOB_CANCELLED",
                    Map.of("jobId", jobId, "jobCode", job.getJobCode(), "reason", cancelReason),
                    null, null, null, null);
        }

        // Business Logic: Notify opposite party
        if (isProvider) {
            notificationService.createNotification(
                    job.getCustomerId(), "CUSTOMER", "JOB_CANCELLED",
                    "Job Cancelled by Provider",
                    String.format("Provider has cancelled job: %s. Reason: %s", job.getTitle(), cancelReason),
                    "JOB", jobId, String.format("/customer/jobs/%d", jobId),
                    Map.of("jobCode", job.getJobCode()));
        } else {
            if (job.getProviderId() != null) {
                notificationService.createNotification(
                        job.getProviderId(), "PROVIDER", "JOB_CANCELLED",
                        "Job Cancelled by Customer",
                        String.format("Customer has cancelled job: %s. Reason: %s", job.getTitle(), cancelReason),
                        "JOB", jobId, String.format("/provider/jobs/%d", jobId),
                        Map.of("jobCode", job.getJobCode()));
            }
        }

        log.info("Job {} cancelled successfully", jobId);
    }

    private void reassignJob(Long jobId, Long cancelledProviderId) {
        log.info("Reassigning jobId: {} after cancellation by providerId: {}", jobId, cancelledProviderId);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        job.setStatus("PENDING");
        job.setProviderId(null);
        job.setAcceptedAt(null);
        jobRepository.save(job);

        matchingService.matchJobToProviders(jobId);

        log.info("Job {} reassigned successfully", jobId);
    }
}
