package com.servichaya.review.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "job_review", indexes = {
    @Index(name = "idx_job_id", columnList = "job_id"),
    @Index(name = "idx_provider_id", columnList = "provider_id"),
    @Index(name = "idx_customer_id", columnList = "customer_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobReview extends BaseEntity {

    @Column(name = "job_id", nullable = false, unique = true)
    private Long jobId;

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "rating", precision = 3, scale = 2, nullable = false)
    private BigDecimal rating; // 1.00 to 5.00

    @Column(name = "quality_rating", precision = 3, scale = 2)
    private BigDecimal qualityRating;

    @Column(name = "punctuality_rating", precision = 3, scale = 2)
    private BigDecimal punctualityRating;

    @Column(name = "communication_rating", precision = 3, scale = 2)
    private BigDecimal communicationRating;

    @Column(name = "value_rating", precision = 3, scale = 2)
    private BigDecimal valueRating;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @Column(name = "review_photos", columnDefinition = "JSON")
    private String reviewPhotos; // JSON array of photo URLs

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "is_visible")
    @Builder.Default
    private Boolean isVisible = true;
}
