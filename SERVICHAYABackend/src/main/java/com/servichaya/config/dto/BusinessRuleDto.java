package com.servichaya.config.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessRuleDto {
    private Long id;
    private String ruleCode;
    private String ruleName;
    private String ruleValue;
    private String ruleType;
    private String appliesTo;
    private Boolean isActive;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
