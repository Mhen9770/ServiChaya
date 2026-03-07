package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneMasterDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long cityId;
    private String cityName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer servicePriority;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
