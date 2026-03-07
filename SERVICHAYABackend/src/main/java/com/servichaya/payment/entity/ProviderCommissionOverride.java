package com.servichaya.payment.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "provider_commission_override", indexes = {
    @Index(name = "idx_provider_category", columnList = "provider_id, service_category_id"),
    @Index(name = "idx_active", columnList = "is_active, effective_from")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderCommissionOverride extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "service_category_id")
    private Long serviceCategoryId;

    @Column(name = "commission_percentage", precision = 5, scale = 2)
    private BigDecimal commissionPercentage;

    @Column(name = "fixed_commission_amount", precision = 10, scale = 2)
    private BigDecimal fixedCommissionAmount;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_until")
    private LocalDate effectiveUntil;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
