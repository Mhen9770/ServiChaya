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
public class PodMasterDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long cityId;
    private String cityName;
    private Long zoneId;
    private String zoneName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal serviceRadiusKm;
    private Integer maxProviders;
    private Integer maxWorkforce;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
