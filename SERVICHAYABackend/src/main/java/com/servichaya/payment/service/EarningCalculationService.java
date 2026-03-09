package com.servichaya.payment.service;

import com.servichaya.common.service.ConfigService;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.payment.entity.PlatformEarningConfig;
import com.servichaya.payment.entity.ProviderEarningConfig;
import com.servichaya.payment.repository.PlatformEarningConfigRepository;
import com.servichaya.payment.repository.ProviderEarningConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * Earning Calculation Service - Calculates platform earnings using multiple models:
 * - COMMISSION_ONLY: Platform earns percentage/fixed commission from job amount
 * - LEAD_ONLY: Platform earns fixed/percentage price per lead/job
 * - HYBRID: Platform earns both commission and lead price (weighted)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EarningCalculationService {

    private final PlatformEarningConfigRepository platformConfigRepository;
    private final ProviderEarningConfigRepository providerConfigRepository;
    private final ConfigService configService;

    /**
     * Calculate platform earnings for a job
     * Priority: Provider Config > Platform Config (category/city) > Platform Default > CommonMaster Default
     */
    public EarningResult calculatePlatformEarnings(JobMaster job, Long providerId) {
        log.info("Calculating platform earnings for jobId: {}, providerId: {}, amount: {}", 
                job.getId(), providerId, job.getFinalPrice());

        if (job.getFinalPrice() == null) {
            log.warn("Job final price is null, returning zero earnings");
            return EarningResult.zero();
        }

        BigDecimal jobAmount = job.getFinalPrice();
        Long categoryId = job.getServiceCategoryId();
        Long cityId = job.getCityId();
        LocalDate today = LocalDate.now();

        // PRIORITY 1: Check provider-specific earning config
        ProviderEarningConfig providerConfig = null;
        if (categoryId != null) {
            providerConfig = providerConfigRepository.findActiveConfig(
                    providerId, categoryId, today).orElse(null);
        }
        
        if (providerConfig == null) {
            providerConfig = providerConfigRepository.findDefaultConfig(providerId, today).orElse(null);
        }

        if (providerConfig != null) {
            log.info("Using provider-specific earning config: {}", providerConfig.getEarningModel());
            return calculateEarnings(jobAmount, providerConfig);
        }

        // PRIORITY 2: Check platform earning config (category/city specific)
        PlatformEarningConfig platformConfig = null;
        if (categoryId != null && cityId != null) {
            platformConfig = platformConfigRepository.findActiveConfig(
                    categoryId, cityId, today).orElse(null);
        }
        
        if (platformConfig == null && categoryId != null) {
            platformConfig = platformConfigRepository.findCategoryConfig(categoryId, today).orElse(null);
        }
        
        if (platformConfig == null) {
            platformConfig = platformConfigRepository.findDefaultConfig(today).orElse(null);
        }

        if (platformConfig != null) {
            log.info("Using platform earning config: {}", platformConfig.getEarningModel());
            return calculateEarnings(jobAmount, platformConfig);
        }

        // PRIORITY 3: Use default from CommonMaster
        String defaultModel = configService.getDefaultEarningModel();
        if (defaultModel == null || defaultModel.isEmpty()) {
            defaultModel = "COMMISSION_ONLY"; // Fallback
        }

        log.info("Using default earning model from CommonMaster: {}", defaultModel);
        return calculateDefaultEarnings(jobAmount, defaultModel);
    }

    /**
     * Calculate earnings using ProviderEarningConfig
     */
    private EarningResult calculateEarnings(BigDecimal jobAmount, ProviderEarningConfig config) {
        return calculateEarnings(jobAmount, config.getEarningModel(),
                config.getCommissionPercentage(), config.getFixedCommissionAmount(),
                config.getMinimumCommission(), config.getMaximumCommission(),
                config.getLeadPrice(), config.getLeadPricePercentage(),
                config.getMinimumLeadPrice(), config.getMaximumLeadPrice(),
                config.getHybridCommissionWeight(), config.getHybridLeadWeight());
    }

    /**
     * Calculate earnings using PlatformEarningConfig
     */
    private EarningResult calculateEarnings(BigDecimal jobAmount, PlatformEarningConfig config) {
        return calculateEarnings(jobAmount, config.getEarningModel(),
                config.getCommissionPercentage(), config.getFixedCommissionAmount(),
                config.getMinimumCommission(), config.getMaximumCommission(),
                config.getLeadPrice(), config.getLeadPricePercentage(),
                config.getMinimumLeadPrice(), config.getMaximumLeadPrice(),
                config.getHybridCommissionWeight(), config.getHybridLeadWeight());
    }

    /**
     * Core earning calculation logic
     */
    private EarningResult calculateEarnings(BigDecimal jobAmount, String model,
                                         BigDecimal commissionPercentage, BigDecimal fixedCommission,
                                         BigDecimal minCommission, BigDecimal maxCommission,
                                         BigDecimal leadPrice, BigDecimal leadPricePercentage,
                                         BigDecimal minLeadPrice, BigDecimal maxLeadPrice,
                                         BigDecimal hybridCommissionWeight, BigDecimal hybridLeadWeight) {
        
        BigDecimal commissionEarning = BigDecimal.ZERO;
        BigDecimal leadEarning = BigDecimal.ZERO;
        BigDecimal totalEarning = BigDecimal.ZERO;

        switch (model.toUpperCase()) {
            case "COMMISSION_ONLY":
                commissionEarning = calculateCommission(jobAmount, commissionPercentage, 
                        fixedCommission, minCommission, maxCommission);
                totalEarning = commissionEarning;
                break;

            case "LEAD_ONLY":
                leadEarning = calculateLeadPrice(jobAmount, leadPrice, leadPricePercentage,
                        minLeadPrice, maxLeadPrice);
                totalEarning = leadEarning;
                break;

            case "HYBRID":
                commissionEarning = calculateCommission(jobAmount, commissionPercentage,
                        fixedCommission, minCommission, maxCommission);
                leadEarning = calculateLeadPrice(jobAmount, leadPrice, leadPricePercentage,
                        minLeadPrice, maxLeadPrice);
                
                // Apply weights if specified
                if (hybridCommissionWeight != null && hybridLeadWeight != null) {
                    BigDecimal totalWeight = hybridCommissionWeight.add(hybridLeadWeight);
                    if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
                        commissionEarning = commissionEarning.multiply(hybridCommissionWeight)
                                .divide(totalWeight, 2, RoundingMode.HALF_UP);
                        leadEarning = leadEarning.multiply(hybridLeadWeight)
                                .divide(totalWeight, 2, RoundingMode.HALF_UP);
                    }
                }
                
                totalEarning = commissionEarning.add(leadEarning);
                break;

            default:
                log.warn("Unknown earning model: {}, using COMMISSION_ONLY", model);
                commissionEarning = calculateCommission(jobAmount, commissionPercentage,
                        fixedCommission, minCommission, maxCommission);
                totalEarning = commissionEarning;
        }

        return EarningResult.builder()
                .earningModel(model)
                .commissionEarning(commissionEarning)
                .leadEarning(leadEarning)
                .totalEarning(totalEarning)
                .build();
    }

    /**
     * Calculate commission-based earning
     */
    private BigDecimal calculateCommission(BigDecimal jobAmount, BigDecimal percentage,
                                         BigDecimal fixedAmount, BigDecimal min, BigDecimal max) {
        BigDecimal commission;
        
        if (fixedAmount != null) {
            commission = fixedAmount;
        } else if (percentage != null) {
            commission = jobAmount.multiply(percentage)
                    .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        } else {
            // Use default from CommonMaster
            BigDecimal defaultPercentage = configService.getDefaultCommissionPercentage();
            commission = jobAmount.multiply(defaultPercentage)
                    .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        }
        
        // Apply min/max constraints
        if (min != null && commission.compareTo(min) < 0) {
            commission = min;
        }
        if (max != null && commission.compareTo(max) > 0) {
            commission = max;
        }
        
        return commission;
    }

    /**
     * Calculate lead-based earning
     */
    private BigDecimal calculateLeadPrice(BigDecimal jobAmount, BigDecimal fixedPrice,
                                        BigDecimal percentage, BigDecimal min, BigDecimal max) {
        BigDecimal leadPrice;
        
        if (fixedPrice != null) {
            leadPrice = fixedPrice;
        } else if (percentage != null) {
            leadPrice = jobAmount.multiply(percentage)
                    .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        } else {
            // Use default from CommonMaster
            leadPrice = configService.getDefaultLeadPrice();
        }
        
        // Apply min/max constraints
        if (min != null && leadPrice.compareTo(min) < 0) {
            leadPrice = min;
        }
        if (max != null && leadPrice.compareTo(max) > 0) {
            leadPrice = max;
        }
        
        return leadPrice;
    }

    /**
     * Calculate default earnings when no config found
     */
    private EarningResult calculateDefaultEarnings(BigDecimal jobAmount, String model) {
        BigDecimal defaultCommissionPercentage = configService.getDefaultCommissionPercentage();
        BigDecimal defaultLeadPrice = configService.getDefaultLeadPrice();
        
        return calculateEarnings(jobAmount, model,
                defaultCommissionPercentage, null, null, null,
                defaultLeadPrice, null, null, null,
                new BigDecimal("50"), new BigDecimal("50")); // 50-50 hybrid default
    }

    /**
     * Result class for earning calculation
     */
    @lombok.Data
    @lombok.Builder
    public static class EarningResult {
        private String earningModel;
        private BigDecimal commissionEarning;
        private BigDecimal leadEarning;
        private BigDecimal totalEarning;

        public static EarningResult zero() {
            return EarningResult.builder()
                    .earningModel("COMMISSION_ONLY")
                    .commissionEarning(BigDecimal.ZERO)
                    .leadEarning(BigDecimal.ZERO)
                    .totalEarning(BigDecimal.ZERO)
                    .build();
        }
    }
}
