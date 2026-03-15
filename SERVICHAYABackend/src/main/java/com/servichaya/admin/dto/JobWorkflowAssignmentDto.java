package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobWorkflowAssignmentDto {
    private Long id;
    private Long workflowTemplateId;
    private String workflowCode;
    private Long serviceCategoryId;
    private Long serviceSubCategoryId;
    private Integer priority;
    private Boolean isActive;
}

