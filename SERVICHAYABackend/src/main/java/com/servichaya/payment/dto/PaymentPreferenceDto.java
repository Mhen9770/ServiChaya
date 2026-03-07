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
public class PaymentPreferenceDto {
    private Long id;
    private Long providerId;
    private Long serviceCategoryId;
    private String paymentType; // PARTIAL, FULL, POST_WORK
    private BigDecimal partialPaymentPercentage;
    private BigDecimal minimumUpfrontAmount;
    private BigDecimal hourlyRate;
    private Boolean isActive;
}
