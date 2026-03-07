package com.servichaya.provider.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.provider.dto.*;
import com.servichaya.provider.service.ProviderProfileService;
import com.servichaya.provider.service.ProviderSkillService;
import com.servichaya.provider.service.ProviderPodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/provider/profile")
@RequiredArgsConstructor
@Slf4j
public class ProviderProfileController {

    private final ProviderProfileService profileService;
    private final ProviderSkillService skillService;
    private final ProviderPodService podService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProviderProfileDto>> getProfile(@RequestParam Long providerId) {
        log.info("Request to fetch profile for providerId: {}", providerId);
        ProviderProfileDto profile = profileService.getProviderProfile(providerId);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched", profile));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProviderProfileDto>> updateProfile(
            @RequestParam Long providerId,
            @RequestBody UpdateProviderProfileDto dto) {
        log.info("Request to update profile for providerId: {}", providerId);
        ProviderProfileDto profile = profileService.updateProfile(providerId, dto);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", profile));
    }

    @PutMapping("/skills")
    public ResponseEntity<ApiResponse<ProviderProfileDto>> updateSkills(
            @RequestParam Long providerId,
            @RequestBody OnboardingStep3Dto dto) {
        log.info("Request to update skills for providerId: {}, skillsCount: {}", providerId, 
                dto.getSkills() != null ? dto.getSkills().size() : 0);
        skillService.saveSkills(providerId, dto.getSkills());
        ProviderProfileDto profile = profileService.getProviderProfile(providerId);
        return ResponseEntity.ok(ApiResponse.success("Skills updated successfully", profile));
    }

    @PutMapping("/service-areas")
    public ResponseEntity<ApiResponse<ProviderProfileDto>> updateServiceAreas(
            @RequestParam Long providerId,
            @RequestBody OnboardingStep4Dto dto) {
        log.info("Request to update service areas for providerId: {}, areasCount: {}", providerId,
                dto.getServiceAreas() != null ? dto.getServiceAreas().size() : 0);
        podService.saveServiceAreas(providerId, dto.getServiceAreas());
        ProviderProfileDto profile = profileService.getProviderProfile(providerId);
        return ResponseEntity.ok(ApiResponse.success("Service areas updated successfully", profile));
    }
}
