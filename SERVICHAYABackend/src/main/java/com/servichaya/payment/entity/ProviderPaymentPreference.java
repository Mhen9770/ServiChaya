package com.servichaya.payment.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "provider_payment_preference", indexes = {
    @Index(name = "idx_provider_category", columnList = "provider_id, service_category_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderPaymentPreference extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "service_category_id")
    private Long serviceCategoryId;

    @Column(name = "payment_type", length = 50, nullable = false)
    private String paymentType; // PARTIAL, FULL, POST_WORK

    @Column(name = "partial_payment_percentage", precision = 5, scale = 2)
    private BigDecimal partialPaymentPercentage;

    @Column(name = "minimum_upfront_amount", precision = 10, scale = 2)
    private BigDecimal minimumUpfrontAmount;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
