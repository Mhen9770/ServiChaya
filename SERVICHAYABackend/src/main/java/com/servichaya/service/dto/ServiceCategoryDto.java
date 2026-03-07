package com.servichaya.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private Integer displayOrder;
    private Boolean isFeatured;
    private Long providerCount; // Count of providers offering services in this category
}
