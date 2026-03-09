package com.servichaya.admin.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.config.dto.BusinessRuleDto;
import com.servichaya.config.dto.FeatureFlagDto;
import com.servichaya.config.entity.BusinessRuleMaster;
import com.servichaya.config.entity.FeatureFlagMaster;
import com.servichaya.config.service.BusinessRuleService;
import com.servichaya.config.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/configuration")
@RequiredArgsConstructor
@Slf4j
public class ConfigurationController {

    private final BusinessRuleService businessRuleService;
    private final FeatureFlagService featureFlagService;

    // Business Rules Endpoints
    @GetMapping("/business-rules")
    public ResponseEntity<ApiResponse<List<BusinessRuleDto>>> getAllBusinessRules() {
        log.info("Fetching all business rules");
        List<BusinessRuleDto> rules = businessRuleService.getAllActiveRules().stream()
                .map(this::mapToBusinessRuleDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Business rules fetched successfully", rules));
    }

    @GetMapping("/business-rules/{ruleCode}")
    public ResponseEntity<ApiResponse<BusinessRuleDto>> getBusinessRule(@PathVariable String ruleCode) {
        log.info("Fetching business rule: {}", ruleCode);
        return businessRuleService.getRule(ruleCode)
                .map(rule -> ResponseEntity.ok(ApiResponse.success("Business rule fetched", mapToBusinessRuleDto(rule))))
                .orElse(ResponseEntity.ok(ApiResponse.error("Business rule not found")));
    }

    @PostMapping("/business-rules")
    public ResponseEntity<ApiResponse<BusinessRuleDto>> createBusinessRule(@RequestBody BusinessRuleDto dto) {
        log.info("Creating business rule: {}", dto.getRuleCode());
        BusinessRuleMaster rule = mapToBusinessRuleEntity(dto);
        rule = businessRuleService.saveRule(rule);
        return ResponseEntity.ok(ApiResponse.success("Business rule created", mapToBusinessRuleDto(rule)));
    }

    @PutMapping("/business-rules/{id}")
    public ResponseEntity<ApiResponse<BusinessRuleDto>> updateBusinessRule(
            @PathVariable Long id, @RequestBody BusinessRuleDto dto) {
        log.info("Updating business rule: {}", id);
        BusinessRuleMaster rule = mapToBusinessRuleEntity(dto);
        rule.setId(id);
        rule = businessRuleService.saveRule(rule);
        return ResponseEntity.ok(ApiResponse.success("Business rule updated", mapToBusinessRuleDto(rule)));
    }

    @DeleteMapping("/business-rules/{ruleCode}")
    public ResponseEntity<ApiResponse<Void>> deleteBusinessRule(@PathVariable String ruleCode) {
        log.info("Deleting business rule: {}", ruleCode);
        businessRuleService.deleteRule(ruleCode);
        return ResponseEntity.ok(ApiResponse.success("Business rule deleted", null));
    }

    // Feature Flags Endpoints
    @GetMapping("/feature-flags")
    public ResponseEntity<ApiResponse<List<FeatureFlagDto>>> getAllFeatureFlags() {
        log.info("Fetching all feature flags");
        List<FeatureFlagDto> flags = featureFlagService.getAllActiveFlags().stream()
                .map(this::mapToFeatureFlagDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Feature flags fetched successfully", flags));
    }

    @GetMapping("/feature-flags/{featureCode}")
    public ResponseEntity<ApiResponse<FeatureFlagDto>> getFeatureFlag(@PathVariable String featureCode) {
        log.info("Fetching feature flag: {}", featureCode);
        return featureFlagService.getFeatureFlag(featureCode)
                .map(flag -> ResponseEntity.ok(ApiResponse.success("Feature flag fetched", mapToFeatureFlagDto(flag))))
                .orElse(ResponseEntity.ok(ApiResponse.error("Feature flag not found")));
    }

    @PostMapping("/feature-flags")
    public ResponseEntity<ApiResponse<FeatureFlagDto>> createFeatureFlag(@RequestBody FeatureFlagDto dto) {
        log.info("Creating feature flag: {}", dto.getFeatureCode());
        FeatureFlagMaster flag = mapToFeatureFlagEntity(dto);
        flag = featureFlagService.saveFlag(flag);
        return ResponseEntity.ok(ApiResponse.success("Feature flag created", mapToFeatureFlagDto(flag)));
    }

    @PutMapping("/feature-flags/{id}")
    public ResponseEntity<ApiResponse<FeatureFlagDto>> updateFeatureFlag(
            @PathVariable Long id, @RequestBody FeatureFlagDto dto) {
        log.info("Updating feature flag: {}", id);
        FeatureFlagMaster flag = mapToFeatureFlagEntity(dto);
        flag.setId(id);
        flag = featureFlagService.saveFlag(flag);
        return ResponseEntity.ok(ApiResponse.success("Feature flag updated", mapToFeatureFlagDto(flag)));
    }

    @DeleteMapping("/feature-flags/{featureCode}")
    public ResponseEntity<ApiResponse<Void>> deleteFeatureFlag(@PathVariable String featureCode) {
        log.info("Deleting feature flag: {}", featureCode);
        featureFlagService.deleteFlag(featureCode);
        return ResponseEntity.ok(ApiResponse.success("Feature flag deleted", null));
    }

    // Helper methods
    private BusinessRuleDto mapToBusinessRuleDto(BusinessRuleMaster rule) {
        return BusinessRuleDto.builder()
                .id(rule.getId())
                .ruleCode(rule.getRuleCode())
                .ruleName(rule.getRuleName())
                .ruleValue(rule.getRuleValue())
                .ruleType(rule.getRuleType())
                .appliesTo(rule.getAppliesTo())
                .isActive(rule.getIsActive())
                .description(rule.getDescription())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }

    private BusinessRuleMaster mapToBusinessRuleEntity(BusinessRuleDto dto) {
        return BusinessRuleMaster.builder()
                .ruleCode(dto.getRuleCode())
                .ruleName(dto.getRuleName())
                .ruleValue(dto.getRuleValue())
                .ruleType(dto.getRuleType())
                .appliesTo(dto.getAppliesTo())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .description(dto.getDescription())
                .build();
    }

    private FeatureFlagDto mapToFeatureFlagDto(FeatureFlagMaster flag) {
        return FeatureFlagDto.builder()
                .id(flag.getId())
                .featureCode(flag.getFeatureCode())
                .featureName(flag.getFeatureName())
                .description(flag.getDescription())
                .isEnabled(flag.getIsEnabled())
                .enabledForUsers(flag.getEnabledForUsers())
                .enabledForCities(flag.getEnabledForCities())
                .rolloutPercentage(flag.getRolloutPercentage())
                .isActive(flag.getIsActive())
                .createdAt(flag.getCreatedAt())
                .updatedAt(flag.getUpdatedAt())
                .build();
    }

    private FeatureFlagMaster mapToFeatureFlagEntity(FeatureFlagDto dto) {
        return FeatureFlagMaster.builder()
                .featureCode(dto.getFeatureCode())
                .featureName(dto.getFeatureName())
                .description(dto.getDescription())
                .isEnabled(dto.getIsEnabled() != null ? dto.getIsEnabled() : false)
                .enabledForUsers(dto.getEnabledForUsers())
                .enabledForCities(dto.getEnabledForCities())
                .rolloutPercentage(dto.getRolloutPercentage() != null ? dto.getRolloutPercentage() : 0)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }
}
