package com.servichaya.payment.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "provider_earnings", indexes = {
    @Index(name = "idx_provider_job", columnList = "provider_id, job_id"),
    @Index(name = "idx_status", columnList = "payout_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderEarnings extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "job_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal jobAmount;

    @Column(name = "commission_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal commissionPercentage;

    @Column(name = "commission_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal commissionAmount;

    @Column(name = "net_earnings", precision = 10, scale = 2, nullable = false)
    private BigDecimal netEarnings;

    @Column(name = "payout_status", length = 50)
    @Builder.Default
    private String payoutStatus = "PENDING"; // PENDING, PROCESSING, PAID, FAILED

    @Column(name = "payout_date")
    private LocalDateTime payoutDate;

    @Column(name = "payout_transaction_id", length = 255)
    private String payoutTransactionId;
}
