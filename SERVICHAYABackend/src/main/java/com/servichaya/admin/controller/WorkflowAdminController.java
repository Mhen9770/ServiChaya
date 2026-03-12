package com.servichaya.admin.controller;

import com.servichaya.admin.dto.JobWorkflowAssignmentDto;
import com.servichaya.admin.dto.JobWorkflowStepTemplateDto;
import com.servichaya.admin.dto.JobWorkflowTemplateDto;
import com.servichaya.admin.service.AdminWorkflowService;
import com.servichaya.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/workflows")
@RequiredArgsConstructor
@Slf4j
public class WorkflowAdminController {

    private final AdminWorkflowService adminWorkflowService;

    // ===== Workflow Templates =====

    @GetMapping("/templates")
    public ResponseEntity<ApiResponse<Page<JobWorkflowTemplateDto>>> getTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching workflow templates, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc"))
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<JobWorkflowTemplateDto> templates = adminWorkflowService.getAllTemplates(pageable);
        return ResponseEntity.ok(ApiResponse.success("Workflow templates fetched successfully", templates));
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<JobWorkflowTemplateDto>> getTemplate(@PathVariable Long id) {
        log.info("Fetching workflow template id: {}", id);
        JobWorkflowTemplateDto dto = adminWorkflowService.getTemplate(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow template fetched successfully", dto));
    }

    @PostMapping("/templates")
    public ResponseEntity<ApiResponse<JobWorkflowTemplateDto>> createTemplate(@RequestBody JobWorkflowTemplateDto dto) {
        log.info("Creating workflow template: {}", dto.getWorkflowCode());
        JobWorkflowTemplateDto created = adminWorkflowService.createOrUpdateTemplate(dto);
        return ResponseEntity.ok(ApiResponse.success("Workflow template created successfully", created));
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<JobWorkflowTemplateDto>> updateTemplate(
            @PathVariable Long id,
            @RequestBody JobWorkflowTemplateDto dto) {
        log.info("Updating workflow template id: {}", id);
        dto.setId(id);
        JobWorkflowTemplateDto updated = adminWorkflowService.createOrUpdateTemplate(dto);
        return ResponseEntity.ok(ApiResponse.success("Workflow template updated successfully", updated));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTemplate(@PathVariable Long id) {
        log.info("Deleting workflow template id: {}", id);
        adminWorkflowService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow template deleted successfully", "Deleted"));
    }

    // ===== Step Templates =====

    @GetMapping("/templates/{templateId}/steps")
    public ResponseEntity<ApiResponse<List<JobWorkflowStepTemplateDto>>> getTemplateSteps(@PathVariable Long templateId) {
        log.info("Fetching workflow step templates for templateId: {}", templateId);
        List<JobWorkflowStepTemplateDto> steps = adminWorkflowService.getStepsForTemplate(templateId);
        return ResponseEntity.ok(ApiResponse.success("Workflow step templates fetched successfully", steps));
    }

    @PostMapping("/templates/{templateId}/steps")
    public ResponseEntity<ApiResponse<JobWorkflowStepTemplateDto>> createStep(
            @PathVariable Long templateId,
            @RequestBody JobWorkflowStepTemplateDto dto) {
        log.info("Creating workflow step template for templateId: {}", templateId);
        dto.setWorkflowTemplateId(templateId);
        JobWorkflowStepTemplateDto created = adminWorkflowService.createOrUpdateStep(dto);
        return ResponseEntity.ok(ApiResponse.success("Workflow step template created successfully", created));
    }

    @PutMapping("/steps/{stepId}")
    public ResponseEntity<ApiResponse<JobWorkflowStepTemplateDto>> updateStep(
            @PathVariable Long stepId,
            @RequestBody JobWorkflowStepTemplateDto dto) {
        log.info("Updating workflow step template id: {}", stepId);
        dto.setId(stepId);
        JobWorkflowStepTemplateDto updated = adminWorkflowService.createOrUpdateStep(dto);
        return ResponseEntity.ok(ApiResponse.success("Workflow step template updated successfully", updated));
    }

    @DeleteMapping("/steps/{stepId}")
    public ResponseEntity<ApiResponse<String>> deleteStep(@PathVariable Long stepId) {
        log.info("Deleting workflow step template id: {}", stepId);
        adminWorkflowService.deleteStep(stepId);
        return ResponseEntity.ok(ApiResponse.success("Workflow step template deleted successfully", "Deleted"));
    }

    // ===== Assignments =====

    @GetMapping("/assignments")
    public ResponseEntity<ApiResponse<Page<JobWorkflowAssignmentDto>>> getAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching workflow assignments, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc"))
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<JobWorkflowAssignmentDto> assignments = adminWorkflowService.getAllAssignments(pageable);
        return ResponseEntity.ok(ApiResponse.success("Workflow assignments fetched successfully", assignments));
    }

    @PostMapping("/assignments")
    public ResponseEntity<ApiResponse<JobWorkflowAssignmentDto>> createAssignment(
            @RequestBody JobWorkflowAssignmentDto dto) {
        log.info("Creating workflow assignment for workflowTemplateId: {}", dto.getWorkflowTemplateId());
        JobWorkflowAssignmentDto created = adminWorkflowService.createOrUpdateAssignment(dto);
        return ResponseEntity.ok(ApiResponse.success("Workflow assignment created successfully", created));
    }

    @PutMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<JobWorkflowAssignmentDto>> updateAssignment(
            @PathVariable Long id,
            @RequestBody JobWorkflowAssignmentDto dto) {
        log.info("Updating workflow assignment id: {}", id);
        dto.setId(id);
        JobWorkflowAssignmentDto updated = adminWorkflowService.createOrUpdateAssignment(dto);
        return ResponseEntity.ok(ApiResponse.success("Workflow assignment updated successfully", updated));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAssignment(@PathVariable Long id) {
        log.info("Deleting workflow assignment id: {}", id);
        adminWorkflowService.deleteAssignment(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow assignment deleted successfully", "Deleted"));
    }
}

