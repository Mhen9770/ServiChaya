package com.servichaya.common.service;

import com.servichaya.common.entity.CommonMaster;
import com.servichaya.common.repository.CommonMasterRepository;
import com.servichaya.config.service.BusinessRuleService;
import com.servichaya.config.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Configuration Service - Retrieves default values from:
 * 1. BusinessRuleMaster (highest priority for business rules)
 * 2. FeatureFlagMaster (for feature flags)
 * 3. CommonMaster (fallback for legacy configs)
 * Replaces all hardcoded defaults in the codebase
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConfigService {

    private final CommonMasterRepository commonMasterRepository;
    private final BusinessRuleService businessRuleService;
    private final FeatureFlagService featureFlagService;

    @Cacheable(value = "commonConfig", key = "#category + ':' + #key")
    public String getConfigValue(String category, String key) {
        return commonMasterRepository.findByCategoryAndKey(category, key)
                .map(CommonMaster::getConfigValue)
                .orElse(null);
    }

    public BigDecimal getConfigValueAsBigDecimal(String category, String key, BigDecimal defaultValue) {
        String value = getConfigValue(category, key);
        if (value == null || value.trim().isEmpty()) {
            log.warn("Config not found: {}.{}, using default: {}", category, key, defaultValue);
            return defaultValue;
        }
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            log.error("Invalid number format for config {}.{}: {}, using default: {}", 
                    category, key, value, defaultValue, e);
            return defaultValue;
        }
    }

    public Integer getConfigValueAsInteger(String category, String key, Integer defaultValue) {
        String value = getConfigValue(category, key);
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.error("Invalid integer format for config {}.{}: {}, using default: {}", 
                    category, key, value, defaultValue, e);
            return defaultValue;
        }
    }

    public Boolean getConfigValueAsBoolean(String category, String key, Boolean defaultValue) {
        String value = getConfigValue(category, key);
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value);
    }

    // Earning/Commission related configs
    public BigDecimal getDefaultCommissionPercentage() {
        return getConfigValueAsBigDecimal("EARNING", "DEFAULT_COMMISSION_PERCENTAGE", 
                new BigDecimal("15.00"));
    }

    public BigDecimal getDefaultLeadPrice() {
        return getConfigValueAsBigDecimal("EARNING", "DEFAULT_LEAD_PRICE", 
                new BigDecimal("50.00"));
    }

    public String getDefaultEarningModel() {
        return getConfigValue("EARNING", "DEFAULT_EARNING_MODEL");
    }

    // Payment related configs - Use Business Rules
    public BigDecimal getMinWithdrawalAmount() {
        // Try business rule first, fallback to CommonMaster
        BigDecimal ruleValue = businessRuleService.getRuleValueAsBigDecimal(
            "MIN_WITHDRAWAL", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsBigDecimal("PAYMENT", "MIN_WITHDRAWAL_AMOUNT", 
                new BigDecimal("500.00"));
    }

    public BigDecimal getMaxWithdrawalAmount() {
        // Try business rule first, fallback to CommonMaster
        BigDecimal ruleValue = businessRuleService.getRuleValueAsBigDecimal(
            "MAX_WITHDRAWAL", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsBigDecimal("PAYMENT", "MAX_WITHDRAWAL_AMOUNT", 
                new BigDecimal("50000.00"));
    }

    public BigDecimal getCancellationFeePercent() {
        return businessRuleService.getRuleValueAsBigDecimal(
            "CANCELLATION_FEE_BEFORE_START", new BigDecimal("10.00"));
    }

    public Integer getPaymentProcessingDays() {
        Integer ruleValue = businessRuleService.getRuleValueAsInteger(
            "PAYMENT_PROCESSING_DAYS", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsInteger("PAYMENT", "PAYMENT_PROCESSING_DAYS", 2);
    }

    // Payment testing / sandbox
    public boolean isTestPaymentModeEnabled() {
        // Prefer feature flag; fallback to CommonMaster
        if (featureFlagService.isFeatureEnabled("TEST_PAYMENT_MODE")) {
            return true;
        }
        return getConfigValueAsBoolean("PAYMENT", "TEST_PAYMENT_MODE", false);
    }

    // Matching related configs - Use Business Rules
    public Integer getProviderResponseTimeoutSeconds() {
        Integer ruleValue = businessRuleService.getRuleValueAsInteger(
            "PROVIDER_RESPONSE_TIMEOUT_SECONDS", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsInteger("MATCHING", "PROVIDER_RESPONSE_TIMEOUT_SECONDS", 120);
    }

    public Integer getMaxProvidersToNotify() {
        Integer ruleValue = businessRuleService.getRuleValueAsInteger(
            "MAX_PROVIDERS_TO_NOTIFY", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsInteger("MATCHING", "MAX_PROVIDERS_TO_NOTIFY", 5);
    }

    public BigDecimal getMinMatchScore() {
        BigDecimal ruleValue = businessRuleService.getRuleValueAsBigDecimal(
            "MIN_MATCH_SCORE", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsBigDecimal("MATCHING", "MIN_MATCH_SCORE", new BigDecimal("50.00"));
    }

    public BigDecimal getMinRatingForProvider() {
        BigDecimal ruleValue = businessRuleService.getRuleValueAsBigDecimal(
            "MIN_RATING_FOR_PROVIDER", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsBigDecimal("PROVIDER", "MIN_RATING_FOR_PROVIDER", new BigDecimal("3.0"));
    }

    public Integer getMaxJobDurationHours() {
        Integer ruleValue = businessRuleService.getRuleValueAsInteger(
            "MAX_JOB_DURATION_HOURS", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsInteger("PLATFORM", "MAX_JOB_DURATION_HOURS", 24);
    }

    public BigDecimal getTravelCompensationMin() {
        BigDecimal ruleValue = businessRuleService.getRuleValueAsBigDecimal(
            "TRAVEL_COMPENSATION_MIN", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsBigDecimal("PROVIDER", "TRAVEL_COMPENSATION_MIN", new BigDecimal("100.00"));
    }

    public BigDecimal getTravelCompensationMax() {
        BigDecimal ruleValue = businessRuleService.getRuleValueAsBigDecimal(
            "TRAVEL_COMPENSATION_MAX", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsBigDecimal("PROVIDER", "TRAVEL_COMPENSATION_MAX", new BigDecimal("200.00"));
    }

    public BigDecimal getProviderNoShowPenalty() {
        BigDecimal ruleValue = businessRuleService.getRuleValueAsBigDecimal(
            "PROVIDER_NO_SHOW_PENALTY", null);
        if (ruleValue != null) {
            return ruleValue;
        }
        return getConfigValueAsBigDecimal("PROVIDER", "PROVIDER_NO_SHOW_PENALTY", new BigDecimal("10.00"));
    }

    // Feature flags - Use FeatureFlagMaster
    public Boolean isFeatureEnabled(String featureCode) {
        // Try FeatureFlagMaster first
        boolean flagEnabled = featureFlagService.isFeatureEnabled(featureCode);
        if (flagEnabled) {
            return true;
        }
        // Fallback to CommonMaster for backward compatibility
        return getConfigValueAsBoolean("FEATURE", featureCode, false);
    }

    public Boolean isFeatureEnabled(String featureCode, Long userId, Long cityId) {
        return featureFlagService.isFeatureEnabled(featureCode, userId, cityId);
    }

    public Boolean isAutoMatchingEnabled() {
        return isFeatureEnabled("AUTO_MATCHING_FEATURE");
    }

    public Boolean isWalletEnabled(Long userId, Long cityId) {
        return isFeatureEnabled("ENABLE_WALLET", userId, cityId);
    }

    public Boolean isSubscriptionEnabled(Long userId, Long cityId) {
        return isFeatureEnabled("ENABLE_SUBSCRIPTION", userId, cityId);
    }

    public Boolean isReferralEnabled(Long userId, Long cityId) {
        return isFeatureEnabled("ENABLE_REFERRAL", userId, cityId);
    }

    public Boolean isRecurringContractsEnabled(Long userId, Long cityId) {
        return isFeatureEnabled("ENABLE_RECURRING_CONTRACTS", userId, cityId);
    }

    public Boolean isQuoteSystemEnabled(Long userId, Long cityId) {
        return isFeatureEnabled("ENABLE_QUOTE_SYSTEM", userId, cityId);
    }
}
