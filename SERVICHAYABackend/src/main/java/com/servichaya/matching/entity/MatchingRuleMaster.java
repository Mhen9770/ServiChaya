package com.servichaya.matching.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "matching_rule_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingRuleMaster extends BaseEntity {

    @Column(name = "rule_code", unique = true, length = 100, nullable = false)
    private String ruleCode;

    @Column(name = "rule_name", length = 255, nullable = false)
    private String ruleName;

    @Column(name = "rule_type", length = 50, nullable = false)
    private String ruleType; // SKILL_MATCH, DISTANCE, RATING, SUBSCRIPTION_TIER, ACCEPTANCE_RATE, RESPONSE_TIME, JOB_HISTORY

    @Column(name = "weight_percentage", precision = 5, scale = 2, nullable = false)
    private java.math.BigDecimal weightPercentage;

    @Column(name = "calculation_logic", columnDefinition = "JSON")
    private String calculationLogic; // JSON string with calculation rules

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "priority_order")
    @Builder.Default
    private Integer priorityOrder = 0;
}
