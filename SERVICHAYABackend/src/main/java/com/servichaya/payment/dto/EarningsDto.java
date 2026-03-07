package com.servichaya.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarningsDto {
    private Long id;
    private Long providerId;
    private Long jobId;
    private BigDecimal jobAmount;
    private BigDecimal commissionPercentage;
    private BigDecimal commissionAmount;
    private BigDecimal netEarnings;
    private String payoutStatus;
    private LocalDateTime payoutDate;
    private String payoutTransactionId;
}
