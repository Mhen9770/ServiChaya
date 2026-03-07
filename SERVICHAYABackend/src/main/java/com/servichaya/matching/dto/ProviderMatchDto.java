package com.servichaya.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderMatchDto {
    private Long matchId;
    private Long jobId;
    private Long providerId;
    private BigDecimal matchScore;
    private String status;
    private LocalDateTime notifiedAt;
    private LocalDateTime respondedAt;
    private Integer rankOrder;
    private JobSummaryDto job;
    private ProviderSummaryDto provider;
}
