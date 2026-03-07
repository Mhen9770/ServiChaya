package com.servichaya.provider.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_provider_profile")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceProviderProfile extends BaseEntity {

    @Column(name = "user_id", unique = true, nullable = false)
    private Long userId;

    @Column(name = "provider_code", unique = true, length = 50)
    private String providerCode;

    @Column(name = "business_name", length = 255)
    private String businessName;

    @Column(name = "provider_type", length = 50)
    private String providerType; // INDIVIDUAL, BUSINESS

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "rating_count")
    @Builder.Default
    private Integer ratingCount = 0;

    @Column(name = "total_jobs_completed")
    @Builder.Default
    private Integer totalJobsCompleted = 0;

    @Column(name = "verification_status", length = 50)
    @Builder.Default
    private String verificationStatus = "PENDING"; // PENDING, VERIFIED, REJECTED

    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "is_online")
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "background_verified")
    @Builder.Default
    private Boolean backgroundVerified = false;

    @Column(name = "police_verified")
    @Builder.Default
    private Boolean policeVerified = false;

    @Column(name = "avg_response_time_minutes")
    private Integer avgResponseTimeMinutes;

    @Column(name = "profile_status", length = 50)
    @Builder.Default
    private String profileStatus = "ONBOARDING"; // ONBOARDING, PENDING_VERIFICATION, ACTIVE, SUSPENDED

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "onboarding_step")
    @Builder.Default
    private Integer onboardingStep = 1;

    @Column(name = "onboarding_completed")
    @Builder.Default
    private Boolean onboardingCompleted = false;

    @Column(name = "onboarding_completed_at")
    private LocalDateTime onboardingCompletedAt;
}
