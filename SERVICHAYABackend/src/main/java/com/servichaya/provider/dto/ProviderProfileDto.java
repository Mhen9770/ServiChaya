package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderProfileDto {
    private Long id;
    private Long userId;
    private String providerCode;
    private String businessName;
    private String providerType;
    private String firstName;
    private String lastName;
    private Integer experienceYears;
    private BigDecimal rating;
    private Integer ratingCount;
    private Integer totalJobsCompleted;
    private String verificationStatus;
    private String profileStatus;
    private Boolean isAvailable;
    private String bio;
    private List<SkillDto> skills;
    private List<ServiceAreaDto> serviceAreas;
}
