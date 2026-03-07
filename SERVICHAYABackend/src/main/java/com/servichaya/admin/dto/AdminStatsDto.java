package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private Long totalJobs;
    private Long pendingJobs;
    private Long activeProviders;
    private Long pendingVerifications;
    private Long totalCustomers;
    private BigDecimal totalEarnings;
}
