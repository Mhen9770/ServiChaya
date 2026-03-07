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
public class PaymentRequestDto {
    private Long jobId;
    private BigDecimal amount;
    private String paymentMethod; // UPI, CARD, NET_BANKING, WALLET
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}
