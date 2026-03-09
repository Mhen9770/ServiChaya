package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryMasterDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private Integer displayOrder;
    private Boolean isFeatured;
    private Boolean isActive;
    
    // Hierarchical fields
    private Long parentId;
    private String parentName;
    private String categoryType; // ELECTRONICS, APPLIANCE, HOME_SERVICE, etc.
    private Integer level; // 0 = root, 1 = first level, etc.
    private String path; // Full path for display
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
