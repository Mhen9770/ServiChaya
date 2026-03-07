package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillDto {
    private Long skillId;
    private Boolean isPrimary;
    private Integer experienceYears;
    private String certificationName; // Certification name for this skill
    private String certificationDocumentUrl; // Certification document URL
}
