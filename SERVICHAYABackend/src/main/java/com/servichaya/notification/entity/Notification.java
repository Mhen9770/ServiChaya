package com.servichaya.notification.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id, is_read"),
    @Index(name = "idx_type", columnList = "notification_type"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_type", length = 50, nullable = false)
    private String userType; // CUSTOMER, PROVIDER, ADMIN

    @Column(name = "notification_type", length = 50, nullable = false)
    private String notificationType; // JOB_ASSIGNED, JOB_ACCEPTED, JOB_COMPLETED, PAYMENT_RECEIVED, etc.

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType; // JOB, PAYMENT, REVIEW, etc.

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "action_url", length = 500)
    private String actionUrl;

    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata; // Additional data as JSON
}
