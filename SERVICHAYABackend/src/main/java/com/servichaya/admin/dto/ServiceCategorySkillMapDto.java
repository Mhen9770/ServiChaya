package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategorySkillMapDto {
    private Long id;
    private Long serviceCategoryId;
    private String serviceCategoryName;
    private Long serviceSkillId;
    private String serviceSkillName;
    private Boolean isActive;
}

