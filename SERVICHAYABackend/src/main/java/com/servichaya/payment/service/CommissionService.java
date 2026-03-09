package com.servichaya.payment.service;

import com.servichaya.common.service.ConfigService;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.payment.entity.ProviderCommissionOverride;
import com.servichaya.payment.entity.ServiceCommissionMaster;
import com.servichaya.payment.repository.ProviderCommissionOverrideRepository;
import com.servichaya.payment.repository.ServiceCommissionMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * Commission Service - Calculates commission using priority:
 * 1. provider_commission_override (provider-specific, highest priority)
 * 2. service_commission_master (base rates by category/city)
 * 3. Default platform commission from CommonMaster (no hardcoding)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionService {

    private final ProviderCommissionOverrideRepository commissionOverrideRepository;
    private final ServiceCommissionMasterRepository serviceCommissionRepository;
    private final ConfigService configService;

    /**
     * Get commission rate (percentage) for a provider and category
     * Priority: Provider Override > Service Commission Master > Default
     */
    public BigDecimal getCommissionRate(Long providerId, Long serviceCategoryId) {
        return getCommissionRate(providerId, serviceCategoryId, null, null);
    }

    /**
     * Get commission rate with city and service type
     * Priority: Provider Override > Service Commission Master (by city/type) > Default
     */
    public BigDecimal getCommissionRate(Long providerId, Long serviceCategoryId, Long cityId, Long serviceTypeId) {
        log.info("Getting commission rate for providerId: {}, categoryId: {}, cityId: {}, typeId: {}", 
                providerId, serviceCategoryId, cityId, serviceTypeId);

        LocalDate today = LocalDate.now();

        // PRIORITY 1: Check provider_commission_override (provider-specific overrides)
        if (serviceCategoryId != null) {
            ProviderCommissionOverride categoryOverride = commissionOverrideRepository.findActiveOverride(
                    providerId, serviceCategoryId, today).orElse(null);

            if (categoryOverride != null) {
                if (categoryOverride.getCommissionPercentage() != null) {
                    log.info("Using provider category-specific commission percentage: {}", 
                            categoryOverride.getCommissionPercentage());
                    return categoryOverride.getCommissionPercentage();
                } else if (categoryOverride.getFixedCommissionAmount() != null) {
                    // For fixed amount, we need job amount to calculate percentage
                    // This will be handled in calculateCommissionAmount
                    log.info("Provider has fixed commission amount override: {}", 
                            categoryOverride.getFixedCommissionAmount());
                    return null; // Indicates fixed amount, not percentage
                }
            }
        }

        // Check provider default override (serviceCategoryId is NULL)
        ProviderCommissionOverride defaultOverride = commissionOverrideRepository.findDefaultActiveOverride(
                providerId, today).orElse(null);

        if (defaultOverride != null) {
            if (defaultOverride.getCommissionPercentage() != null) {
                log.info("Using provider default commission percentage: {}", defaultOverride.getCommissionPercentage());
                return defaultOverride.getCommissionPercentage();
            } else if (defaultOverride.getFixedCommissionAmount() != null) {
                log.info("Provider has default fixed commission amount: {}", defaultOverride.getFixedCommissionAmount());
                return null; // Indicates fixed amount
            }
        }

        // PRIORITY 2: Check service_commission_master (base rates by category/city/type)
        if (serviceCategoryId != null) {
            ServiceCommissionMaster serviceCommission = null;
            
            // Try most specific: category + type + city
            if (serviceTypeId != null && cityId != null) {
                serviceCommission = serviceCommissionRepository.findSpecificMatch(
                        serviceCategoryId, serviceTypeId, cityId).orElse(null);
            }
            
            // Try category + city (type is NULL)
            if (serviceCommission == null && cityId != null) {
                serviceCommission = serviceCommissionRepository.findCategoryCityMatch(
                        serviceCategoryId, cityId).orElse(null);
            }
            
            // Try category only (type and city are NULL)
            if (serviceCommission == null) {
                serviceCommission = serviceCommissionRepository.findCategoryMatch(serviceCategoryId).orElse(null);
            }
            
            if (serviceCommission != null) {
                if (serviceCommission.getCommissionPercentage() != null) {
                    log.info("Using service commission master percentage: {}", 
                            serviceCommission.getCommissionPercentage());
                    return serviceCommission.getCommissionPercentage();
                } else if (serviceCommission.getFixedCommissionAmount() != null) {
                    log.info("Service commission master has fixed amount: {}", 
                            serviceCommission.getFixedCommissionAmount());
                    return null; // Indicates fixed amount
                }
            }
        }

        // PRIORITY 3: Default platform commission from CommonMaster (no hardcoding)
        BigDecimal defaultCommission = configService.getDefaultCommissionPercentage();
        log.info("Using default platform commission percentage from CommonMaster: {}", defaultCommission);
        return defaultCommission;
    }

    /**
     * Calculate actual commission amount for a job
     * Handles both percentage-based and fixed commission
     */
    public BigDecimal calculateCommissionAmount(Long providerId, Long jobId, BigDecimal jobAmount) {
        log.info("Calculating commission amount for providerId: {}, jobId: {}, jobAmount: {}", 
                providerId, jobId, jobAmount);

        // Get job details for city and category
        // Note: This requires JobMaster, we'll need to inject JobMasterRepository or pass job details
        // For now, using the existing method signature
        
        BigDecimal commissionRate = getCommissionRate(providerId, null);
        
        if (commissionRate == null) {
            // Fixed commission amount from override
            ProviderCommissionOverride override = commissionOverrideRepository
                    .findDefaultActiveOverride(providerId, LocalDate.now()).orElse(null);
            if (override != null && override.getFixedCommissionAmount() != null) {
                return override.getFixedCommissionAmount();
            }
        }
        
        // Percentage-based commission
        BigDecimal commissionAmount = jobAmount.multiply(commissionRate)
                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        
        log.info("Calculated commission amount: {}", commissionAmount);
        return commissionAmount;
    }

    /**
     * Calculate commission amount with full job details
     */
    public BigDecimal calculateCommissionAmount(JobMaster job, Long providerId) {
        if (job == null || job.getFinalPrice() == null) {
            log.warn("Job or final price is null, cannot calculate commission");
            return BigDecimal.ZERO;
        }

        BigDecimal jobAmount = job.getFinalPrice();
        Long categoryId = job.getServiceCategoryId();
        Long cityId = job.getCityId();
        Long serviceTypeId = job.getServiceSkillId(); // Using skill as type

        LocalDate today = LocalDate.now();

        // PRIORITY 1: Provider override (category-specific)
        if (categoryId != null) {
            ProviderCommissionOverride categoryOverride = commissionOverrideRepository.findActiveOverride(
                    providerId, categoryId, today).orElse(null);

            if (categoryOverride != null) {
                if (categoryOverride.getFixedCommissionAmount() != null) {
                    log.info("Using provider fixed commission: {}", categoryOverride.getFixedCommissionAmount());
                    return categoryOverride.getFixedCommissionAmount();
                } else if (categoryOverride.getCommissionPercentage() != null) {
                    BigDecimal amount = jobAmount.multiply(categoryOverride.getCommissionPercentage())
                            .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
                    log.info("Using provider percentage commission: {}% = {}", 
                            categoryOverride.getCommissionPercentage(), amount);
                    return amount;
                }
            }
        }

        // Provider default override
        ProviderCommissionOverride defaultOverride = commissionOverrideRepository.findDefaultActiveOverride(
                providerId, today).orElse(null);

        if (defaultOverride != null) {
            if (defaultOverride.getFixedCommissionAmount() != null) {
                log.info("Using provider default fixed commission: {}", defaultOverride.getFixedCommissionAmount());
                return defaultOverride.getFixedCommissionAmount();
            } else if (defaultOverride.getCommissionPercentage() != null) {
                BigDecimal amount = jobAmount.multiply(defaultOverride.getCommissionPercentage())
                        .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
                log.info("Using provider default percentage: {}% = {}", 
                        defaultOverride.getCommissionPercentage(), amount);
                return amount;
            }
        }

        // PRIORITY 2: Service commission master
        if (categoryId != null) {
            ServiceCommissionMaster serviceCommission = null;
            
            if (serviceTypeId != null && cityId != null) {
                serviceCommission = serviceCommissionRepository.findSpecificMatch(
                        categoryId, serviceTypeId, cityId).orElse(null);
            }
            
            if (serviceCommission == null && cityId != null) {
                serviceCommission = serviceCommissionRepository.findCategoryCityMatch(
                        categoryId, cityId).orElse(null);
            }
            
            if (serviceCommission == null) {
                serviceCommission = serviceCommissionRepository.findCategoryMatch(categoryId).orElse(null);
            }
            
            if (serviceCommission != null) {
                BigDecimal amount;
                
                if (serviceCommission.getFixedCommissionAmount() != null) {
                    amount = serviceCommission.getFixedCommissionAmount();
                } else if (serviceCommission.getCommissionPercentage() != null) {
                    amount = jobAmount.multiply(serviceCommission.getCommissionPercentage())
                            .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
                } else {
                    amount = BigDecimal.ZERO;
                }
                
                // Apply min/max constraints
                if (serviceCommission.getMinimumCommission() != null && 
                    amount.compareTo(serviceCommission.getMinimumCommission()) < 0) {
                    amount = serviceCommission.getMinimumCommission();
                }
                if (serviceCommission.getMaximumCommission() != null && 
                    amount.compareTo(serviceCommission.getMaximumCommission()) > 0) {
                    amount = serviceCommission.getMaximumCommission();
                }
                
                log.info("Using service commission master: {}", amount);
                return amount;
            }
        }

        BigDecimal defaultCommission = configService.getDefaultCommissionPercentage();
        BigDecimal amount = jobAmount.multiply(defaultCommission)
                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        log.info("Using default platform commission from CommonMaster: {}% = {}", defaultCommission, amount);
        return amount;
    }
}
