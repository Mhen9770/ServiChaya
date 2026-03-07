package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStatusDto {
    private Integer currentStep;
    private Boolean onboardingCompleted;
    private String profileStatus; // ONBOARDING, PENDING_VERIFICATION, ACTIVE, SUSPENDED
    private String verificationStatus; // PENDING, VERIFIED, REJECTED
    private Long providerId;
}
