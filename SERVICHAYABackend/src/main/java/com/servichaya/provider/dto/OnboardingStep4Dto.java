package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStep4Dto {
    private List<ServiceArea> serviceAreas;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceArea {
        private Long cityId;
        private Long zoneId;
        private Long podId;
        private BigDecimal serviceRadiusKm;
        private Boolean isPrimary;
    }
}
