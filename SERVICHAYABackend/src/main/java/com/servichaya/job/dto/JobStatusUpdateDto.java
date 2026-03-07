package com.servichaya.job.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobStatusUpdateDto {
    private String action; // START, COMPLETE, CANCEL
    private BigDecimal finalPrice; // Required for COMPLETE
    private String cancelReason; // Required for CANCEL
}
