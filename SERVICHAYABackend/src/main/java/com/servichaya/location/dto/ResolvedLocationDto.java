package com.servichaya.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for location resolution response
 * Contains city/zone/pod information resolved from lat/lng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolvedLocationDto {
    
    private Long cityId;
    private String cityName;
    
    private Long zoneId;
    private String zoneName;
    
    private Long podId;
    private String podName;
}
