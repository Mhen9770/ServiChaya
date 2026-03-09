package com.servichaya.payment.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "service_commission_master", indexes = {
    @Index(name = "idx_category_city", columnList = "service_category_id, city_id"),
    @Index(name = "idx_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCommissionMaster extends BaseEntity {

    @Column(name = "service_category_id", nullable = false)
    private Long serviceCategoryId;

    @Column(name = "service_type_id")
    private Long serviceTypeId; // NULL = all types in category

    @Column(name = "city_id")
    private Long cityId; // NULL = all cities

    @Column(name = "commission_percentage", precision = 5, scale = 2)
    private BigDecimal commissionPercentage; // 0.00 to 100.00

    @Column(name = "fixed_commission_amount", precision = 10, scale = 2)
    private BigDecimal fixedCommissionAmount; // Alternative to percentage

    @Column(name = "minimum_commission", precision = 10, scale = 2)
    private BigDecimal minimumCommission; // Minimum commission amount

    @Column(name = "maximum_commission", precision = 10, scale = 2)
    private BigDecimal maximumCommission; // Maximum commission amount

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
