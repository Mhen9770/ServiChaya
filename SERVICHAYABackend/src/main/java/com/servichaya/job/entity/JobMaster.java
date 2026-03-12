package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobMaster extends BaseEntity {

    @Column(name = "job_code", unique = true, length = 50, nullable = false)
    private String jobCode;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "service_category_id", nullable = false)
    private Long serviceCategoryId;

    @Column(name = "service_subcategory_id")
    private Long serviceSubCategoryId;

    @Column(name = "service_skill_id")
    private Long serviceSkillId;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "preferred_time")
    private LocalDateTime preferredTime;

    @Column(name = "is_emergency")
    @Builder.Default
    private Boolean isEmergency = false;

    @Column(name = "estimated_budget", precision = 10, scale = 2)
    private BigDecimal estimatedBudget;

    @Column(name = "final_price", precision = 10, scale = 2)
    private BigDecimal finalPrice;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, MATCHED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "pod_id")
    private Long podId;

    @Column(name = "zone_id")
    private Long zoneId;

    @Column(name = "city_id", nullable = false)
    private Long cityId;

    @Column(name = "address_line1", length = 500)
    private String addressLine1;

    @Column(name = "address_line2", length = 500)
    private String addressLine2;

    @Column(name = "pincode", length = 10)
    private String pincode;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "provider_id")
    private Long providerId;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "cancellation_fee", precision = 10, scale = 2)
    private BigDecimal cancellationFee;

    @Column(name = "cancellation_refund_amount", precision = 10, scale = 2)
    private BigDecimal cancellationRefundAmount;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;
}
