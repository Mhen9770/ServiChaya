package com.servichaya.provider.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "provider_customer_link",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_provider_customer_category",
            columnNames = {"provider_id", "customer_id", "category_id"}
        )
    },
    indexes = {
        @Index(name = "idx_pcl_customer", columnList = "customer_id"),
        @Index(name = "idx_pcl_provider", columnList = "provider_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderCustomerLink extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    /**
     * Optional category scoping for the relationship.
     * When null, treated as "all categories" for this provider-customer pair.
     */
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "city_id")
    private Long cityId;

    @Column(name = "pod_id")
    private Long podId;

    /**
     * PRIMARY means this provider should be preferred for matching
     * for the given (customer, category, city) combination.
     */
    @Column(name = "is_primary")
    private Boolean isPrimary;

    /**
     * How this link was created.
     * REFERRAL_CODE, SERVICE_HISTORY, ADMIN
     */
    @Column(name = "source", length = 50)
    private String source;
}

