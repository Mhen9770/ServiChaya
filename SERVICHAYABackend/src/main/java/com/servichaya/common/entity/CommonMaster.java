package com.servichaya.common.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Common Master Table - Stores all default platform configurations
 * This replaces hardcoded values throughout the codebase
 */
@Entity
@Table(name = "common_master", indexes = {
    @Index(name = "idx_config_key", columnList = "config_key"),
    @Index(name = "idx_category_key", columnList = "config_category, config_key"),
    @Index(name = "idx_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommonMaster extends BaseEntity {

    @Column(name = "config_category", length = 100, nullable = false)
    private String configCategory; // EARNING, COMMISSION, PAYMENT, MATCHING, NOTIFICATION, etc.

    @Column(name = "config_key", length = 100, nullable = false)
    private String configKey; // Unique key within category, e.g., 'DEFAULT_COMMISSION_PERCENTAGE'

    @Column(name = "config_name", length = 255, nullable = false)
    private String configName; // Human-readable name

    @Column(name = "config_value", columnDefinition = "TEXT", nullable = false)
    private String configValue; // JSON string or simple value

    @Column(name = "value_type", length = 50, nullable = false)
    private String valueType; // PERCENTAGE, FIXED_AMOUNT, NUMBER, STRING, BOOLEAN, JSON

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "applies_to", length = 50)
    private String appliesTo; // PLATFORM, PROVIDER, CUSTOMER, ALL

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
}
