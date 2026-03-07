package com.servichaya.provider.service;

import com.servichaya.provider.dto.*;
import com.servichaya.provider.entity.ProviderDocument;
import com.servichaya.provider.entity.ProviderPodMap;
import com.servichaya.provider.entity.ProviderSkillMap;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ProviderDocumentRepository;
import com.servichaya.provider.repository.ProviderPodMapRepository;
import com.servichaya.provider.repository.ProviderSkillMapRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.user.entity.UserAccount;
import com.servichaya.user.entity.UserRoleMaster;
import com.servichaya.user.entity.UserRoleMap;
import com.servichaya.user.repository.UserAccountRepository;
import com.servichaya.user.repository.UserRoleMapRepository;
import com.servichaya.user.repository.UserRoleMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProviderOnboardingService {

    private final ServiceProviderProfileRepository providerRepository;
    private final UserAccountRepository userRepository;
    private final ProviderDocumentService documentService;
    private final ProviderDocumentRepository documentRepository;
    private final ProviderSkillService skillService;
    private final ProviderSkillMapRepository skillMapRepository;
    private final ProviderPodService podService;
    private final ProviderPodMapRepository podMapRepository;
    private final UserRoleMasterRepository roleMasterRepository;
    private final UserRoleMapRepository roleMapRepository;

    public OnboardingStatusDto getOnboardingStatus(Long userId) {
        log.debug("Getting onboarding status for userId: {}", userId);
        ServiceProviderProfile profile = providerRepository.findByUserId(userId)
                .orElse(null);
        
        if (profile == null) {
            log.info("No provider profile found for userId: {}, returning NOT_STARTED status", userId);
            return OnboardingStatusDto.builder()
                    .currentStep(1)
                    .onboardingCompleted(false)
                    .profileStatus("NOT_STARTED")
                    .verificationStatus("PENDING")
                    .build();
        }
        
        log.debug("Provider profile found for userId: {}, step: {}, status: {}", 
                userId, profile.getOnboardingStep(), profile.getProfileStatus());
        return OnboardingStatusDto.builder()
                .currentStep(profile.getOnboardingStep())
                .onboardingCompleted(profile.getOnboardingCompleted())
                .profileStatus(profile.getProfileStatus())
                .verificationStatus(profile.getVerificationStatus())
                .providerId(profile.getId())
                .build();
    }

    public OnboardingStatusDto completeStep1(Long userId, OnboardingStep1Dto dto) {
        log.info("Completing step 1 for userId: {}, firstName: {}, lastName: {}, providerType: {}", 
                userId, dto.getFirstName(), dto.getLastName(), dto.getProviderType());
        
        // Validate input
        if (dto.getFirstName() == null || dto.getFirstName().trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }
        if (dto.getLastName() == null || dto.getLastName().trim().isEmpty()) {
            throw new RuntimeException("Last name is required");
        }
        if (dto.getProviderType() == null || dto.getProviderType().trim().isEmpty()) {
            throw new RuntimeException("Provider type is required");
        }
        
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found for userId: {}", userId);
                    return new RuntimeException("User not found");
                });
        
        ServiceProviderProfile profile = providerRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Creating new provider profile for userId: {}", userId);
                    return createProviderProfile(user);
                });
        
        // Update user info - ensure consistency
        String fullName = (dto.getFirstName() + " " + dto.getLastName()).trim();
        user.setFullName(fullName);
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            // Validate email format
            if (!dto.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new RuntimeException("Invalid email format");
            }
            user.setEmail(dto.getEmail().trim());
            log.debug("Updated email for userId: {}", userId);
        }
        userRepository.save(user);
        log.debug("User info updated for userId: {}", userId);
        
        // Update profile
        if (dto.getBusinessName() != null && !dto.getBusinessName().trim().isEmpty()) {
            profile.setBusinessName(dto.getBusinessName().trim());
        }
        profile.setProviderType(dto.getProviderType());
        profile.setOnboardingStep(2);
        profile = providerRepository.save(profile);
        log.info("Step 1 completed for userId: {}, profileId: {}, moved to step 2", userId, profile.getId());
        
        // Assign SERVICE_PROVIDER role when user starts onboarding
        assignServiceProviderRole(userId);
        
        return OnboardingStatusDto.builder()
                .currentStep(profile.getOnboardingStep())
                .onboardingCompleted(false)
                .profileStatus(profile.getProfileStatus())
                .providerId(profile.getId())
                .build();
    }
    
    /**
     * Assign SERVICE_PROVIDER role to user.
     * If user already has the role, this is a no-op.
     * Users can have both CUSTOMER and SERVICE_PROVIDER roles.
     */
    private void assignServiceProviderRole(Long userId) {
        log.info("Assigning SERVICE_PROVIDER role to userId: {}", userId);
        
        try {
            // Check if user already has SERVICE_PROVIDER role
            Optional<UserRoleMap> existingRoleMap = roleMapRepository.findByUserIdAndRoleCode(userId, "SERVICE_PROVIDER");
            
            if (existingRoleMap.isPresent()) {
                log.debug("User already has SERVICE_PROVIDER role, userId: {}", userId);
                return;
            }
            
            // Get SERVICE_PROVIDER role
            UserRoleMaster serviceProviderRole = roleMasterRepository.findByRoleCode("SERVICE_PROVIDER")
                    .orElseThrow(() -> {
                        log.error("SERVICE_PROVIDER role not found in master data");
                        return new RuntimeException("SERVICE_PROVIDER role not found");
                    });
            
            // Get user
            UserAccount user = userRepository.findById(userId)
                    .orElseThrow(() -> {
                        log.error("User not found for userId: {}", userId);
                        return new RuntimeException("User not found");
                    });
            
            // Create role mapping
            UserRoleMap roleMap = UserRoleMap.builder()
                    .user(user)
                    .role(serviceProviderRole)
                    .assignedAt(LocalDateTime.now())
                    .build();
            
            roleMapRepository.save(roleMap);
            log.info("SERVICE_PROVIDER role assigned successfully to userId: {}", userId);
        } catch (Exception e) {
            log.error("Error assigning SERVICE_PROVIDER role to userId: {}", userId, e);
            // Don't throw exception - role assignment failure shouldn't block onboarding
            // Log the error for investigation
        }
    }

    public OnboardingStatusDto completeStep2(Long userId, OnboardingStep2Dto dto) {
        log.info("Completing step 2 for userId: {}, documentsCount: {}", userId, 
                dto.getDocuments() != null ? dto.getDocuments().size() : 0);
        
        // Validate that step 1 is completed
        ServiceProviderProfile profile = getOrCreateProfile(userId);
        if (profile.getOnboardingStep() < 2) {
            throw new RuntimeException("Step 1 must be completed before step 2");
        }
        
        // Validate documents
        if (dto.getDocuments() == null || dto.getDocuments().isEmpty()) {
            throw new RuntimeException("At least one document is required");
        }
        
        // Validate document URLs
        for (OnboardingStep2Dto.DocumentUpload doc : dto.getDocuments()) {
            if (doc.getDocumentUrl() == null || doc.getDocumentUrl().trim().isEmpty()) {
                throw new RuntimeException("Document URL is required for " + doc.getDocumentType());
            }
            // Basic URL validation
            if (!doc.getDocumentUrl().startsWith("http://") && !doc.getDocumentUrl().startsWith("https://")) {
                throw new RuntimeException("Invalid document URL format for " + doc.getDocumentType());
            }
        }
        
        // Save documents
        documentService.saveDocuments(profile.getId(), dto.getDocuments());
        log.debug("Documents saved for providerId: {}, count: {}", profile.getId(), 
                dto.getDocuments() != null ? dto.getDocuments().size() : 0);
        
        profile.setOnboardingStep(3);
        profile = providerRepository.save(profile);
        log.info("Step 2 completed for userId: {}, profileId: {}, moved to step 3", userId, profile.getId());
        
        return OnboardingStatusDto.builder()
                .currentStep(profile.getOnboardingStep())
                .onboardingCompleted(false)
                .profileStatus(profile.getProfileStatus())
                .providerId(profile.getId())
                .build();
    }

    public OnboardingStatusDto completeStep3(Long userId, OnboardingStep3Dto dto) {
        log.info("Completing step 3 for userId: {}, skillsCount: {}", userId, 
                dto.getSkills() != null ? dto.getSkills().size() : 0);
        
        // Validate that step 2 is completed
        ServiceProviderProfile profile = getOrCreateProfile(userId);
        if (profile.getOnboardingStep() < 3) {
            throw new RuntimeException("Step 2 must be completed before step 3");
        }
        
        // Validate skills
        if (dto.getSkills() == null || dto.getSkills().isEmpty()) {
            throw new RuntimeException("At least one skill is required");
        }
        
        // Validate that at least one skill is marked as primary
        boolean hasPrimary = dto.getSkills().stream()
                .anyMatch(skill -> Boolean.TRUE.equals(skill.getIsPrimary()));
        if (!hasPrimary) {
            throw new RuntimeException("At least one skill must be marked as primary");
        }
        
        // Validate skill data
        for (OnboardingStep3Dto.SkillSelection skill : dto.getSkills()) {
            if (skill.getSkillId() == null || skill.getSkillId() <= 0) {
                throw new RuntimeException("Valid skill ID is required");
            }
            if (skill.getExperienceYears() == null || skill.getExperienceYears() < 0) {
                throw new RuntimeException("Experience years must be a non-negative number");
            }
        }
        
        // Save skills
        skillService.saveSkills(profile.getId(), dto.getSkills());
        log.debug("Skills saved for providerId: {}, count: {}", profile.getId(), 
                dto.getSkills() != null ? dto.getSkills().size() : 0);
        
        profile.setOnboardingStep(4);
        profile = providerRepository.save(profile);
        log.info("Step 3 completed for userId: {}, profileId: {}, moved to step 4", userId, profile.getId());
        
        return OnboardingStatusDto.builder()
                .currentStep(profile.getOnboardingStep())
                .onboardingCompleted(false)
                .profileStatus(profile.getProfileStatus())
                .providerId(profile.getId())
                .build();
    }

    public OnboardingStatusDto completeStep4(Long userId, OnboardingStep4Dto dto) {
        log.info("Completing step 4 for userId: {}, serviceAreasCount: {}", userId, 
                dto.getServiceAreas() != null ? dto.getServiceAreas().size() : 0);
        
        // Validate that step 3 is completed
        ServiceProviderProfile profile = getOrCreateProfile(userId);
        if (profile.getOnboardingStep() < 4) {
            throw new RuntimeException("Step 3 must be completed before step 4");
        }
        
        // Validate service areas
        if (dto.getServiceAreas() == null || dto.getServiceAreas().isEmpty()) {
            throw new RuntimeException("At least one service area is required");
        }
        
        // Validate service area data
        for (OnboardingStep4Dto.ServiceArea area : dto.getServiceAreas()) {
            if (area.getCityId() == null || area.getCityId() <= 0) {
                throw new RuntimeException("Valid city ID is required");
            }
            if (area.getPodId() == null || area.getPodId() <= 0) {
                throw new RuntimeException("Valid POD ID is required");
            }
            if (area.getServiceRadiusKm() == null || area.getServiceRadiusKm().doubleValue() <= 0) {
                throw new RuntimeException("Service radius must be greater than 0");
            }
        }
        
        // Save service areas
        podService.saveServiceAreas(profile.getId(), dto.getServiceAreas());
        log.debug("Service areas saved for providerId: {}, count: {}", profile.getId(), 
                dto.getServiceAreas() != null ? dto.getServiceAreas().size() : 0);
        
        profile.setOnboardingStep(5);
        profile = providerRepository.save(profile);
        log.info("Step 4 completed for userId: {}, profileId: {}, moved to step 5", userId, profile.getId());
        
        return OnboardingStatusDto.builder()
                .currentStep(profile.getOnboardingStep())
                .onboardingCompleted(false)
                .profileStatus(profile.getProfileStatus())
                .providerId(profile.getId())
                .build();
    }

    public OnboardingStatusDto completeStep5(Long userId, OnboardingStep5Dto dto) {
        log.info("Completing step 5 for userId: {}, experienceYears: {}", userId, dto.getExperienceYears());
        
        // Validate that step 4 is completed
        ServiceProviderProfile profile = getOrCreateProfile(userId);
        if (profile.getOnboardingStep() < 5) {
            throw new RuntimeException("Step 4 must be completed before step 5");
        }
        
        // Validate step 5 data
        if (dto.getBio() == null || dto.getBio().trim().isEmpty()) {
            throw new RuntimeException("Bio is required");
        }
        if (dto.getBio().trim().length() < 20) {
            throw new RuntimeException("Bio must be at least 20 characters");
        }
        if (dto.getBio().trim().length() > 500) {
            throw new RuntimeException("Bio must not exceed 500 characters");
        }
        if (dto.getExperienceYears() == null || dto.getExperienceYears() <= 0) {
            throw new RuntimeException("Experience years must be greater than 0");
        }
        
        // Validate that all previous steps have data
        // Check documents
        List<ProviderDocument> documents = documentRepository.findByProviderId(profile.getId());
        if (documents.isEmpty()) {
            throw new RuntimeException("Documents from step 2 are required");
        }
        
        // Check skills
        List<ProviderSkillMap> skills = skillMapRepository.findByProviderId(profile.getId());
        if (skills.isEmpty()) {
            throw new RuntimeException("Skills from step 3 are required");
        }
        
        // Check service areas
        List<ProviderPodMap> serviceAreas = podMapRepository.findByProviderId(profile.getId());
        if (serviceAreas.isEmpty()) {
            throw new RuntimeException("Service areas from step 4 are required");
        }
        
        // Update profile
        profile.setBio(dto.getBio().trim());
        if (dto.getProfileImageUrl() != null && !dto.getProfileImageUrl().trim().isEmpty()) {
            // Validate URL format
            if (!dto.getProfileImageUrl().startsWith("http://") && !dto.getProfileImageUrl().startsWith("https://")) {
                throw new RuntimeException("Invalid profile image URL format");
            }
            profile.setProfileImageUrl(dto.getProfileImageUrl().trim());
        }
        profile.setExperienceYears(dto.getExperienceYears());
        log.debug("Profile updated for providerId: {}", profile.getId());
        
        // Move to verification step
        profile.setOnboardingStep(6);
        profile.setProfileStatus("PENDING_VERIFICATION");
        profile.setOnboardingCompleted(true);
        profile.setOnboardingCompletedAt(LocalDateTime.now());
        profile = providerRepository.save(profile);
        log.info("Step 5 completed for userId: {}, profileId: {}, onboarding completed, status: PENDING_VERIFICATION", 
                userId, profile.getId());
        
        // TODO: Notify admin for verification
        log.info("Provider onboarding completed for userId: {}, profileId: {}, awaiting admin verification", 
                userId, profile.getId());
        
        return OnboardingStatusDto.builder()
                .currentStep(profile.getOnboardingStep())
                .onboardingCompleted(true)
                .profileStatus(profile.getProfileStatus())
                .verificationStatus(profile.getVerificationStatus())
                .providerId(profile.getId())
                .build();
    }

    private ServiceProviderProfile createProviderProfile(UserAccount user) {
        String providerCode = "PROV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        log.info("Creating new provider profile for userId: {}, providerCode: {}", user.getId(), providerCode);
        
        ServiceProviderProfile profile = ServiceProviderProfile.builder()
                .userId(user.getId())
                .providerCode(providerCode)
                .providerType("INDIVIDUAL")
                .onboardingStep(1)
                .profileStatus("ONBOARDING")
                .verificationStatus("PENDING")
                .isAvailable(true)
                .isOnline(false)
                .rating(java.math.BigDecimal.ZERO)
                .ratingCount(0)
                .totalJobsCompleted(0)
                .build();
        
        ServiceProviderProfile savedProfile = providerRepository.save(profile);
        log.info("Provider profile created successfully for userId: {}, profileId: {}, providerCode: {}", 
                user.getId(), savedProfile.getId(), providerCode);
        return savedProfile;
    }

    private ServiceProviderProfile getOrCreateProfile(Long userId) {
        log.debug("Getting or creating profile for userId: {}", userId);
        return providerRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.debug("Profile not found for userId: {}, creating new profile", userId);
                    UserAccount user = userRepository.findById(userId)
                            .orElseThrow(() -> {
                                log.error("User not found for userId: {}", userId);
                                return new RuntimeException("User not found");
                            });
                    return createProviderProfile(user);
                });
    }

    /**
     * Get complete onboarding data for a user.
     * This method provides a unified view of all onboarding steps and their data.
     * Used when resuming onboarding or loading existing data.
     */
    public OnboardingDataDto getOnboardingData(Long userId) {
        log.info("Getting complete onboarding data for userId: {}", userId);
        
        ServiceProviderProfile profile = providerRepository.findByUserId(userId).orElse(null);
        OnboardingStatusDto status = getOnboardingStatus(userId);
        
        if (profile == null) {
            log.debug("No provider profile found for userId: {}, returning empty onboarding data", userId);
            return OnboardingDataDto.builder()
                    .status(status)
                    .step1(OnboardingDataDto.Step1Data.builder().completed(false).build())
                    .step2(OnboardingDataDto.Step2Data.builder().completed(false).build())
                    .step3(OnboardingDataDto.Step3Data.builder().completed(false).build())
                    .step4(OnboardingDataDto.Step4Data.builder().completed(false).build())
                    .step5(OnboardingDataDto.Step5Data.builder().completed(false).build())
                    .build();
        }
        
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Extract Step 1 data
        String[] nameParts = (user.getFullName() != null ? user.getFullName() : "").split(" ", 2);
        OnboardingDataDto.Step1Data step1Data = OnboardingDataDto.Step1Data.builder()
                .firstName(nameParts.length > 0 ? nameParts[0] : "")
                .lastName(nameParts.length > 1 ? nameParts[1] : "")
                .email(user.getEmail())
                .businessName(profile.getBusinessName())
                .providerType(profile.getProviderType())
                .completed(profile.getOnboardingStep() >= 2)
                .build();
        
        // Extract Step 2 data (Documents)
        List<ProviderDocument> documents = documentRepository.findByProviderId(profile.getId());
        OnboardingDataDto.Step2Data step2Data = OnboardingDataDto.Step2Data.builder()
                .documents(documents.stream()
                        .map(doc -> OnboardingDataDto.Step2Data.DocumentInfo.builder()
                                .documentType(doc.getDocumentType())
                                .documentNumber(doc.getDocumentNumber())
                                .documentUrl(doc.getDocumentUrl())
                                .build())
                        .collect(Collectors.toList()))
                .completed(profile.getOnboardingStep() >= 3)
                .build();
        
        // Extract Step 3 data (Skills)
        List<ProviderSkillMap> skills = skillMapRepository.findByProviderId(profile.getId());
        OnboardingDataDto.Step3Data step3Data = OnboardingDataDto.Step3Data.builder()
                .skills(skills.stream()
                        .map(skill -> OnboardingDataDto.Step3Data.SkillInfo.builder()
                                .skillId(skill.getSkillId())
                                .isPrimary(skill.getIsPrimary())
                                .experienceYears(skill.getExperienceYears())
                                .certificationName(skill.getCertificationName())
                                .certificationDocumentUrl(skill.getCertificationDocumentUrl())
                                .build())
                        .collect(Collectors.toList()))
                .completed(profile.getOnboardingStep() >= 4)
                .build();
        
        // Extract Step 4 data (Service Areas)
        List<ProviderPodMap> serviceAreas = podMapRepository.findByProviderId(profile.getId());
        OnboardingDataDto.Step4Data step4Data = OnboardingDataDto.Step4Data.builder()
                .serviceAreas(serviceAreas.stream()
                        .map(area -> OnboardingDataDto.Step4Data.ServiceAreaInfo.builder()
                                .cityId(area.getCityId())
                                .zoneId(area.getZoneId())
                                .podId(area.getPodId())
                                .serviceRadiusKm(area.getServiceRadiusKm())
                                .isPrimary(area.getIsPrimary())
                                .build())
                        .collect(Collectors.toList()))
                .completed(profile.getOnboardingStep() >= 5)
                .build();
        
        // Extract Step 5 data
        OnboardingDataDto.Step5Data step5Data = OnboardingDataDto.Step5Data.builder()
                .bio(profile.getBio())
                .profileImageUrl(profile.getProfileImageUrl())
                .experienceYears(profile.getExperienceYears())
                .completed(profile.getOnboardingStep() >= 6)
                .build();
        
        log.info("Successfully retrieved complete onboarding data for userId: {}, providerId: {}", userId, profile.getId());
        
        return OnboardingDataDto.builder()
                .status(status)
                .step1(step1Data)
                .step2(step2Data)
                .step3(step3Data)
                .step4(step4Data)
                .step5(step5Data)
                .build();
    }
}
