package com.servichaya.provider.service;

import com.servichaya.provider.dto.ProviderProfileDto;
import com.servichaya.provider.dto.ServiceAreaDto;
import com.servichaya.provider.dto.SkillDto;
import com.servichaya.provider.dto.UpdateProviderProfileDto;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.entity.ProviderSkillMap;
import com.servichaya.provider.entity.ProviderPodMap;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.provider.repository.ProviderSkillMapRepository;
import com.servichaya.provider.repository.ProviderPodMapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderProfileService {

    private final ServiceProviderProfileRepository providerRepository;
    private final ProviderSkillMapRepository skillMapRepository;
    private final ProviderPodMapRepository podMapRepository;

    public ProviderProfileDto getProviderProfile(Long providerId) {
        log.info("Fetching provider profile for providerId: {}", providerId);

        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> {
                    log.error("Provider not found with id: {}", providerId);
                    return new RuntimeException("Provider not found");
                });

        List<ProviderSkillMap> skills = skillMapRepository.findByProviderId(providerId);
        List<ProviderPodMap> serviceAreas = podMapRepository.findByProviderId(providerId);

        return ProviderProfileDto.builder()
                .id(provider.getId())
                .userId(provider.getUserId())
                .providerCode(provider.getProviderCode())
                .businessName(provider.getBusinessName())
                .providerType(provider.getProviderType())
                .experienceYears(provider.getExperienceYears())
                .rating(provider.getRating())
                .ratingCount(provider.getRatingCount())
                .totalJobsCompleted(provider.getTotalJobsCompleted())
                .verificationStatus(provider.getVerificationStatus())
                .profileStatus(provider.getProfileStatus())
                .isAvailable(provider.getIsAvailable())
                .bio(provider.getBio())
                .skills(skills.stream().map(s -> SkillDto.builder()
                        .skillId(s.getSkillId())
                        .isPrimary(s.getIsPrimary())
                        .experienceYears(s.getExperienceYears())
                        .certificationName(s.getCertificationName())
                        .certificationDocumentUrl(s.getCertificationDocumentUrl())
                        .build()).collect(Collectors.toList()))
                .serviceAreas(serviceAreas.stream().map(p -> ServiceAreaDto.builder()
                        .cityId(p.getCityId())
                        .zoneId(p.getZoneId())
                        .podId(p.getPodId())
                        .serviceRadiusKm(p.getServiceRadiusKm())
                        .isPrimary(p.getIsPrimary())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public ProviderProfileDto updateProfile(Long providerId, UpdateProviderProfileDto dto) {
        log.info("Updating provider profile for providerId: {}", providerId);

        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        if (dto.getBusinessName() != null) {
            provider.setBusinessName(dto.getBusinessName());
        }
        if (dto.getBio() != null) {
            provider.setBio(dto.getBio());
        }
        if (dto.getExperienceYears() != null) {
            provider.setExperienceYears(dto.getExperienceYears());
        }
        if (dto.getIsAvailable() != null) {
            provider.setIsAvailable(dto.getIsAvailable());
        }

        provider = providerRepository.save(provider);
        log.info("Provider profile updated successfully");

        return getProviderProfile(providerId);
    }
}
