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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
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

    @Transactional
    public void startJob(Long jobId, Long providerId) {
        log.info("Starting jobId: {} by providerId: {}", jobId, providerId);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        if (!job.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to start job {} belonging to provider {}", 
                    providerId, jobId, job.getProviderId());
            throw new RuntimeException("Unauthorized");
        }

        if (!"ACCEPTED".equals(job.getStatus())) {
            log.error("Job {} is not in ACCEPTED state. Current status: {}", jobId, job.getStatus());
            throw new RuntimeException("Job cannot be started in current state");
        }

        job.setStatus("IN_PROGRESS");
        job.setStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Business Logic: Log activity
        activityLogService.logProviderActivity(providerId, "JOB_STARTED", 
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
    public void completeJob(Long jobId, Long providerId, BigDecimal finalPrice) {
        log.info("Completing jobId: {} by providerId: {} with finalPrice: {}", jobId, providerId, finalPrice);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        if (!job.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to complete job {} belonging to provider {}", 
                    providerId, jobId, job.getProviderId());
            throw new RuntimeException("Unauthorized");
        }

        if (!"IN_PROGRESS".equals(job.getStatus())) {
            log.error("Job {} is not in IN_PROGRESS state. Current status: {}", jobId, job.getStatus());
            throw new RuntimeException("Job cannot be completed in current state");
        }

        job.setStatus("COMPLETED");
        job.setFinalPrice(finalPrice);
        job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Business Logic: Create payment schedule if not exists (for POST_WORK payment)
        try {
            ProviderPaymentPreference preference = paymentService.getProviderPaymentPreference(
                    providerId, job.getServiceCategoryId());
            
            if (preference != null && "POST_WORK".equals(preference.getPaymentType())) {
                paymentService.createPaymentSchedule(jobId, "POST_WORK", finalPrice, 
                        preference.getHourlyRate(), null, null);
                log.info("Payment schedule created for POST_WORK payment");
            }
        } catch (Exception e) {
            log.warn("Could not create payment schedule: {}", e.getMessage());
        }

        // Business Logic: Calculate and create earnings
        try {
            paymentService.calculateAndCreateEarnings(jobId, providerId, finalPrice);
            log.info("Earnings calculated for provider {}", providerId);
        } catch (Exception e) {
            log.error("Failed to calculate earnings: {}", e.getMessage());
        }

        // Business Logic: Update provider stats
        try {
            ServiceProviderProfile provider = providerRepository.findByUserId(providerId)
                    .orElse(null);
            if (provider != null) {
                provider.setTotalJobsCompleted(
                        (provider.getTotalJobsCompleted() != null ? provider.getTotalJobsCompleted() : 0) + 1);
                providerRepository.save(provider);
            }
        } catch (Exception e) {
            log.warn("Could not update provider stats: {}", e.getMessage());
        }

        // Business Logic: Log activity
        activityLogService.logProviderActivity(providerId, "JOB_COMPLETED",
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
            if (job.getProviderId() == null || !job.getProviderId().equals(userId)) {
                log.error("Provider {} attempted to cancel job {} not assigned to them", userId, jobId);
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

        // Business Logic: Handle refunds if payment was made
        try {
            // TODO: Implement refund logic based on cancellation policy
            log.info("Cancellation refund logic to be implemented");
        } catch (Exception e) {
            log.warn("Refund processing failed: {}", e.getMessage());
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
