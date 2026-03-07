package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingRuleMasterDto {
    private Long id;
    private String ruleCode;
    private String ruleName;
    private String ruleType;
    private BigDecimal weightPercentage;
    private String calculationLogic;
    private Boolean isActive;
    private Integer priorityOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
