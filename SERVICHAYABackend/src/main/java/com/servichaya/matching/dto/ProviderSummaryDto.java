package com.servichaya.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderSummaryDto {
    private Long id;
    private String businessName;
    private String providerCode;
    private BigDecimal rating;
    private Integer totalJobsCompleted;
}
