package com.servichaya.config.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servichaya.config.entity.BusinessRuleMaster;
import com.servichaya.config.repository.BusinessRuleMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessRuleService {

    private final BusinessRuleMasterRepository ruleRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Cacheable(value = "businessRule", key = "#ruleCode")
    public Optional<BusinessRuleMaster> getRule(String ruleCode) {
        log.debug("Fetching business rule: {}", ruleCode);
        return ruleRepository.findActiveByRuleCode(ruleCode);
    }

    public BigDecimal getRuleValueAsBigDecimal(String ruleCode, BigDecimal defaultValue) {
        Optional<BusinessRuleMaster> rule = getRule(ruleCode);
        if (rule.isEmpty() || !rule.get().getIsActive()) {
            log.warn("Business rule not found or inactive: {}, using default: {}", ruleCode, defaultValue);
            return defaultValue;
        }

        BusinessRuleMaster businessRule = rule.get();
        try {
            if ("PERCENTAGE".equals(businessRule.getRuleType()) || "FIXED_AMOUNT".equals(businessRule.getRuleType())) {
                // Parse JSON value
                Map<String, Object> valueMap = parseJsonValue(businessRule.getRuleValue());
                if (valueMap.containsKey("value")) {
                    Object value = valueMap.get("value");
                    if (value instanceof Number) {
                        return BigDecimal.valueOf(((Number) value).doubleValue());
                    }
                }
                // Fallback: try parsing ruleValue directly as number
                return new BigDecimal(businessRule.getRuleValue());
            }
        } catch (Exception e) {
            log.error("Error parsing business rule value for {}: {}", ruleCode, businessRule.getRuleValue(), e);
        }
        return defaultValue;
    }

    public Integer getRuleValueAsInteger(String ruleCode, Integer defaultValue) {
        Optional<BusinessRuleMaster> rule = getRule(ruleCode);
        if (rule.isEmpty() || !rule.get().getIsActive()) {
            log.warn("Business rule not found or inactive: {}, using default: {}", ruleCode, defaultValue);
            return defaultValue;
        }

        BusinessRuleMaster businessRule = rule.get();
        try {
            if ("TIME_DURATION".equals(businessRule.getRuleType())) {
                Map<String, Object> valueMap = parseJsonValue(businessRule.getRuleValue());
                if (valueMap.containsKey("value")) {
                    Object value = valueMap.get("value");
                    if (value instanceof Number) {
                        return ((Number) value).intValue();
                    }
                }
                return Integer.parseInt(businessRule.getRuleValue());
            }
        } catch (Exception e) {
            log.error("Error parsing business rule value for {}: {}", ruleCode, businessRule.getRuleValue(), e);
        }
        return defaultValue;
    }

    public Boolean getRuleValueAsBoolean(String ruleCode, Boolean defaultValue) {
        Optional<BusinessRuleMaster> rule = getRule(ruleCode);
        if (rule.isEmpty() || !rule.get().getIsActive()) {
            log.warn("Business rule not found or inactive: {}, using default: {}", ruleCode, defaultValue);
            return defaultValue;
        }

        BusinessRuleMaster businessRule = rule.get();
        try {
            if ("BOOLEAN".equals(businessRule.getRuleType())) {
                Map<String, Object> valueMap = parseJsonValue(businessRule.getRuleValue());
                if (valueMap.containsKey("value")) {
                    Object value = valueMap.get("value");
                    if (value instanceof Boolean) {
                        return (Boolean) value;
                    }
                    return Boolean.parseBoolean(value.toString());
                }
                return Boolean.parseBoolean(businessRule.getRuleValue());
            }
        } catch (Exception e) {
            log.error("Error parsing business rule value for {}: {}", ruleCode, businessRule.getRuleValue(), e);
        }
        return defaultValue;
    }

    public String getRuleValueAsString(String ruleCode, String defaultValue) {
        Optional<BusinessRuleMaster> rule = getRule(ruleCode);
        if (rule.isEmpty() || !rule.get().getIsActive()) {
            return defaultValue;
        }
        return rule.get().getRuleValue();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonValue(String jsonValue) {
        try {
            if (jsonValue == null || jsonValue.trim().isEmpty()) {
                return new HashMap<>();
            }
            return objectMapper.readValue(jsonValue, Map.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON value: {}, treating as plain string", jsonValue);
            Map<String, Object> map = new HashMap<>();
            map.put("value", jsonValue);
            return map;
        }
    }

    public List<BusinessRuleMaster> getAllActiveRules() {
        return ruleRepository.findAllActive();
    }

    public List<BusinessRuleMaster> getRulesByAppliesTo(String appliesTo) {
        return ruleRepository.findActiveByAppliesTo(List.of(appliesTo, "ALL"));
    }

    @Transactional
    @CacheEvict(value = "businessRule", key = "#rule.ruleCode")
    public BusinessRuleMaster saveRule(BusinessRuleMaster rule) {
        log.info("Saving business rule: {}", rule.getRuleCode());
        return ruleRepository.save(rule);
    }

    @Transactional
    @CacheEvict(value = "businessRule", key = "#ruleCode")
    public void deleteRule(String ruleCode) {
        ruleRepository.findByRuleCode(ruleCode).ifPresent(rule -> {
            rule.setIsActive(false);
            ruleRepository.save(rule);
            log.info("Deactivated business rule: {}", ruleCode);
        });
    }
}
