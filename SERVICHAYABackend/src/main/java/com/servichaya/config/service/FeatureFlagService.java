package com.servichaya.config.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servichaya.config.entity.FeatureFlagMaster;
import com.servichaya.config.repository.FeatureFlagMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final FeatureFlagMasterRepository flagRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Cacheable(value = "featureFlag", key = "#featureCode")
    public Optional<FeatureFlagMaster> getFeatureFlag(String featureCode) {
        log.debug("Fetching feature flag: {}", featureCode);
        return flagRepository.findActiveByFeatureCode(featureCode);
    }

    /**
     * Check if a feature is enabled for a user
     * Considers: global enable, user-specific enable, city-specific enable, rollout percentage
     */
    public boolean isFeatureEnabled(String featureCode, Long userId, Long cityId) {
        Optional<FeatureFlagMaster> flagOpt = getFeatureFlag(featureCode);
        if (flagOpt.isEmpty()) {
            log.debug("Feature flag not found: {}, returning false", featureCode);
            return false;
        }

        FeatureFlagMaster flag = flagOpt.get();
        if (!flag.getIsActive() || !flag.getIsEnabled()) {
            log.debug("Feature flag {} is not active or enabled", featureCode);
            return false;
        }

        // Check user-specific enable
        if (userId != null && flag.getEnabledForUsers() != null) {
            try {
                List<Long> enabledUsers = objectMapper.readValue(
                    flag.getEnabledForUsers(), 
                    new TypeReference<List<Long>>() {}
                );
                if (enabledUsers.contains(userId)) {
                    log.debug("Feature {} enabled for user {}", featureCode, userId);
                    return true;
                }
            } catch (Exception e) {
                log.warn("Error parsing enabled_for_users for feature {}: {}", featureCode, e.getMessage());
            }
        }

        // Check city-specific enable
        if (cityId != null && flag.getEnabledForCities() != null) {
            try {
                List<Long> enabledCities = objectMapper.readValue(
                    flag.getEnabledForCities(), 
                    new TypeReference<List<Long>>() {}
                );
                if (enabledCities.contains(cityId)) {
                    log.debug("Feature {} enabled for city {}", featureCode, cityId);
                    return true;
                }
            } catch (Exception e) {
                log.warn("Error parsing enabled_for_cities for feature {}: {}", featureCode, e.getMessage());
            }
        }

        // Check rollout percentage (simple hash-based rollout)
        if (flag.getRolloutPercentage() != null && flag.getRolloutPercentage() > 0) {
            if (userId != null) {
                int userHash = Math.abs(userId.hashCode()) % 100;
                if (userHash < flag.getRolloutPercentage()) {
                    log.debug("Feature {} enabled for user {} via rollout ({}%)", 
                        featureCode, userId, flag.getRolloutPercentage());
                    return true;
                }
            }
        }

        // Global enable (if no specific targeting)
        if (flag.getIsEnabled() && 
            (flag.getEnabledForUsers() == null || flag.getEnabledForUsers().trim().isEmpty()) &&
            (flag.getEnabledForCities() == null || flag.getEnabledForCities().trim().isEmpty()) &&
            (flag.getRolloutPercentage() == null || flag.getRolloutPercentage() == 0)) {
            log.debug("Feature {} globally enabled", featureCode);
            return true;
        }

        log.debug("Feature {} not enabled for user {} / city {}", featureCode, userId, cityId);
        return false;
    }

    /**
     * Simple check if feature is globally enabled
     */
    public boolean isFeatureEnabled(String featureCode) {
        return isFeatureEnabled(featureCode, null, null);
    }

    public List<FeatureFlagMaster> getAllActiveFlags() {
        return flagRepository.findAllActive();
    }

    public List<FeatureFlagMaster> getAllEnabledFlags() {
        return flagRepository.findAllEnabled();
    }

    @Transactional
    @CacheEvict(value = "featureFlag", key = "#flag.featureCode")
    public FeatureFlagMaster saveFlag(FeatureFlagMaster flag) {
        log.info("Saving feature flag: {}", flag.getFeatureCode());
        return flagRepository.save(flag);
    }

    @Transactional
    @CacheEvict(value = "featureFlag", key = "#featureCode")
    public void deleteFlag(String featureCode) {
        flagRepository.findByFeatureCode(featureCode).ifPresent(flag -> {
            flag.setIsActive(false);
            flagRepository.save(flag);
            log.info("Deactivated feature flag: {}", featureCode);
        });
    }
}
