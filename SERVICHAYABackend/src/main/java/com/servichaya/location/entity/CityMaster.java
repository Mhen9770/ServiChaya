package com.servichaya.location.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "city_master", indexes = {
    @Index(name = "idx_state_id", columnList = "state_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CityMaster extends MasterEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "state_id", nullable = false)
    private StateMaster state;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "timezone", length = 50)
    private String timezone;

    @Column(name = "population")
    private Long population;

    @Builder.Default
    @Column(name = "is_serviceable", nullable = false)
    private Boolean isServiceable = false;
}
