package com.servichaya.payment.service;

import com.servichaya.payment.entity.ProviderCommissionOverride;
import com.servichaya.payment.repository.ProviderCommissionOverrideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionService {

    private final ProviderCommissionOverrideRepository commissionOverrideRepository;
    private static final BigDecimal DEFAULT_COMMISSION_PERCENTAGE = new BigDecimal("15.00");

    public BigDecimal getCommissionRate(Long providerId, Long serviceCategoryId) {
        log.info("Getting commission rate for providerId: {}, serviceCategoryId: {}", 
                providerId, serviceCategoryId);

        LocalDate today = LocalDate.now();

        if (serviceCategoryId != null) {
            ProviderCommissionOverride override = commissionOverrideRepository.findActiveOverride(
                    providerId, serviceCategoryId, today).orElse(null);

            if (override != null) {
                if (override.getCommissionPercentage() != null) {
                    log.info("Using provider-specific commission percentage: {}", override.getCommissionPercentage());
                    return override.getCommissionPercentage();
                } else if (override.getFixedCommissionAmount() != null) {
                    log.info("Using provider-specific fixed commission amount: {}", override.getFixedCommissionAmount());
                    return override.getFixedCommissionAmount();
                }
            }
        }

        ProviderCommissionOverride defaultOverride = commissionOverrideRepository.findDefaultActiveOverride(
                providerId, today).orElse(null);

        if (defaultOverride != null) {
            if (defaultOverride.getCommissionPercentage() != null) {
                log.info("Using provider default commission percentage: {}", defaultOverride.getCommissionPercentage());
                return defaultOverride.getCommissionPercentage();
            } else if (defaultOverride.getFixedCommissionAmount() != null) {
                log.info("Using provider default fixed commission amount: {}", defaultOverride.getFixedCommissionAmount());
                return defaultOverride.getFixedCommissionAmount();
            }
        }

        log.info("Using default platform commission percentage: {}", DEFAULT_COMMISSION_PERCENTAGE);
        return DEFAULT_COMMISSION_PERCENTAGE;
    }
}
