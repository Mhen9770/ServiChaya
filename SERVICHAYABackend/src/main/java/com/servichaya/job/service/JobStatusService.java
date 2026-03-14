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
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
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
    private final JobWorkflowService jobWorkflowService;

    public JobStatusService(
            JobMasterRepository jobRepository,
            @Lazy MatchingService matchingService,
            PaymentService paymentService,
            NotificationService notificationService,
            ActivityLogService activityLogService,
            ServiceProviderProfileRepository providerRepository,
            ConfigService configService,
            BusinessRuleService businessRuleService,
            JobStateMachine stateMachine,
            JobWorkflowService jobWorkflowService) {
        this.jobRepository = jobRepository;
        this.matchingService = matchingService;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.activityLogService = activityLogService;
        this.providerRepository = providerRepository;
        this.configService = configService;
        this.businessRuleService = businessRuleService;
        this.stateMachine = stateMachine;
        this.jobWorkflowService = jobWorkflowService;
    }

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

        // Business Logic: Job should stay in ACCEPTED until payment is done (if required)
        if ("ACCEPTED".equals(job.getStatus())) {
            try {
                var paymentSchedule = paymentService.getPaymentScheduleOptional(jobId);
                if (paymentSchedule.isPresent()) {
                    var schedule = paymentSchedule.get();
                    // If payment type is PARTIAL or FULL, upfront payment must be done
                    if ("PARTIAL".equals(schedule.getPaymentType()) || "FULL".equals(schedule.getPaymentType())) {
                        if (schedule.getUpfrontPaid() == null || !schedule.getUpfrontPaid()) {
                            log.error("Job {} cannot be started. Upfront payment is required but not completed.", jobId);
                            throw new RuntimeException("Cannot start job. Upfront payment is required but not completed. Please complete payment first.");
                        }
                    }
                    // POST_WORK payment type doesn't require upfront payment, so allow transition
                }
            } catch (RuntimeException e) {
                // Re-throw if it's our payment check exception
                throw e;
            } catch (Exception e) {
                log.warn("Could not check payment status for job {}: {}", jobId, e.getMessage());
                // If payment schedule doesn't exist or check fails, allow transition (for backward compatibility)
            }
        }

        String oldStatus = job.getStatus();
        job.setStatus("IN_PROGRESS");
        job.setStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Sync workflow with status change
        try {
            jobWorkflowService.onStatusChanged(jobId, oldStatus, "IN_PROGRESS");
        } catch (Exception e) {
            log.error("Failed to sync workflow for jobId: {} on status change {} -> IN_PROGRESS",
                    jobId, oldStatus, e);
        }

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

        // CRITICAL FIX: Validate final price
        if (finalPrice == null || finalPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Final price must be greater than zero");
        }
        
        // Validate final price is reasonable (not more than 10x estimated budget)
        if (job.getEstimatedBudget() != null && job.getEstimatedBudget().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal maxAllowedPrice = job.getEstimatedBudget().multiply(new BigDecimal("10"));
            if (finalPrice.compareTo(maxAllowedPrice) > 0) {
                log.warn("Final price {} exceeds 10x estimated budget {} for job {}", finalPrice, job.getEstimatedBudget(), jobId);
                throw new RuntimeException(String.format(
                    "Final price (₹%s) exceeds maximum allowed (10x estimated budget: ₹%s). Please contact support if this is correct.",
                    finalPrice, maxAllowedPrice));
            }
        }

        // Validate state transition using state machine
        String oldStatus = job.getStatus();
        stateMachine.validateTransition(oldStatus, "PAYMENT_PENDING");

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

        // Sync workflow with status change to PAYMENT_PENDING
        try {
            jobWorkflowService.onStatusChanged(jobId, oldStatus, "PAYMENT_PENDING");
        } catch (Exception e) {
            log.error("Failed to sync workflow for jobId: {} on status change {} -> PAYMENT_PENDING",
                    jobId, oldStatus, e);
        }

        // Business Logic: Handle payment based on channel
        try {
            if ("CASH".equals(paymentChannel)) {
                // For CASH payment, mark as paid immediately and complete the job
                paymentService.processCashPayment(jobId, job.getCustomerId(), finalPrice);
                log.info("Cash payment processed for job {}", jobId);
                
                // Update job status to COMPLETED after cash payment
                String paymentPendingStatus = job.getStatus();
                job.setStatus("COMPLETED");
                jobRepository.save(job);
                
                // Sync workflow with status change
                try {
                    jobWorkflowService.onStatusChanged(jobId, paymentPendingStatus, "COMPLETED");
                } catch (Exception e) {
                    log.error("Failed to sync workflow for jobId: {} on status change {} -> COMPLETED",
                            jobId, paymentPendingStatus, e);
                }
                
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
        
        // Business Logic: Calculate cancellation fee and refund based on business rules
        BigDecimal cancellationFee = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
        BigDecimal jobAmount = job.getFinalPrice() != null ? job.getFinalPrice() : 
                               (job.getEstimatedBudget() != null ? job.getEstimatedBudget() : BigDecimal.ZERO);
        
        try {
            if (isProvider) {
                // Provider cancellation - penalty on provider (always cancel immediately, no fee from customer)
                if ("ACCEPTED".equals(previousStatus) || "IN_PROGRESS".equals(previousStatus)) {
                    BigDecimal penaltyPercent = businessRuleService.getRuleValueAsBigDecimal(
                        "PROVIDER_CANCELLATION_PENALTY", new BigDecimal("5.00"));
                    // Penalty is on provider earnings, not customer refund
                    // Customer gets 100% refund
                    refundAmount = jobAmount;
                    log.info("Provider cancellation penalty: {}% (applied to provider earnings)", penaltyPercent);
                } else {
                    refundAmount = jobAmount;
                }
                // Provider cancellation - cancel immediately (no payment pending)
                job.setStatus("CANCELLED");
                job.setCancellationFee(BigDecimal.ZERO);
                job.setCancellationRefundAmount(refundAmount);
                job.setCancellationReason(cancelReason);
                jobRepository.save(job);
                
                // Sync workflow with status change
                try {
                    jobWorkflowService.onStatusChanged(jobId, previousStatus, "CANCELLED");
                } catch (Exception e) {
                    log.error("Failed to sync workflow for jobId: {} on status change {} -> CANCELLED",
                            jobId, previousStatus, e);
                }
            } else {
                // Customer cancellation - fee based on job status
                if ("PENDING".equals(previousStatus) || "MATCHED".equals(previousStatus)) {
                    // Before provider accepts - no fee, 100% refund, cancel immediately
                    refundAmount = jobAmount;
                    cancellationFee = BigDecimal.ZERO;
                    job.setStatus("CANCELLED");
                    job.setCancellationFee(BigDecimal.ZERO);
                    job.setCancellationRefundAmount(refundAmount);
                    job.setCancellationReason(cancelReason);
                    jobRepository.save(job);
                    
                    // Sync workflow with status change
                    try {
                        jobWorkflowService.onStatusChanged(jobId, previousStatus, "CANCELLED");
                    } catch (Exception e) {
                        log.error("Failed to sync workflow for jobId: {} on status change {} -> CANCELLED",
                                jobId, previousStatus, e);
                    }
                } else if ("ACCEPTED".equals(previousStatus) || "IN_PROGRESS".equals(previousStatus)) {
                    // After provider accepts - use CANCELLATION_FEE_BEFORE_START
                    BigDecimal feePercent = businessRuleService.getRuleValueAsBigDecimal(
                        "CANCELLATION_FEE_BEFORE_START", BigDecimal.ZERO);
                    
                    if (feePercent.compareTo(BigDecimal.ZERO) > 0) {
                        // Calculate fee as percentage of job amount
                        cancellationFee = jobAmount.multiply(feePercent)
                            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                        
                        // Check if partial payment was made
                        BigDecimal paidAmount = BigDecimal.ZERO;
                        try {
                            var paymentSchedule = paymentService.getPaymentScheduleOptional(jobId);
                            if (paymentSchedule.isPresent()) {
                                var schedule = paymentSchedule.get();
                                if (schedule.getUpfrontPaid() != null && schedule.getUpfrontPaid() && 
                                    schedule.getUpfrontAmount() != null) {
                                    paidAmount = schedule.getUpfrontAmount();
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Could not check payment status for job {}: {}", jobId, e.getMessage());
                        }
                        
                        // Calculate refund: if partial payment made, refund based on configuration
                        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                            // Partial payment made - refund logic
                            // Refund = paidAmount - cancellationFee (if fee < paidAmount), else 0
                            if (cancellationFee.compareTo(paidAmount) <= 0) {
                                refundAmount = paidAmount.subtract(cancellationFee);
                            } else {
                                // Fee exceeds paid amount, no refund
                                refundAmount = BigDecimal.ZERO;
                            }
                        } else {
                            // No payment made - refund = jobAmount - cancellationFee
                            refundAmount = jobAmount.subtract(cancellationFee);
                        }
                        
                        // Set status to CANCELLATION_PAYMENT_PENDING - wait for payment
                        stateMachine.validateTransition(previousStatus, "CANCELLATION_PAYMENT_PENDING");
                        job.setStatus("CANCELLATION_PAYMENT_PENDING");
                        job.setCancellationFee(cancellationFee);
                        job.setCancellationRefundAmount(refundAmount);
                        job.setCancellationReason(cancelReason);
                        jobRepository.save(job);
                        
                        // Sync workflow with status change
                        try {
                            jobWorkflowService.onStatusChanged(jobId, previousStatus, "CANCELLATION_PAYMENT_PENDING");
                        } catch (Exception e) {
                            log.error("Failed to sync workflow for jobId: {} on status change {} -> CANCELLATION_PAYMENT_PENDING",
                                    jobId, previousStatus, e);
                        }
                        
                        log.info("Job {} set to CANCELLATION_PAYMENT_PENDING. Fee: ₹{}, Refund: ₹{}", 
                                jobId, cancellationFee, refundAmount);
                        
                        // Create payment schedule for cancellation fee
                        try {
                            paymentService.createCancellationFeePaymentSchedule(jobId, cancellationFee);
                        } catch (Exception e) {
                            log.error("Failed to create cancellation fee payment schedule: {}", e.getMessage());
                        }
                    } else {
                        // No fee - cancel immediately
                        refundAmount = jobAmount;
                        job.setStatus("CANCELLED");
                        job.setCancellationFee(BigDecimal.ZERO);
                        job.setCancellationRefundAmount(refundAmount);
                        job.setCancellationReason(cancelReason);
                        jobRepository.save(job);
                        
                        // Sync workflow with status change
                        try {
                            jobWorkflowService.onStatusChanged(jobId, previousStatus, "CANCELLED");
                        } catch (Exception e) {
                            log.error("Failed to sync workflow for jobId: {} on status change {} -> CANCELLED",
                                    jobId, previousStatus, e);
                        }
                        
                        log.info("No cancellation fee (CANCELLATION_FEE_BEFORE_START is 0). Job cancelled immediately.");
                    }
                }
            }
            
            log.info("Cancellation calculated - Fee: ₹{}, Refund: ₹{}", cancellationFee, refundAmount);
        } catch (Exception e) {
            log.warn("Cancellation fee calculation failed: {}", e.getMessage());
            // Fallback: Full refund if calculation fails
            refundAmount = jobAmount;
            cancellationFee = BigDecimal.ZERO;
            job.setStatus("CANCELLED");
            job.setCancellationFee(BigDecimal.ZERO);
            job.setCancellationRefundAmount(refundAmount);
            job.setCancellationReason(cancelReason);
            jobRepository.save(job);
            
            // Sync workflow with status change
            try {
                jobWorkflowService.onStatusChanged(jobId, previousStatus, "CANCELLED");
            } catch (Exception workflowEx) {
                log.error("Failed to sync workflow for jobId: {} on status change {} -> CANCELLED",
                        jobId, previousStatus, workflowEx);
            }
        }

        // Only process reassignment, logging, and notifications if job is actually cancelled
        // (not in CANCELLATION_PAYMENT_PENDING status)
        if ("CANCELLED".equals(job.getStatus())) {
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
        } else if ("CANCELLATION_PAYMENT_PENDING".equals(job.getStatus())) {
            // Notify customer about cancellation fee payment required
            notificationService.createNotification(
                    job.getCustomerId(), "CUSTOMER", "CANCELLATION_FEE_PENDING",
                    "Cancellation Fee Payment Required",
                    String.format("Please pay cancellation fee of ₹%s to complete cancellation of job: %s", 
                            cancellationFee, job.getTitle()),
                    "PAYMENT", jobId,
                    String.format("/customer/jobs/%d", jobId),
                    Map.of("jobCode", job.getJobCode(), "cancellationFee", cancellationFee.toString()));
            
            log.info("Job {} set to CANCELLATION_PAYMENT_PENDING. Waiting for fee payment.", jobId);
        }
    }

    /**
     * Complete cancellation after cancellation fee payment is done
     */
    @Transactional
    public void completeCancellation(Long jobId) {
        log.info("Completing cancellation for jobId: {} after fee payment", jobId);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        if (!"CANCELLATION_PAYMENT_PENDING".equals(job.getStatus())) {
            log.error("Job {} is not in CANCELLATION_PAYMENT_PENDING status. Current status: {}", 
                    jobId, job.getStatus());
            throw new RuntimeException("Job is not awaiting cancellation fee payment");
        }

        String previousStatus = job.getStatus();
        
        // Validate transition
        stateMachine.validateTransition(previousStatus, "CANCELLED");
        
        // Actually cancel the job
        job.setStatus("CANCELLED");
        jobRepository.save(job);
        
        // Sync workflow with status change
        try {
            jobWorkflowService.onStatusChanged(jobId, previousStatus, "CANCELLED");
        } catch (Exception e) {
            log.error("Failed to sync workflow for jobId: {} on status change {} -> CANCELLED",
                    jobId, previousStatus, e);
        }

        // Process refund if applicable
        BigDecimal refundAmount = job.getCancellationRefundAmount() != null ? 
                job.getCancellationRefundAmount() : BigDecimal.ZERO;
        
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            // TODO: Process actual refund transaction
            log.info("Refund amount calculated: ₹{} for job {}", refundAmount, jobId);
        }

        // Business Logic: Log activity
        activityLogService.logCustomerActivity(job.getCustomerId(), "JOB_CANCELLED",
                Map.of("jobId", jobId, "jobCode", job.getJobCode(), 
                       "reason", job.getCancellationReason() != null ? job.getCancellationReason() : "Customer cancelled",
                       "cancellationFee", job.getCancellationFee() != null ? job.getCancellationFee().toString() : "0"),
                null, null, null, null);

        // Business Logic: Notify provider
        if (job.getProviderId() != null) {
            notificationService.createNotification(
                    job.getProviderId(), "PROVIDER", "JOB_CANCELLED",
                    "Job Cancelled by Customer",
                    String.format("Customer has cancelled job: %s. Reason: %s", 
                            job.getTitle(), 
                            job.getCancellationReason() != null ? job.getCancellationReason() : "Customer cancelled"),
                    "JOB", jobId, String.format("/provider/jobs/%d", jobId),
                    Map.of("jobCode", job.getJobCode()));
        }

        log.info("Job {} cancelled successfully after fee payment", jobId);
    }

    /**
     * Get cancellation fee estimate without actually cancelling the job
     */
    public Map<String, Object> getCancellationFeeEstimate(Long jobId, Long userId, boolean isProvider) {
        log.info("Calculating cancellation fee estimate for jobId: {} by userId: {}, isProvider: {}", 
                jobId, userId, isProvider);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        // Validate authorization
        if (isProvider) {
            ServiceProviderProfile providerProfile = providerRepository.findByUserId(userId)
                    .orElse(null);
            if (providerProfile == null || job.getProviderId() == null || 
                !job.getProviderId().equals(providerProfile.getId())) {
                throw new RuntimeException("Unauthorized");
            }
        } else {
            if (!job.getCustomerId().equals(userId)) {
                throw new RuntimeException("Unauthorized");
            }
        }

        List<String> cancellableStatuses = Arrays.asList("PENDING", "MATCHED", "ACCEPTED", "IN_PROGRESS");
        if (!cancellableStatuses.contains(job.getStatus())) {
            throw new RuntimeException("Job cannot be cancelled in current state");
        }

        String currentStatus = job.getStatus();
        BigDecimal cancellationFee = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
        BigDecimal jobAmount = job.getFinalPrice() != null ? job.getFinalPrice() : 
                               (job.getEstimatedBudget() != null ? job.getEstimatedBudget() : BigDecimal.ZERO);
        
        try {
            if (isProvider) {
                // Provider cancellation - penalty on provider
                if ("ACCEPTED".equals(currentStatus) || "IN_PROGRESS".equals(currentStatus)) {
                    // Customer gets 100% refund
                    refundAmount = jobAmount;
                    cancellationFee = BigDecimal.ZERO;
                } else {
                    refundAmount = jobAmount;
                    cancellationFee = BigDecimal.ZERO;
                }
            } else {
                // Customer cancellation - fee based on job status
                if ("PENDING".equals(currentStatus) || "MATCHED".equals(currentStatus)) {
                    // Before provider accepts - no fee, 100% refund
                    refundAmount = jobAmount;
                    cancellationFee = BigDecimal.ZERO;
                } else if ("ACCEPTED".equals(currentStatus) || "IN_PROGRESS".equals(currentStatus)) {
                    // After provider accepts - use CANCELLATION_FEE_BEFORE_START (percentage)
                    BigDecimal feePercent = businessRuleService.getRuleValueAsBigDecimal(
                        "CANCELLATION_FEE_BEFORE_START", BigDecimal.ZERO);
                    
                    if (feePercent.compareTo(BigDecimal.ZERO) > 0) {
                        // Calculate fee as percentage of job amount
                        cancellationFee = jobAmount.multiply(feePercent)
                            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                        
                        // Check if partial payment was made
                        BigDecimal paidAmount = BigDecimal.ZERO;
                        try {
                            var paymentSchedule = paymentService.getPaymentScheduleOptional(jobId);
                            if (paymentSchedule.isPresent()) {
                                var schedule = paymentSchedule.get();
                                if (schedule.getUpfrontPaid() != null && schedule.getUpfrontPaid() && 
                                    schedule.getUpfrontAmount() != null) {
                                    paidAmount = schedule.getUpfrontAmount();
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Could not check payment status for job {}: {}", jobId, e.getMessage());
                        }
                        
                        // Calculate refund: if partial payment made, refund based on configuration
                        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                            // Partial payment made - refund = paidAmount - cancellationFee (if fee < paidAmount)
                            if (cancellationFee.compareTo(paidAmount) <= 0) {
                                refundAmount = paidAmount.subtract(cancellationFee);
                            } else {
                                // Fee exceeds paid amount, no refund
                                refundAmount = BigDecimal.ZERO;
                            }
                        } else {
                            // No payment made - refund = jobAmount - cancellationFee
                            refundAmount = jobAmount.subtract(cancellationFee);
                        }
                    } else {
                        // No fee - full refund
                        cancellationFee = BigDecimal.ZERO;
                        refundAmount = jobAmount;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Cancellation fee calculation failed: {}", e.getMessage());
            // Fallback: Full refund if calculation fails
            refundAmount = jobAmount;
            cancellationFee = BigDecimal.ZERO;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("cancellationFee", cancellationFee);
        result.put("refundAmount", refundAmount);
        result.put("jobAmount", jobAmount);
        result.put("canCancel", true);
        
        return result;
    }

    private void reassignJob(Long jobId, Long cancelledProviderId) {
        log.info("Reassigning jobId: {} after cancellation by providerId: {}", jobId, cancelledProviderId);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        job.setStatus("PENDING");
        job.setProviderId(null);
        job.setAcceptedAt(null);
        jobRepository.save(job);

        // Sync workflow with status change
        try {
            jobWorkflowService.onStatusChanged(jobId, "CANCELLED", "PENDING");
        } catch (Exception e) {
            log.error("Failed to sync workflow for jobId: {} on status change CANCELLED -> PENDING",
                    jobId, e);
        }

        // Re-match job if AUTO_MATCHING_FEATURE is enabled
        try {
            if (configService.isAutoMatchingEnabled()) {
                log.info("AUTO_MATCHING_FEATURE enabled. Triggering re-matching for reassigned jobId: {}", jobId);
                matchingService.matchJobToProviders(jobId);
            } else {
                log.info("AUTO_MATCHING_FEATURE disabled. Skipping re-matching for jobId: {}. Admin can manually assign.", jobId);
                // Notify customer that admin will assign manually
                try {
                    notificationService.createNotification(
                            job.getCustomerId(), "CUSTOMER", "JOB_PENDING_MANUAL_ASSIGNMENT",
                            "Job Reassigned - Manual Assignment",
                            String.format("Your job '%s' has been reassigned. Our team will assign a provider shortly.", job.getTitle()),
                            "JOB", jobId,
                            String.format("/customer/jobs/%d", jobId),
                            Map.of("jobCode", job.getJobCode())
                    );
                } catch (Exception e) {
                    log.error("Failed to send manual assignment notification", e);
                }
            }
        } catch (Exception e) {
            log.error("Error checking AUTO_MATCHING_FEATURE or triggering re-matching for jobId: {}", jobId, e);
        }

        log.info("Job {} reassigned successfully", jobId);
    }
}
