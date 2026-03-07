package com.servichaya.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarningsSummaryDto {
    private BigDecimal totalEarnings;
    private BigDecimal pendingEarnings;
    private BigDecimal paidEarnings;
    private Long totalJobs;
    private Long completedJobs;
}
