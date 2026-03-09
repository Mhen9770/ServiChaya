package com.servichaya.feedback.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "public_open_point")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicOpenPoint extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50, nullable = false)
    private OpenPointType type; // FEATURE_REQUEST, FLOW_ISSUE, CHANGE_SUGGESTION, BUG, OTHER

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private OpenPointStatus status = OpenPointStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 50)
    @Builder.Default
    private OpenPointPriority priority = OpenPointPriority.MEDIUM;

    @Column(name = "source", length = 50)
    private String source; // PUBLIC, CUSTOMER, PROVIDER, STAFF

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "impact_area", length = 100)
    private String impactArea;

    @Column(name = "url", length = 1000)
    private String url;

    @Column(name = "environment", length = 50)
    private String environment;

    @Column(name = "client_info", length = 1000)
    private String clientInfo;

    @Column(name = "reporter_name", length = 150)
    private String reporterName;

    @Column(name = "reporter_email", length = 150)
    private String reporterEmail;

    @Column(name = "reporter_mobile", length = 20)
    private String reporterMobile;

    @Column(name = "reporter_role", length = 50)
    private String reporterRole; // CUSTOMER, PROVIDER, OTHER

    @Column(name = "reporter_user_id")
    private Long reporterUserId;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    public enum OpenPointType {
        FEATURE_REQUEST,
        FLOW_ISSUE,
        CHANGE_SUGGESTION,
        BUG,
        OTHER
    }

    public enum OpenPointStatus {
        NEW,
        UNDER_REVIEW,
        PLANNED,
        IN_PROGRESS,
        COMPLETED,
        REJECTED
    }

    public enum OpenPointPriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}

