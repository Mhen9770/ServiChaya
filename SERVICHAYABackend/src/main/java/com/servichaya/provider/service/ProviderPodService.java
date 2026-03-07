package com.servichaya.provider.service;

import com.servichaya.provider.dto.OnboardingStep4Dto;
import com.servichaya.provider.entity.ProviderPodMap;
import com.servichaya.provider.repository.ProviderPodMapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProviderPodService {

    private final ProviderPodMapRepository podMapRepository;

    public void saveServiceAreas(Long providerId, List<OnboardingStep4Dto.ServiceArea> serviceAreas) {
        log.info("Saving service areas for providerId: {}, areasCount: {}", providerId, 
                serviceAreas != null ? serviceAreas.size() : 0);
        
        try {
            // Delete existing service areas for this provider
            podMapRepository.deleteByProviderId(providerId);
            log.debug("Deleted existing service areas for providerId: {}", providerId);
            
            // Save new service areas
            List<ProviderPodMap> podEntities = serviceAreas.stream()
                    .map(area -> {
                        log.debug("Creating service area entity for providerId: {}, podId: {}, cityId: {}", 
                                providerId, area.getPodId(), area.getCityId());
                        return ProviderPodMap.builder()
                                .providerId(providerId)
                                .cityId(area.getCityId())
                                .zoneId(area.getZoneId())
                                .podId(area.getPodId())
                                .serviceRadiusKm(area.getServiceRadiusKm())
                                .isPrimary(area.getIsPrimary())
                                .build();
                    })
                    .collect(Collectors.toList());
            
            List<ProviderPodMap> savedAreas = podMapRepository.saveAll(podEntities);
            log.info("Successfully saved {} service areas for providerId: {}", savedAreas.size(), providerId);
        } catch (Exception e) {
            log.error("Error saving service areas for providerId: {}", providerId, e);
            throw e;
        }
    }
}
