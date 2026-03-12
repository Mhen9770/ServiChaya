package com.servichaya.job.service;

import com.servichaya.common.service.ConfigService;
import com.servichaya.job.dto.AttachmentDto;
import com.servichaya.job.dto.CreateJobDto;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.entity.JobAttachment;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobAttachmentRepository;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.matching.service.MatchingService;
import com.servichaya.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobMasterRepository jobRepository;
    private final JobAttachmentRepository attachmentRepository;
    private final MatchingService matchingService;
    private final ConfigService configService;
    private final NotificationService notificationService;
    private final JobStateMachine stateMachine;
    private final JobWorkflowService jobWorkflowService;

    @Transactional
    public JobDto createJob(Long customerId, CreateJobDto createJobDto) {
        log.info("Creating job for customerId: {}, serviceCategoryId: {}", customerId, createJobDto.getServiceCategoryId());

        String jobCode = "JOB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        JobMaster job = JobMaster.builder()
                .jobCode(jobCode)
                .customerId(customerId)
                .serviceCategoryId(createJobDto.getServiceCategoryId())
                .serviceSubCategoryId(createJobDto.getServiceSubCategoryId())
                .serviceSkillId(createJobDto.getServiceSkillId())
                .title(createJobDto.getTitle())
                .description(createJobDto.getDescription())
                .preferredTime(createJobDto.getPreferredTime())
                .isEmergency(createJobDto.getIsEmergency() != null ? createJobDto.getIsEmergency() : false)
                .estimatedBudget(createJobDto.getEstimatedBudget())
                .cityId(createJobDto.getCityId())
                .zoneId(createJobDto.getZoneId())
                .podId(createJobDto.getPodId())
                .addressLine1(createJobDto.getAddressLine1())
                .addressLine2(createJobDto.getAddressLine2())
                .pincode(createJobDto.getPincode())
                .latitude(createJobDto.getLatitude())
                .longitude(createJobDto.getLongitude())
                .specialInstructions(createJobDto.getSpecialInstructions())
                .status("PENDING")
                .build();

        JobMaster savedJob = jobRepository.save(job);
        log.info("Job created successfully with jobCode: {}, jobId: {}", jobCode, savedJob.getId());

        try {
            jobWorkflowService.initializeWorkflowForJob(savedJob);
        } catch (Exception e) {
            log.error("Failed to initialize workflow for jobId: {}. Proceeding with default behaviour.", savedJob.getId(), e);
        }

        // Notify customer about job creation
        try {
            notificationService.createNotification(
                    customerId, "CUSTOMER", "JOB_CREATED",
                    "Job Created Successfully",
                    String.format("Your job request '%s' has been created. We're finding the best providers for you.", savedJob.getTitle()),
                    "JOB", savedJob.getId(),
                    String.format("/customer/jobs/%d", savedJob.getId()),
                    Map.of("jobCode", savedJob.getJobCode(), "status", savedJob.getStatus())
            );
        } catch (Exception e) {
            log.error("Failed to send job creation notification", e);
            // Don't fail job creation if notification fails
        }

        if (createJobDto.getAttachments() != null && !createJobDto.getAttachments().isEmpty()) {
            final Long jobId = savedJob.getId();
            List<JobAttachment> attachments = createJobDto.getAttachments().stream()
                    .map(att -> JobAttachment.builder()
                            .jobId(jobId)
                            .attachmentType(att.getAttachmentType() != null ? att.getAttachmentType() : "IMAGE")
                            .fileUrl(att.getFileUrl())
                            .fileName(att.getFileName())
                            .fileSize(att.getFileSize())
                            .displayOrder(att.getDisplayOrder() != null ? att.getDisplayOrder() : 0)
                            .build())
                    .collect(Collectors.toList());
            attachmentRepository.saveAll(attachments);
            log.info("Saved {} attachments for jobId: {}", attachments.size(), jobId);
        }

        // Check if AUTO_MATCHING_FEATURE is enabled before triggering matching
        try {
            if (configService.isAutoMatchingEnabled()) {
                log.info("AUTO_MATCHING_FEATURE enabled. Triggering matching algorithm for jobId: {}", savedJob.getId());
                
                // Update job status to MATCHING before starting matching
                updateJobStatus(savedJob.getId(), "PENDING", "MATCHING");
                
                // Trigger matching (this will update status to MATCHED if providers found)
                matchingService.matchJobToProviders(savedJob.getId());
            } else {
                log.info("AUTO_MATCHING_FEATURE disabled. Skipping automatic matching for jobId: {}. Admin can manually assign.", savedJob.getId());
                // Notify customer that admin will assign manually
                try {
                    notificationService.createNotification(
                            customerId, "CUSTOMER", "JOB_PENDING_MANUAL_ASSIGNMENT",
                            "Job Created - Manual Assignment",
                            String.format("Your job request '%s' has been created. Our team will assign a provider shortly.", savedJob.getTitle()),
                            "JOB", savedJob.getId(),
                            String.format("/customer/jobs/%d", savedJob.getId()),
                            Map.of("jobCode", savedJob.getJobCode())
                    );
                } catch (Exception e) {
                    log.error("Failed to send manual assignment notification", e);
                }
            }
        } catch (Exception e) {
            log.error("Error checking AUTO_MATCHING_FEATURE or triggering matching for jobId: {}", savedJob.getId(), e);
            // Revert status to PENDING if matching fails
            try {
                updateJobStatus(savedJob.getId(), "MATCHING", "PENDING");
            } catch (Exception ex) {
                log.error("Failed to revert job status", ex);
            }
            
            // Notify customer about matching failure
            try {
                notificationService.createNotification(
                        customerId, "CUSTOMER", "JOB_MATCHING_FAILED",
                        "Finding Providers",
                        String.format("We're having trouble finding providers for '%s'. Our team will review and assign manually.", savedJob.getTitle()),
                        "JOB", savedJob.getId(),
                        String.format("/customer/jobs/%d", savedJob.getId()),
                        Map.of("jobCode", savedJob.getJobCode())
                );
            } catch (Exception ex) {
                log.error("Failed to send matching failure notification", ex);
            }
        }

        return mapToDto(savedJob);
    }

    public JobDto getJobById(Long jobId) {
        log.info("Fetching job by id: {}", jobId);
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });
        return mapToDto(job);
    }

    public JobDto getJobByCode(String jobCode) {
        log.info("Fetching job by code: {}", jobCode);
        JobMaster job = jobRepository.findByJobCode(jobCode)
                .orElseThrow(() -> {
                    log.error("Job not found with code: {}", jobCode);
                    return new RuntimeException("Job not found");
                });
        return mapToDto(job);
    }

    public Page<JobDto> getCustomerJobs(Long customerId, String status, Pageable pageable) {
        return getCustomerJobsWithFilters(customerId, status, null, null, null, null, null, pageable);
    }

    public Page<JobDto> getCustomerJobsWithFilters(
            Long customerId, 
            String status, 
            Boolean isEmergency,
            java.time.LocalDateTime dateFrom,
            java.time.LocalDateTime dateTo,
            java.math.BigDecimal budgetMin,
            java.math.BigDecimal budgetMax,
            Pageable pageable) {
        log.info("Fetching jobs for customerId: {} with filters - status: {}, isEmergency: {}, dateFrom: {}, dateTo: {}, budgetMin: {}, budgetMax: {}", 
                customerId, status, isEmergency, dateFrom, dateTo, budgetMin, budgetMax);
        Page<JobMaster> jobsPage = jobRepository.findCustomerJobsWithFilters(
                customerId, status, isEmergency, dateFrom, dateTo, budgetMin, budgetMax, pageable);
        
        // Batch load attachments to avoid N+1 queries
        Map<Long, List<JobAttachment>> attachmentsMap = batchLoadAttachments(jobsPage.getContent());
        
        return jobsPage.map(job -> mapToDto(job, attachmentsMap.getOrDefault(job.getId(), Collections.emptyList())));
    }
    public Page<JobDto> getCustomerJobs(Long customerId) {
        log.info("Fetching jobs for customerId: {}", customerId);
        Page<JobMaster> jobsPage = jobRepository.findByCustomerIdAndIsDeletedFalse(customerId, Pageable.unpaged(Sort.by(Sort.Direction.DESC, "createdAt")));
        
        // Batch load attachments to avoid N+1 queries
        Map<Long, List<JobAttachment>> attachmentsMap = batchLoadAttachments(jobsPage.getContent());
        
        return jobsPage.map(job -> mapToDto(job, attachmentsMap.getOrDefault(job.getId(), Collections.emptyList())));
    }

    public Page<JobDto> getProviderJobs(Long providerId, String status, Pageable pageable) {
        log.info("Fetching jobs for providerId: {}, status: {}, page: {}, size: {}", providerId, status, pageable.getPageNumber(), pageable.getPageSize());
        Page<JobMaster> jobsPage;
        if (status != null && !status.isEmpty() && !"ALL".equals(status)) {
            jobsPage = jobRepository.findByProviderIdAndStatusAndIsDeletedFalse(providerId, status, pageable);
        } else {
            jobsPage = jobRepository.findByProviderIdAndIsDeletedFalse(providerId, pageable);
        }
        
        // Batch load attachments to avoid N+1 queries
        Map<Long, List<JobAttachment>> attachmentsMap = batchLoadAttachments(jobsPage.getContent());
        
        return jobsPage.map(job -> mapToDto(job, attachmentsMap.getOrDefault(job.getId(), Collections.emptyList())));
    }

    public Page<JobDto> getJobsByStatus(String status, Pageable pageable) {
        log.info("Fetching jobs by status: {}, page: {}, size: {}", status, pageable.getPageNumber(), pageable.getPageSize());
        Page<JobMaster> jobsPage = jobRepository.findByStatus(status, pageable);
        
        // Batch load attachments to avoid N+1 queries
        Map<Long, List<JobAttachment>> attachmentsMap = batchLoadAttachments(jobsPage.getContent());
        
        return jobsPage.map(job -> mapToDto(job, attachmentsMap.getOrDefault(job.getId(), Collections.emptyList())));
    }

    public Page<JobDto> getAllJobs(Pageable pageable) {
        log.info("Fetching all jobs, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<JobMaster> jobsPage = jobRepository.findAllByIsDeletedNotTrue(pageable);
        
        // Batch load attachments to avoid N+1 queries
        Map<Long, List<JobAttachment>> attachmentsMap = batchLoadAttachments(jobsPage.getContent());
        
        return jobsPage.map(job -> mapToDto(job, attachmentsMap.getOrDefault(job.getId(), Collections.emptyList())));
    }

    public Page<JobDto> getJobsWithFilters(String status, Long cityId, Long customerId, Long providerId, 
                                           Pageable pageable) {
        return getJobsWithAdvancedFilters(status, cityId, customerId, providerId, null, null, null, null, null, null, null, pageable);
    }

    public Page<JobDto> getJobsWithAdvancedFilters(
            String status, 
            Long cityId, 
            Long customerId, 
            Long providerId,
            Long categoryId,
            Long subCategoryId,
            Boolean isEmergency,
            java.time.LocalDateTime dateFrom,
            java.time.LocalDateTime dateTo,
            java.math.BigDecimal budgetMin,
            java.math.BigDecimal budgetMax,
            Pageable pageable) {
        log.info("Fetching jobs with advanced filters - status: {}, cityId: {}, customerId: {}, providerId: {}, categoryId: {}, subCategoryId: {}, isEmergency: {}, dateFrom: {}, dateTo: {}, budgetMin: {}, budgetMax: {}", 
                status, cityId, customerId, providerId, categoryId, subCategoryId, isEmergency, dateFrom, dateTo, budgetMin, budgetMax);
        
        Page<JobMaster> jobsPage = jobRepository.findAllJobsWithAdvancedFilters(
                status, cityId, customerId, providerId, categoryId, subCategoryId, 
                isEmergency, dateFrom, dateTo, budgetMin, budgetMax, pageable);
        
        // Batch load attachments to avoid N+1 queries
        Map<Long, List<JobAttachment>> attachmentsMap = batchLoadAttachments(jobsPage.getContent());
        
        return jobsPage.map(job -> mapToDto(job, attachmentsMap.getOrDefault(job.getId(), Collections.emptyList())));
    }

    /**
     * Batch load attachments for multiple jobs to avoid N+1 queries
     */
    private Map<Long, List<JobAttachment>> batchLoadAttachments(List<JobMaster> jobs) {
        if (jobs == null || jobs.isEmpty()) {
            return Collections.emptyMap();
        }
        
        List<Long> jobIds = jobs.stream()
                .map(JobMaster::getId)
                .collect(Collectors.toList());
        
        List<JobAttachment> allAttachments = attachmentRepository.findByJobIdInOrderByJobIdAscDisplayOrderAsc(jobIds);
        
        // Group attachments by jobId
        return allAttachments.stream()
                .collect(Collectors.groupingBy(JobAttachment::getJobId));
    }

    /**
     * Map JobMaster to JobDto with pre-loaded attachments (for batch operations)
     */
    private JobDto mapToDto(JobMaster job, List<JobAttachment> attachments) {
        List<AttachmentDto> attachmentDtos = attachments.stream()
                .map(att -> AttachmentDto.builder()
                        .attachmentType(att.getAttachmentType())
                        .fileUrl(att.getFileUrl())
                        .fileName(att.getFileName())
                        .fileSize(att.getFileSize())
                        .displayOrder(att.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return JobDto.builder()
                .id(job.getId())
                .jobCode(job.getJobCode())
                .customerId(job.getCustomerId())
                .serviceCategoryId(job.getServiceCategoryId())
                .serviceSubCategoryId(job.getServiceSubCategoryId())
                .serviceSkillId(job.getServiceSkillId())
                .title(job.getTitle())
                .description(job.getDescription())
                .preferredTime(job.getPreferredTime())
                .isEmergency(job.getIsEmergency())
                .estimatedBudget(job.getEstimatedBudget())
                .finalPrice(job.getFinalPrice())
                .status(job.getStatus())
                .podId(job.getPodId())
                .zoneId(job.getZoneId())
                .cityId(job.getCityId())
                .addressLine1(job.getAddressLine1())
                .addressLine2(job.getAddressLine2())
                .pincode(job.getPincode())
                .latitude(job.getLatitude())
                .longitude(job.getLongitude())
                .providerId(job.getProviderId())
                .acceptedAt(job.getAcceptedAt())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .specialInstructions(job.getSpecialInstructions())
                .attachments(attachmentDtos)
                .createdAt(job.getCreatedAt())
                .build();
    }

    /**
     * Map JobMaster to JobDto (for single job operations)
     */
    private JobDto mapToDto(JobMaster job) {
        List<JobAttachment> attachments = attachmentRepository.findByJobIdOrderByDisplayOrderAsc(job.getId());
        return mapToDto(job, attachments);
    }

    /**
     * Update job status with state machine validation
     */
    @Transactional
    public void updateJobStatus(Long jobId, String currentStatus, String newStatus) {
        log.info("Updating job {} status: {} -> {}", jobId, currentStatus, newStatus);
        
        // Validate transition
        stateMachine.validateTransition(currentStatus, newStatus);
        
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        // Verify current status matches
        if (!job.getStatus().equals(currentStatus)) {
            log.warn("Job {} current status is {}, expected {}. Skipping status update.", 
                    jobId, job.getStatus(), currentStatus);
            throw new RuntimeException(
                String.format("Job status mismatch. Current: %s, Expected: %s", 
                    job.getStatus(), currentStatus)
            );
        }
        
        // Update status
        job.setStatus(newStatus);
        jobRepository.save(job);

        // Sync workflow instance with new status (if workflow is configured)
        try {
            jobWorkflowService.onStatusChanged(jobId, currentStatus, newStatus);
        } catch (Exception e) {
            log.error("Failed to sync workflow for jobId: {} on status change {} -> {}",
                    jobId, currentStatus, newStatus, e);
        }

        log.info("Job {} status updated to {}", jobId, newStatus);
    }
}
