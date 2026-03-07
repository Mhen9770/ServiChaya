package com.servichaya.provider.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.provider.dto.*;
import com.servichaya.provider.service.ProviderOnboardingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/provider/onboarding")
@RequiredArgsConstructor
@Slf4j
public class ProviderOnboardingController {

    private final ProviderOnboardingService onboardingService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<OnboardingStatusDto>> getStatus(@RequestParam Long userId) {
        log.info("Getting onboarding status for userId: {}", userId);
        try {
            OnboardingStatusDto status = onboardingService.getOnboardingStatus(userId);
            log.info("Onboarding status retrieved successfully for userId: {}, currentStep: {}, status: {}", 
                    userId, status.getCurrentStep(), status.getProfileStatus());
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (Exception e) {
            log.error("Error getting onboarding status for userId: {}", userId, e);
            throw e;
        }
    }

    @GetMapping("/data")
    public ResponseEntity<ApiResponse<OnboardingDataDto>> getOnboardingData(@RequestParam Long userId) {
        log.info("Getting complete onboarding data for userId: {}", userId);
        try {
            OnboardingDataDto data = onboardingService.getOnboardingData(userId);
            log.info("Onboarding data retrieved successfully for userId: {}, currentStep: {}", 
                    userId, data.getStatus().getCurrentStep());
            return ResponseEntity.ok(ApiResponse.success("Onboarding data retrieved successfully", data));
        } catch (Exception e) {
            log.error("Error getting onboarding data for userId: {}", userId, e);
            throw e;
        }
    }

    @PostMapping("/step/1")
    public ResponseEntity<ApiResponse<OnboardingStatusDto>> completeStep1(
            @RequestParam Long userId,
            @RequestBody OnboardingStep1Dto dto) {
        log.info("Completing onboarding step 1 for userId: {}, providerType: {}", userId, dto.getProviderType());
        try {
            OnboardingStatusDto status = onboardingService.completeStep1(userId, dto);
            log.info("Step 1 completed successfully for userId: {}, moved to step: {}", userId, status.getCurrentStep());
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (Exception e) {
            log.error("Error completing step 1 for userId: {}", userId, e);
            throw e;
        }
    }

    @PostMapping("/step/2")
    public ResponseEntity<ApiResponse<OnboardingStatusDto>> completeStep2(
            @RequestParam Long userId,
            @RequestBody OnboardingStep2Dto dto) {
        log.info("Completing onboarding step 2 for userId: {}, documentsCount: {}", userId, 
                dto.getDocuments() != null ? dto.getDocuments().size() : 0);
        try {
            OnboardingStatusDto status = onboardingService.completeStep2(userId, dto);
            log.info("Step 2 completed successfully for userId: {}, moved to step: {}", userId, status.getCurrentStep());
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (Exception e) {
            log.error("Error completing step 2 for userId: {}", userId, e);
            throw e;
        }
    }

    @PostMapping("/step/3")
    public ResponseEntity<ApiResponse<OnboardingStatusDto>> completeStep3(
            @RequestParam Long userId,
            @RequestBody OnboardingStep3Dto dto) {
        log.info("Completing onboarding step 3 for userId: {}, skillsCount: {}", userId, 
                dto.getSkills() != null ? dto.getSkills().size() : 0);
        try {
            OnboardingStatusDto status = onboardingService.completeStep3(userId, dto);
            log.info("Step 3 completed successfully for userId: {}, moved to step: {}", userId, status.getCurrentStep());
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (Exception e) {
            log.error("Error completing step 3 for userId: {}", userId, e);
            throw e;
        }
    }

    @PostMapping("/step/4")
    public ResponseEntity<ApiResponse<OnboardingStatusDto>> completeStep4(
            @RequestParam Long userId,
            @RequestBody OnboardingStep4Dto dto) {
        log.info("Completing onboarding step 4 for userId: {}, serviceAreasCount: {}", userId, 
                dto.getServiceAreas() != null ? dto.getServiceAreas().size() : 0);
        try {
            OnboardingStatusDto status = onboardingService.completeStep4(userId, dto);
            log.info("Step 4 completed successfully for userId: {}, moved to step: {}", userId, status.getCurrentStep());
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (Exception e) {
            log.error("Error completing step 4 for userId: {}", userId, e);
            throw e;
        }
    }

    @PostMapping("/step/5")
    public ResponseEntity<ApiResponse<OnboardingStatusDto>> completeStep5(
            @RequestParam Long userId,
            @RequestBody OnboardingStep5Dto dto) {
        log.info("Completing onboarding step 5 for userId: {}, experienceYears: {}", userId, dto.getExperienceYears());
        try {
            OnboardingStatusDto status = onboardingService.completeStep5(userId, dto);
            log.info("Step 5 completed successfully for userId: {}, onboardingCompleted: {}, profileStatus: {}", 
                    userId, status.getOnboardingCompleted(), status.getProfileStatus());
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (Exception e) {
            log.error("Error completing step 5 for userId: {}", userId, e);
            throw e;
        }
    }
}
