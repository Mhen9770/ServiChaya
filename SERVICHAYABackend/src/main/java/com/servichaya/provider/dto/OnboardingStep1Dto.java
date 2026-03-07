package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStep1Dto {
    private String firstName;
    private String lastName;
    private String email;
    private String businessName; // Optional
    private String providerType; // INDIVIDUAL, BUSINESS
}
