package com.servichaya.admin.service;

import com.servichaya.admin.dto.JobWorkflowAssignmentDto;
import com.servichaya.admin.dto.JobWorkflowStepTemplateDto;
import com.servichaya.admin.dto.JobWorkflowTemplateDto;
import com.servichaya.job.entity.JobWorkflowAssignment;
import com.servichaya.job.entity.JobWorkflowStepTemplate;
import com.servichaya.job.entity.JobWorkflowTemplate;
import com.servichaya.job.repository.JobWorkflowAssignmentRepository;
import com.servichaya.job.repository.JobWorkflowStepTemplateRepository;
import com.servichaya.job.repository.JobWorkflowTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminWorkflowService {

    private final JobWorkflowTemplateRepository templateRepository;
    private final JobWorkflowStepTemplateRepository stepTemplateRepository;
    private final JobWorkflowAssignmentRepository assignmentRepository;

    // ===== Workflow Templates =====

    public Page<JobWorkflowTemplateDto> getAllTemplates(Pageable pageable) {
        Page<JobWorkflowTemplate> page = templateRepository.findAll(pageable);
        List<JobWorkflowTemplateDto> dtos = page.getContent().stream()
                .map(this::mapTemplateToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    public JobWorkflowTemplateDto getTemplate(Long id) {
        JobWorkflowTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workflow template not found"));
        return mapTemplateToDto(template);
    }

    @Transactional
    public JobWorkflowTemplateDto createOrUpdateTemplate(JobWorkflowTemplateDto dto) {
        JobWorkflowTemplate entity;
        if (dto.getId() != null) {
            entity = templateRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Workflow template not found"));
        } else {
            entity = new JobWorkflowTemplate();
        }
        entity.setWorkflowCode(dto.getWorkflowCode());
        entity.setWorkflowName(dto.getWorkflowName());
        entity.setDescription(dto.getDescription());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : Boolean.TRUE);

        entity = templateRepository.save(entity);
        return mapTemplateToDto(entity);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        log.info("Deleting workflow template id: {}", id);
        templateRepository.deleteById(id);
    }

    // ===== Step Templates =====

    public List<JobWorkflowStepTemplateDto> getStepsForTemplate(Long templateId) {
        JobWorkflowTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Workflow template not found"));
        return stepTemplateRepository.findByWorkflowTemplateOrderByStepOrderAsc(template)
                .stream()
                .map(this::mapStepToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public JobWorkflowStepTemplateDto createOrUpdateStep(JobWorkflowStepTemplateDto dto) {
        JobWorkflowTemplate template = templateRepository.findById(dto.getWorkflowTemplateId())
                .orElseThrow(() -> new RuntimeException("Workflow template not found"));

        JobWorkflowStepTemplate entity;
        if (dto.getId() != null) {
            entity = stepTemplateRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Workflow step template not found"));
        } else {
            entity = new JobWorkflowStepTemplate();
            entity.setWorkflowTemplate(template);
        }

        entity.setWorkflowTemplate(template);
        entity.setStepOrder(dto.getStepOrder());
        entity.setStepCode(dto.getStepCode());
        entity.setStepType(dto.getStepType());
        entity.setStatusValue(dto.getStatusValue());
        entity.setPaymentType(dto.getPaymentType());
        entity.setIsMandatory(dto.getIsMandatory() != null ? dto.getIsMandatory() : Boolean.TRUE);
        entity.setAutoAdvance(dto.getAutoAdvance() != null ? dto.getAutoAdvance() : Boolean.FALSE);
        entity.setConfigJson(dto.getConfigJson());

        entity = stepTemplateRepository.save(entity);
        return mapStepToDto(entity);
    }

    @Transactional
    public void deleteStep(Long id) {
        log.info("Deleting workflow step template id: {}", id);
        stepTemplateRepository.deleteById(id);
    }

    // ===== Assignments =====

    public Page<JobWorkflowAssignmentDto> getAllAssignments(Pageable pageable) {
        Page<JobWorkflowAssignment> page = assignmentRepository.findAll(pageable);
        List<JobWorkflowAssignmentDto> dtos = page.getContent().stream()
                .map(this::mapAssignmentToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional
    public JobWorkflowAssignmentDto createOrUpdateAssignment(JobWorkflowAssignmentDto dto) {
        JobWorkflowTemplate template = templateRepository.findById(dto.getWorkflowTemplateId())
                .orElseThrow(() -> new RuntimeException("Workflow template not found"));

        JobWorkflowAssignment entity;
        if (dto.getId() != null) {
            entity = assignmentRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Workflow assignment not found"));
        } else {
            entity = new JobWorkflowAssignment();
        }

        entity.setWorkflowTemplate(template);
        entity.setServiceCategoryId(dto.getServiceCategoryId());
        entity.setServiceSubCategoryId(dto.getServiceSubCategoryId());
        entity.setPriority(dto.getPriority() != null ? dto.getPriority() : 0);
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : Boolean.TRUE);

        entity = assignmentRepository.save(entity);
        return mapAssignmentToDto(entity);
    }

    @Transactional
    public void deleteAssignment(Long id) {
        log.info("Deleting workflow assignment id: {}", id);
        assignmentRepository.deleteById(id);
    }

    // ===== Mapping helpers =====

    private JobWorkflowTemplateDto mapTemplateToDto(JobWorkflowTemplate entity) {
        return JobWorkflowTemplateDto.builder()
                .id(entity.getId())
                .workflowCode(entity.getWorkflowCode())
                .workflowName(entity.getWorkflowName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .build();
    }

    private JobWorkflowStepTemplateDto mapStepToDto(JobWorkflowStepTemplate entity) {
        return JobWorkflowStepTemplateDto.builder()
                .id(entity.getId())
                .workflowTemplateId(entity.getWorkflowTemplate().getId())
                .stepOrder(entity.getStepOrder())
                .stepCode(entity.getStepCode())
                .stepType(entity.getStepType())
                .statusValue(entity.getStatusValue())
                .paymentType(entity.getPaymentType())
                .isMandatory(entity.getIsMandatory())
                .autoAdvance(entity.getAutoAdvance())
                .configJson(entity.getConfigJson())
                .build();
    }

    private JobWorkflowAssignmentDto mapAssignmentToDto(JobWorkflowAssignment entity) {
        return JobWorkflowAssignmentDto.builder()
                .id(entity.getId())
                .workflowTemplateId(entity.getWorkflowTemplate().getId())
                .workflowCode(entity.getWorkflowTemplate().getWorkflowCode())
                .serviceCategoryId(entity.getServiceCategoryId())
                .serviceSubCategoryId(entity.getServiceSubCategoryId())
                .priority(entity.getPriority())
                .isActive(entity.getIsActive())
                .build();
    }
}

