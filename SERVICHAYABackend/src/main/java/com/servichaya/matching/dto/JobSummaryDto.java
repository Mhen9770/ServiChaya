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
public class JobSummaryDto {
    private Long id;
    private String jobCode;
    private String title;
    private String description;
    private LocalDateTime preferredTime;
    private Boolean isEmergency;
    private BigDecimal estimatedBudget;
    private String addressLine1;
    private String cityName;
}
