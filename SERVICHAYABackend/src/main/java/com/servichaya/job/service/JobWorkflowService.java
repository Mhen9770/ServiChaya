package com.servichaya.job.service;

import com.servichaya.job.dto.JobStatusUpdateDto;
import com.servichaya.job.entity.*;
import com.servichaya.job.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Core workflow engine for jobs.
 * For now, this service is responsible for:
 *  - Resolving which workflow template applies to a job
 *  - Creating workflow instances and step instances when a job is created
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class JobWorkflowService {

    private final JobWorkflowAssignmentRepository assignmentRepository;
    private final JobWorkflowTemplateRepository templateRepository;
    private final JobWorkflowStepTemplateRepository stepTemplateRepository;
    private final JobWorkflowInstanceRepository instanceRepository;
    private final JobWorkflowStepInstanceRepository stepInstanceRepository;
    private final JobStatusService jobStatusService;

    // ---- Public API: Actions ----

    /**
     * Single entry point for job lifecycle actions.
     * Over time, all status and payment changes should flow through here.
     */
    @Transactional
    public void performAction(Long jobId,
                              Long userId,
                              boolean isProvider,
                              String actionCode,
                              JobStatusUpdateDto payload) {
        log.info("Performing workflow action '{}' for jobId: {}, userId: {}, isProvider: {}",
                actionCode, jobId, userId, isProvider);

        switch (actionCode) {
            case "START_WORK" -> {
                // For now, delegate to existing JobStatusService; status sync will update workflow
                jobStatusService.startJob(jobId, userId);
            }
            case "COMPLETE_WORK" -> {
                if (payload == null || payload.getFinalPrice() == null || payload.getPaymentChannel() == null) {
                    throw new RuntimeException("Final price and payment channel are required to complete work");
                }
                jobStatusService.completeJob(jobId, userId, payload.getFinalPrice(), payload.getPaymentChannel());
            }
            case "CANCEL_JOB" -> {
                String reason = payload != null ? payload.getCancelReason() : null;
                jobStatusService.cancelJob(jobId, userId, reason, isProvider);
            }
            // Future: RESCHEDULE, ISSUE_REFUND, TAKE_PAYMENT, etc.
            default -> throw new IllegalArgumentException("Unsupported workflow action: " + actionCode);
        }
    }

    /**
     * Resolve and create workflow instance for a newly created job.
     * This method is safe to call multiple times; it will not create
     * duplicate instances for the same job.
     */
    @Transactional
    public void initializeWorkflowForJob(JobMaster job) {
        if (job == null || job.getId() == null) {
            log.warn("Skipping workflow initialization: job is null or unsaved");
            return;
        }

        // If workflow instance already exists, do nothing
        Optional<JobWorkflowInstance> existing = instanceRepository.findByJobId(job.getId());
        if (existing.isPresent()) {
            log.debug("Workflow instance already exists for jobId: {}", job.getId());
            return;
        }

        JobWorkflowTemplate template = resolveTemplateForJob(job);
        if (template == null) {
            log.info("No workflow template assignment found for jobId: {} (categoryId: {}, subCategoryId: {}). " +
                     "Job will continue to use default status behaviour.", job.getId(),
                    job.getServiceCategoryId(), job.getServiceSubCategoryId());
            return;
        }

        List<JobWorkflowStepTemplate> stepTemplates =
                stepTemplateRepository.findByWorkflowTemplateOrderByStepOrderAsc(template);

        if (stepTemplates.isEmpty()) {
            log.warn("Workflow template {} has no steps configured. Skipping instance creation for jobId: {}",
                    template.getWorkflowCode(), job.getId());
            return;
        }

        int firstOrder = stepTemplates.stream()
                .map(JobWorkflowStepTemplate::getStepOrder)
                .min(Comparator.naturalOrder())
                .orElse(1);

        JobWorkflowInstance instance = JobWorkflowInstance.builder()
                .jobId(job.getId())
                .workflowTemplate(template)
                .currentStepOrder(firstOrder)
                .isCompleted(false)
                .build();
        instance = instanceRepository.save(instance);

        for (JobWorkflowStepTemplate stepTemplate : stepTemplates) {
            JobWorkflowStepInstance stepInstance = JobWorkflowStepInstance.builder()
                    .workflowInstance(instance)
                    .stepTemplate(stepTemplate)
                    .stepOrder(stepTemplate.getStepOrder())
                    .status("PENDING")
                    .build();
            stepInstanceRepository.save(stepInstance);
        }

        log.info("Workflow instance {} created for jobId: {} with {} steps (template: {})",
                instance.getId(), job.getId(), stepTemplates.size(), template.getWorkflowCode());
    }

    /**
     * Sync workflow step instances when a job's status changes using the
     * existing state machine. This is an intermediate migration step so
     * that reporting/workflow can rely on the same source of truth while
     * we still keep existing status logic.
     */
    @Transactional
    public void onStatusChanged(Long jobId, String oldStatus, String newStatus) {
        Optional<JobWorkflowInstance> optionalInstance = instanceRepository.findByJobId(jobId);
        if (optionalInstance.isEmpty()) {
            return;
        }

        JobWorkflowInstance instance = optionalInstance.get();
        List<JobWorkflowStepInstance> stepInstances =
                stepInstanceRepository.findByWorkflowInstanceOrderByStepOrderAsc(instance);

        if (stepInstances.isEmpty()) {
            return;
        }

        // Find the step whose statusValue matches the new job status
        JobWorkflowStepInstance targetStep = stepInstances.stream()
                .filter(s -> s.getStepTemplate().getStatusValue() != null
                        && s.getStepTemplate().getStatusValue().equalsIgnoreCase(newStatus))
                .findFirst()
                .orElse(null);

        if (targetStep == null) {
            log.debug("No workflow step mapped for status {} on jobId: {}", newStatus, jobId);
            return;
        }

        int targetOrder = targetStep.getStepOrder();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        // Mark all previous steps as COMPLETED if still pending
        for (JobWorkflowStepInstance step : stepInstances) {
            if (step.getStepOrder() < targetOrder && "PENDING".equals(step.getStatus())) {
                step.setStatus("COMPLETED");
                step.setCompletedAt(now);
                stepInstanceRepository.save(step);
            }
        }

        // Mark the target step as COMPLETED (we reached this status)
        targetStep.setStatus("COMPLETED");
        targetStep.setCompletedAt(now);
        stepInstanceRepository.save(targetStep);

        instance.setCurrentStepOrder(targetOrder);
        instanceRepository.save(instance);

        log.debug("Workflow for jobId: {} synced to status {}, stepOrder {}", jobId, newStatus, targetOrder);
    }

    /**
     * Resolve the most specific applicable workflow template for a job
     * based on sub-category, category, or global default.
     */
    private JobWorkflowTemplate resolveTemplateForJob(JobMaster job) {
        Long categoryId = job.getServiceCategoryId();
        Long subCategoryId = job.getServiceSubCategoryId();

        // 1) Try assignments matching both category and subcategory (subCategory takes precedence)
        List<JobWorkflowAssignment> assignments =
                assignmentRepository.findApplicableAssignments(categoryId, subCategoryId);

        if (assignments.isEmpty() && subCategoryId != null) {
            // 2) Try only category-based assignments as a fallback
            assignments = assignmentRepository.findApplicableAssignments(categoryId, null);
        }

        if (assignments.isEmpty()) {
            // 3) Try global assignments (no category / subcategory)
            assignments = assignmentRepository.findApplicableAssignments(null, null);
        }

        if (assignments.isEmpty()) {
            return null;
        }

        JobWorkflowAssignment selected = assignments.get(0);
        return selected.getWorkflowTemplate();
    }
}

