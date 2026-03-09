package com.servichaya.payment.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Platform Earning Configuration - Defines how platform earns from jobs
 * Models: COMMISSION_ONLY, LEAD_ONLY, HYBRID (both)
 */
@Entity
@Table(name = "platform_earning_config", indexes = {
    @Index(name = "idx_category_city", columnList = "service_category_id, city_id"),
    @Index(name = "idx_active", columnList = "is_active, effective_from")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformEarningConfig extends BaseEntity {

    @Column(name = "earning_model", length = 50, nullable = false)
    private String earningModel; // COMMISSION_ONLY, LEAD_ONLY, HYBRID

    @Column(name = "service_category_id")
    private Long serviceCategoryId; // NULL = applies to all categories

    @Column(name = "city_id")
    private Long cityId; // NULL = applies to all cities

    // Commission-based earning fields
    @Column(name = "commission_percentage", precision = 5, scale = 2)
    private BigDecimal commissionPercentage; // For COMMISSION_ONLY or HYBRID

    @Column(name = "fixed_commission_amount", precision = 10, scale = 2)
    private BigDecimal fixedCommissionAmount; // Alternative to percentage

    @Column(name = "minimum_commission", precision = 10, scale = 2)
    private BigDecimal minimumCommission;

    @Column(name = "maximum_commission", precision = 10, scale = 2)
    private BigDecimal maximumCommission;

    // Lead-based earning fields
    @Column(name = "lead_price", precision = 10, scale = 2)
    private BigDecimal leadPrice; // Fixed price per lead/job

    @Column(name = "lead_price_percentage", precision = 5, scale = 2)
    private BigDecimal leadPricePercentage; // Percentage of job amount

    @Column(name = "minimum_lead_price", precision = 10, scale = 2)
    private BigDecimal minimumLeadPrice;

    @Column(name = "maximum_lead_price", precision = 10, scale = 2)
    private BigDecimal maximumLeadPrice;

    // Hybrid model fields (when both commission and lead)
    @Column(name = "hybrid_commission_weight", precision = 5, scale = 2)
    private BigDecimal hybridCommissionWeight; // Weight for commission (0-100)

    @Column(name = "hybrid_lead_weight", precision = 5, scale = 2)
    private BigDecimal hybridLeadWeight; // Weight for lead (0-100)

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_until")
    private LocalDate effectiveUntil;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
