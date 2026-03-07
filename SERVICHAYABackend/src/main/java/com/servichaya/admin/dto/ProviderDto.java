package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderDto {
    private Long id;
    private Long userId;
    private String providerCode;
    private String businessName;
    private String providerType;
    private String email;
    private String mobileNumber;
    private BigDecimal rating;
    private Integer totalJobsCompleted;
    private String verificationStatus;
    private String profileStatus;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
    
    // Additional verification data
    private String bio;
    private Integer experienceYears;
    private String profileImageUrl;
    private List<DocumentDto> documents;
    private List<SkillDto> skills;
    private List<ServiceAreaDto> serviceAreas;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentDto {
        private Long id;
        private String documentType;
        private String documentNumber;
        private String documentUrl;
        private String verificationStatus;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillDto {
        private Long id;
        private Long skillId;
        private String skillName;
        private Integer experienceYears;
        private String certificationName;
        private String certificationDocumentUrl;
        private Boolean isPrimary;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceAreaDto {
        private Long id;
        private Long cityId;
        private String cityName;
        private Long zoneId;
        private String zoneName;
        private Long podId;
        private String podName;
        private BigDecimal serviceRadiusKm;
        private Boolean isPrimary;
    }
}
