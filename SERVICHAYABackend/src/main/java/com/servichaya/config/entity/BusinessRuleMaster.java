package com.servichaya.config.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "business_rule_master", indexes = {
    @Index(name = "idx_rule_code", columnList = "rule_code"),
    @Index(name = "idx_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessRuleMaster extends BaseEntity {

    @Column(name = "rule_code", unique = true, length = 100, nullable = false)
    private String ruleCode;

    @Column(name = "rule_name", length = 255, nullable = false)
    private String ruleName;

    @Column(name = "rule_value", columnDefinition = "JSON")
    private String ruleValue; // JSON string

    @Column(name = "rule_type", length = 50, nullable = false)
    private String ruleType; // PERCENTAGE, FIXED_AMOUNT, TIME_DURATION, BOOLEAN

    @Column(name = "applies_to", length = 50, nullable = false)
    private String appliesTo; // CUSTOMER, PROVIDER, PLATFORM, ALL

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
