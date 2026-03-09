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
public class FeatureFlagDto {
    private Long id;
    private String featureCode;
    private String featureName;
    private String description;
    private Boolean isEnabled;
    private String enabledForUsers; // JSON array
    private String enabledForCities; // JSON array
    private Integer rolloutPercentage;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
