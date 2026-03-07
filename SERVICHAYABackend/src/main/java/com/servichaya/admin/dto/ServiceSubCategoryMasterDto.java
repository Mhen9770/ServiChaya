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
public class ServiceSubCategoryMasterDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long categoryId;
    private String categoryName;
    private String iconUrl;
    private Integer displayOrder;
    private Boolean isFeatured;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
