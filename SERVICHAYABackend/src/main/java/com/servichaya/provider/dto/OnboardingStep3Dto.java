package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStep3Dto {
    private List<SkillSelection> skills;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillSelection {
        private Long skillId;
        private Boolean isPrimary;
        private Integer experienceYears;
        private String certificationName; // Optional
        private String certificationDocumentUrl; // Optional
    }
}
