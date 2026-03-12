package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobWorkflowStepTemplateDto {
    private Long id;
    private Long workflowTemplateId;
    private Integer stepOrder;
    private String stepCode;
    private String stepType;
    private String statusValue;
    private String paymentType;
    private Boolean isMandatory;
    private Boolean autoAdvance;
    private String configJson;
}

