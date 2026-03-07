package com.servichaya.location.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pod_master", indexes = {
    @Index(name = "idx_city_zone", columnList = "city_id,zone_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PodMaster extends MasterEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private CityMaster city;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private ZoneMaster zone;

    @Column(name = "latitude", precision = 10, scale = 8, nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8, nullable = false)
    private BigDecimal longitude;

    @Column(name = "service_radius_km", nullable = false)
    private BigDecimal serviceRadiusKm;

    @Column(name = "max_providers")
    private Integer maxProviders;

    @Column(name = "max_workforce")
    private Integer maxWorkforce;
}
