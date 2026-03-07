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
public class CreatePaymentPreferenceDto {
    private Long serviceCategoryId; // null for default
    private String paymentType; // PARTIAL, FULL, POST_WORK
    private BigDecimal partialPaymentPercentage; // Required if PARTIAL
    private BigDecimal minimumUpfrontAmount;
    private BigDecimal hourlyRate;
}
