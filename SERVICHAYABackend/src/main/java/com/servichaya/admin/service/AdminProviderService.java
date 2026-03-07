package com.servichaya.admin.service;

import com.servichaya.admin.dto.ProviderDto;
import com.servichaya.location.entity.CityMaster;
import com.servichaya.location.entity.PodMaster;
import com.servichaya.location.entity.ZoneMaster;
import com.servichaya.location.repository.CityMasterRepository;
import com.servichaya.location.repository.PodMasterRepository;
import com.servichaya.location.repository.ZoneMasterRepository;
import com.servichaya.provider.entity.ProviderDocument;
import com.servichaya.provider.entity.ProviderPodMap;
import com.servichaya.provider.entity.ProviderSkillMap;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ProviderDocumentRepository;
import com.servichaya.provider.repository.ProviderPodMapRepository;
import com.servichaya.provider.repository.ProviderSkillMapRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.service.entity.ServiceSkillMaster;
import com.servichaya.service.repository.ServiceSkillMasterRepository;
import com.servichaya.user.entity.UserAccount;
import com.servichaya.user.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProviderService {

    private final ServiceProviderProfileRepository providerRepository;
    private final UserAccountRepository userRepository;
    private final com.servichaya.admin.service.ProviderVerificationService verificationService;
    private final ProviderDocumentRepository documentRepository;
    private final ProviderSkillMapRepository skillMapRepository;
    private final ProviderPodMapRepository podMapRepository;
    private final ServiceSkillMasterRepository skillMasterRepository;
    private final CityMasterRepository cityMasterRepository;
    private final ZoneMasterRepository zoneMasterRepository;
    private final PodMasterRepository podMasterRepository;

    public Page<ProviderDto> getProviders(String status, Pageable pageable) {
        log.info("Fetching providers with status: {}, page: {}, size: {}", status, pageable.getPageNumber(), pageable.getPageSize());

        String statusFilter = (status != null && !status.isEmpty() && !"ALL".equals(status)) ? status : null;
        return providerRepository.findAllByStatus(statusFilter, pageable)
                .map(this::mapToDto);
    }

    public void approveProvider(Long providerId, Long adminId, String adminNotes) {
        verificationService.approveProvider(providerId, adminId, adminNotes);
    }

    public void rejectProvider(Long providerId, Long adminId, String rejectionReason) {
        verificationService.rejectProvider(providerId, adminId, rejectionReason);
    }

    public ProviderDto getProviderById(Long providerId) {
        log.info("Fetching provider by id: {}", providerId);
        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> {
                    log.error("Provider not found with id: {}", providerId);
                    return new RuntimeException("Provider not found");
                });
        return mapToDto(provider);
    }

    private ProviderDto mapToDto(ServiceProviderProfile provider) {
        UserAccount user = userRepository.findById(provider.getUserId()).orElse(null);
        
        // Fetch all related data
        List<ProviderDocument> documents = documentRepository.findByProviderId(provider.getId());
        List<ProviderSkillMap> skillMaps = skillMapRepository.findByProviderId(provider.getId());
        List<ProviderPodMap> podMaps = podMapRepository.findByProviderId(provider.getId());
        
        // Map documents
        List<ProviderDto.DocumentDto> documentDtos = documents.stream()
                .map(doc -> ProviderDto.DocumentDto.builder()
                        .id(doc.getId())
                        .documentType(doc.getDocumentType())
                        .documentNumber(doc.getDocumentNumber())
                        .documentUrl(doc.getDocumentUrl())
                        .verificationStatus(doc.getVerificationStatus())
                        .build())
                .collect(Collectors.toList());
        
        // Map skills with skill names
        List<ProviderDto.SkillDto> skillDtos = skillMaps.stream()
                .map(skillMap -> {
                    ServiceSkillMaster skill = skillMasterRepository.findById(skillMap.getSkillId()).orElse(null);
                    return ProviderDto.SkillDto.builder()
                            .id(skillMap.getId())
                            .skillId(skillMap.getSkillId())
                            .skillName(skill != null ? skill.getName() : "Unknown")
                            .experienceYears(skillMap.getExperienceYears())
                            .certificationName(skillMap.getCertificationName())
                            .certificationDocumentUrl(skillMap.getCertificationDocumentUrl())
                            .isPrimary(skillMap.getIsPrimary() != null && skillMap.getIsPrimary())
                            .build();
                })
                .collect(Collectors.toList());
        
        // Map service areas with location names
        List<ProviderDto.ServiceAreaDto> serviceAreaDtos = podMaps.stream()
                .map(podMap -> {
                    CityMaster city = cityMasterRepository.findById(podMap.getCityId()).orElse(null);
                    ZoneMaster zone = podMap.getZoneId() != null 
                            ? zoneMasterRepository.findById(podMap.getZoneId()).orElse(null) 
                            : null;
                    PodMaster pod = podMasterRepository.findById(podMap.getPodId()).orElse(null);
                    
                    return ProviderDto.ServiceAreaDto.builder()
                            .id(podMap.getId())
                            .cityId(podMap.getCityId())
                            .cityName(city != null ? city.getName() : "Unknown")
                            .zoneId(podMap.getZoneId())
                            .zoneName(zone != null ? zone.getName() : "Unknown")
                            .podId(podMap.getPodId())
                            .podName(pod != null ? pod.getName() : "Unknown")
                            .serviceRadiusKm(podMap.getServiceRadiusKm())
                            .isPrimary(podMap.getIsPrimary() != null && podMap.getIsPrimary())
                            .build();
                })
                .collect(Collectors.toList());
        
        return ProviderDto.builder()
                .id(provider.getId())
                .userId(provider.getUserId())
                .providerCode(provider.getProviderCode())
                .businessName(provider.getBusinessName())
                .providerType(provider.getProviderType())
                .email(user != null ? user.getEmail() : null)
                .mobileNumber(user != null ? user.getMobileNumber() : null)
                .rating(provider.getRating())
                .totalJobsCompleted(provider.getTotalJobsCompleted())
                .verificationStatus(provider.getVerificationStatus())
                .profileStatus(provider.getProfileStatus())
                .isAvailable(provider.getIsAvailable())
                .createdAt(provider.getCreatedAt())
                .bio(provider.getBio())
                .experienceYears(provider.getExperienceYears())
                .profileImageUrl(provider.getProfileImageUrl())
                .documents(documentDtos)
                .skills(skillDtos)
                .serviceAreas(serviceAreaDtos)
                .build();
    }
}
