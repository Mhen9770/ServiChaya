package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderReferralStatsDto {
    private String referralCode;
    private String shareableLink;
    private Integer totalReferred;
    private Integer activeCustomers;
    private BigDecimal totalEarningsFromReferrals;
    private Long totalJobsFromReferrals;
    private Double conversionRate; // Percentage of referred customers who became active
}
