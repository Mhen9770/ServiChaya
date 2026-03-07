package com.servichaya.job.service;

import com.servichaya.job.dto.AttachmentDto;
import com.servichaya.job.dto.CreateJobDto;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.entity.JobAttachment;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobAttachmentRepository;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobMasterRepository jobRepository;
    private final JobAttachmentRepository attachmentRepository;
    private final MatchingService matchingService;

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

        try {
            log.info("Triggering matching algorithm for jobId: {}", savedJob.getId());
            matchingService.matchJobToProviders(savedJob.getId());
        } catch (Exception e) {
            log.error("Error triggering matching algorithm for jobId: {}", savedJob.getId(), e);
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
        return jobRepository.findCustomerJobsWithFilters(
                customerId, status, isEmergency, dateFrom, dateTo, budgetMin, budgetMax, pageable)
                .map(this::mapToDto);
    }
    public Page<JobDto> getCustomerJobs(Long customerId) {
        log.info("Fetching jobs for customerId: {}", customerId);
            return jobRepository.findByCustomerIdAndIsDeletedFalse(customerId, Pageable.unpaged(Sort.by(Sort.Direction.DESC, "createdAt")))
                    .map(this::mapToDto);
    }

    public Page<JobDto> getProviderJobs(Long providerId, String status, Pageable pageable) {
        log.info("Fetching jobs for providerId: {}, status: {}, page: {}, size: {}", providerId, status, pageable.getPageNumber(), pageable.getPageSize());
        if (status != null && !status.isEmpty() && !"ALL".equals(status)) {
            return jobRepository.findByProviderIdAndStatusAndIsDeletedFalse(providerId, status, pageable)
                    .map(this::mapToDto);
        }
        return jobRepository.findByProviderIdAndIsDeletedFalse(providerId, pageable)
                .map(this::mapToDto);
    }

    public Page<JobDto> getJobsByStatus(String status, Pageable pageable) {
        log.info("Fetching jobs by status: {}, page: {}, size: {}", status, pageable.getPageNumber(), pageable.getPageSize());
        return jobRepository.findByStatus(status, pageable)
                .map(this::mapToDto);
    }

    public Page<JobDto> getAllJobs(Pageable pageable) {
        log.info("Fetching all jobs, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return jobRepository.findAllByIsDeletedNotTrue(pageable)
                .map(this::mapToDto);
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
        
        return jobRepository.findAllJobsWithAdvancedFilters(
                status, cityId, customerId, providerId, categoryId, subCategoryId, 
                isEmergency, dateFrom, dateTo, budgetMin, budgetMax, pageable)
                .map(this::mapToDto);
    }

    private JobDto mapToDto(JobMaster job) {
        List<JobAttachment> attachments = attachmentRepository.findByJobIdOrderByDisplayOrderAsc(job.getId());
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
}
