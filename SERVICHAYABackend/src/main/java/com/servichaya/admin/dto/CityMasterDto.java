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
public class CityMasterDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long stateId;
    private String stateName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String timezone;
    private Long population;
    private Boolean isServiceable;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
