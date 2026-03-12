package com.servichaya.notification.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "onesignal_player", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_player_id", columnList = "player_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OneSignalPlayer extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "player_id", unique = true, nullable = false, length = 255)
    private String playerId;

    @Column(name = "device_type", length = 50)
    private String deviceType; // WEB, ANDROID, IOS

    @Column(name = "browser", length = 100)
    private String browser;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
