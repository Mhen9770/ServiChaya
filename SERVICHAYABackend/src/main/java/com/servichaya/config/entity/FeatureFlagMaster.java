package com.servichaya.config.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feature_flag_master", indexes = {
    @Index(name = "idx_feature_code", columnList = "feature_code"),
    @Index(name = "idx_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureFlagMaster extends BaseEntity {

    @Column(name = "feature_code", unique = true, length = 100, nullable = false)
    private String featureCode;

    @Column(name = "feature_name", length = 255, nullable = false)
    private String featureName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_enabled")
    @Builder.Default
    private Boolean isEnabled = false;

    @Column(name = "enabled_for_users", columnDefinition = "JSON")
    private String enabledForUsers; // JSON array of user IDs

    @Column(name = "enabled_for_cities", columnDefinition = "JSON")
    private String enabledForCities; // JSON array of city IDs

    @Column(name = "rollout_percentage")
    @Builder.Default
    private Integer rolloutPercentage = 0; // 0-100

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
