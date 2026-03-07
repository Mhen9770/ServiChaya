package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Comprehensive DTO containing all onboarding data across all steps.
 * This provides a unified view of the provider's onboarding status and data.
 * Used for loading existing data when resuming onboarding.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingDataDto {
    
    // Step 1: Basic Information
    private Step1Data step1;
    
    // Step 2: Documents
    private Step2Data step2;
    
    // Step 3: Skills
    private Step3Data step3;
    
    // Step 4: Service Areas
    private Step4Data step4;
    
    // Step 5: Profile Completion
    private Step5Data step5;
    
    // Overall Status
    private OnboardingStatusDto status;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step1Data {
        private String firstName;
        private String lastName;
        private String email;
        private String businessName;
        private String providerType;
        private Boolean completed;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step2Data {
        private List<DocumentInfo> documents;
        private Boolean completed;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class DocumentInfo {
            private String documentType;
            private String documentNumber;
            private String documentUrl;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step3Data {
        private List<SkillInfo> skills;
        private Boolean completed;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class SkillInfo {
            private Long skillId;
            private Boolean isPrimary;
            private Integer experienceYears;
            private String certificationName;
            private String certificationDocumentUrl;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step4Data {
        private List<ServiceAreaInfo> serviceAreas;
        private Boolean completed;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ServiceAreaInfo {
            private Long cityId;
            private Long zoneId;
            private Long podId;
            private java.math.BigDecimal serviceRadiusKm;
            private Boolean isPrimary;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step5Data {
        private String bio;
        private String profileImageUrl;
        private Integer experienceYears;
        private Boolean completed;
    }
}
