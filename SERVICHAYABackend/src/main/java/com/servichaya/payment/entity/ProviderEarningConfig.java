package com.servichaya.payment.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Provider-Specific Earning Configuration Override
 * Admin can configure custom earning model for specific providers
 */
@Entity
@Table(name = "provider_earning_config", indexes = {
    @Index(name = "idx_provider_category", columnList = "provider_id, service_category_id"),
    @Index(name = "idx_active", columnList = "is_active, effective_from")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderEarningConfig extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "service_category_id")
    private Long serviceCategoryId; // NULL = default for all categories

    @Column(name = "earning_model", length = 50, nullable = false)
    private String earningModel; // COMMISSION_ONLY, LEAD_ONLY, HYBRID

    // Commission-based earning fields
    @Column(name = "commission_percentage", precision = 5, scale = 2)
    private BigDecimal commissionPercentage;

    @Column(name = "fixed_commission_amount", precision = 10, scale = 2)
    private BigDecimal fixedCommissionAmount;

    @Column(name = "minimum_commission", precision = 10, scale = 2)
    private BigDecimal minimumCommission;

    @Column(name = "maximum_commission", precision = 10, scale = 2)
    private BigDecimal maximumCommission;

    // Lead-based earning fields
    @Column(name = "lead_price", precision = 10, scale = 2)
    private BigDecimal leadPrice;

    @Column(name = "lead_price_percentage", precision = 5, scale = 2)
    private BigDecimal leadPricePercentage;

    @Column(name = "minimum_lead_price", precision = 10, scale = 2)
    private BigDecimal minimumLeadPrice;

    @Column(name = "maximum_lead_price", precision = 10, scale = 2)
    private BigDecimal maximumLeadPrice;

    // Hybrid model fields
    @Column(name = "hybrid_commission_weight", precision = 5, scale = 2)
    private BigDecimal hybridCommissionWeight;

    @Column(name = "hybrid_lead_weight", precision = 5, scale = 2)
    private BigDecimal hybridLeadWeight;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_until")
    private LocalDate effectiveUntil;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "reason", length = 500)
    private String reason; // Why this override exists

    @Column(name = "created_by_admin")
    private Long createdByAdmin; // Admin who created this override
}
