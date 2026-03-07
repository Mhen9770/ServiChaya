package com.servichaya.provider.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "provider_pod_map")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderPodMap extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "city_id", nullable = false)
    private Long cityId;

    @Column(name = "zone_id")
    private Long zoneId;

    @Column(name = "pod_id", nullable = false)
    private Long podId;

    @Column(name = "service_radius_km", precision = 5, scale = 2)
    @Builder.Default
    private java.math.BigDecimal serviceRadiusKm = java.math.BigDecimal.valueOf(5.0);

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;
}
