package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobWorkflowTemplateDto {
    private Long id;
    private String workflowCode;
    private String workflowName;
    private String description;
    private Boolean isActive;
}

