package com.servichaya.user.entity;

import com.servichaya.common.entity.BaseEntity;
import com.servichaya.location.entity.CityMaster;
import com.servichaya.location.entity.PodMaster;
import com.servichaya.location.entity.ZoneMaster;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "user_address", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_city_id", columnList = "city_id"),
    @Index(name = "idx_pod_id", columnList = "pod_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAddress extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "address_label", length = 100)
    private String addressLabel;

    @Column(name = "address_line1", length = 255, nullable = false)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "landmark", length = 255)
    private String landmark;

    @Column(name = "pincode", length = 10)
    private String pincode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private CityMaster city;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    private ZoneMaster zone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pod_id")
    private PodMaster pod;

    @Column(name = "latitude", precision = 10, scale = 8, nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8, nullable = false)
    private BigDecimal longitude;

    @Builder.Default
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Builder.Default
    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;
}
