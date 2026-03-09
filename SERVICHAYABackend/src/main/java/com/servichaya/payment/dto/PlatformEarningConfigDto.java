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
public class PlatformEarningConfigDto {
    private Long id;
    private String earningModel; // COMMISSION_ONLY, LEAD_ONLY, HYBRID
    private Long serviceCategoryId;
    private Long cityId;
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
    private String description;
}
