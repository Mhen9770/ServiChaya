package com.servichaya.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderEarningConfigDto {
    private Long id;
    private Long providerId;
    private Long serviceCategoryId; // NULL = default for all categories
    private String earningModel; // COMMISSION_ONLY, LEAD_ONLY, HYBRID
    private BigDecimal commissionPercentage;
    private BigDecimal fixedCommissionAmount;
    private BigDecimal minimumCommission;
    private BigDecimal maximumCommission;
    private BigDecimal leadPrice;
    private BigDecimal leadPricePercentage;
    private BigDecimal minimumLeadPrice;
    private BigDecimal maximumLeadPrice;
    private BigDecimal hybridCommissionWeight;
    private BigDecimal hybridLeadWeight;
    private LocalDate effectiveFrom;
    private LocalDate effectiveUntil;
    private Boolean isActive;
    private String reason;
    private Long createdByAdmin;
}
