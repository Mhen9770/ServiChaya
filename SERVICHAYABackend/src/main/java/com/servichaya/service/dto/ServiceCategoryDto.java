package com.servichaya.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
    
    // Hierarchical structure
    private Long parentId;
    private String parentName;
    private String categoryType; // ELECTRONICS, APPLIANCE, etc.
    private Integer level; // 0 = root, 1 = first level, etc.
    private String path; // Full path for display
    
    // Children categories (unlimited depth)
    private List<ServiceCategoryDto> children;
    
    // Legacy support - will be populated from children
    @Deprecated
    private java.util.List<ServiceSubCategoryDto> subCategories;
}
