package com.servichaya.job.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for provider selection response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderSelectionDto {
    private Long providerId;
    private String providerCode;
    private String providerName;
    private String providerType;
    private Double rating;
    private Integer ratingCount;
    private Integer totalJobsCompleted;
    private Integer experienceYears;
    private String verificationStatus;
    private BigDecimal bidAmount;
    private BigDecimal proposedPrice;
    private Integer rankOrder;
    private Double distanceKm;
    private String bio;
    private String profileImageUrl;
    private Boolean isOnline;
    private Integer unreadMessageCount; // Unread messages from this provider
    private Boolean isPaidProvider; // True if provider has bid amount > 0 (paid platform fee)
}
