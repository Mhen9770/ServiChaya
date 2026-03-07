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
public class PaymentScheduleDto {
    private Long id;
    private Long jobId;
    private String paymentType;
    private BigDecimal hourlyRate;
    private BigDecimal estimatedHours;
    private BigDecimal upfrontPercentage;
    private BigDecimal upfrontAmount;
    private BigDecimal finalAmount;
    private BigDecimal totalAmount;
    private Boolean upfrontPaid;
    private Boolean finalPaid;
    private LocalDateTime upfrontPaymentDate;
    private LocalDateTime finalPaymentDate;
    private String paymentStatus;
}
