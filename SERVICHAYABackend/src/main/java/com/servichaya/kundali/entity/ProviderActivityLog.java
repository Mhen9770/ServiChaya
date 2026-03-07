package com.servichaya.kundali.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "provider_activity_log", indexes = {
    @Index(name = "idx_provider_created", columnList = "provider_id, created_at"),
    @Index(name = "idx_activity_type", columnList = "activity_type, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderActivityLog extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "activity_type", length = 50, nullable = false)
    private String activityType; // LOGIN, JOB_ACCEPTED, JOB_COMPLETED, JOB_CANCELLED, etc.

    @Column(name = "activity_data", columnDefinition = "JSON")
    private String activityData; // Flexible JSON for activity details

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "location_latitude", precision = 10, scale = 8)
    private BigDecimal locationLatitude;

    @Column(name = "location_longitude", precision = 11, scale = 8)
    private BigDecimal locationLongitude;
}
