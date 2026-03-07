package com.servichaya.preauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsDto {
    private Long verifiedProviders;
    private Long completedJobs;
    private BigDecimal averageRating;
    private Long citiesCovered;
}
