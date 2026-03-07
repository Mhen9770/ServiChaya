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
public class CreatePaymentScheduleDto {
    private String paymentType; // PARTIAL, FULL, POST_WORK
    private BigDecimal totalAmount;
    private BigDecimal hourlyRate;
    private BigDecimal estimatedHours;
    private BigDecimal upfrontPercentage; // Required if PARTIAL
}
