package com.servichaya.provider.service;

import com.servichaya.provider.dto.OnboardingStep3Dto;
import com.servichaya.provider.entity.ProviderSkillMap;
import com.servichaya.provider.repository.ProviderSkillMapRepository;
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
public class ProviderSkillService {

    private final ProviderSkillMapRepository skillMapRepository;

    public void saveSkills(Long providerId, List<OnboardingStep3Dto.SkillSelection> skills) {
        log.info("Saving skills for providerId: {}, skillsCount: {}", providerId, 
                skills != null ? skills.size() : 0);
        
        try {
            // Delete existing skills for this provider
            skillMapRepository.deleteByProviderId(providerId);
            log.debug("Deleted existing skills for providerId: {}", providerId);
            
            // Save new skills
            List<ProviderSkillMap> skillEntities = skills.stream()
                    .map(skill -> {
                        log.debug("Creating skill entity for providerId: {}, skillId: {}, isPrimary: {}", 
                                providerId, skill.getSkillId(), skill.getIsPrimary());
                        return ProviderSkillMap.builder()
                                .providerId(providerId)
                                .skillId(skill.getSkillId())
                                .isPrimary(skill.getIsPrimary())
                                .experienceYears(skill.getExperienceYears())
                                .certificationName(skill.getCertificationName())
                                .certificationDocumentUrl(skill.getCertificationDocumentUrl())
                                .build();
                    })
                    .collect(Collectors.toList());
            
            List<ProviderSkillMap> savedSkills = skillMapRepository.saveAll(skillEntities);
            log.info("Successfully saved {} skills for providerId: {}", savedSkills.size(), providerId);
        } catch (Exception e) {
            log.error("Error saving skills for providerId: {}", providerId, e);
            throw e;
        }
    }
}
