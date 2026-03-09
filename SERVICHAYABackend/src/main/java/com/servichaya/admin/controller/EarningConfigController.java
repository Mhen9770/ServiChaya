package com.servichaya.admin.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.payment.dto.*;
import com.servichaya.payment.service.EarningConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/earning-config")
@RequiredArgsConstructor
@Slf4j
public class EarningConfigController {

    private final EarningConfigService earningConfigService;

    // Platform Earning Config APIs
    @GetMapping("/platform")
    public ResponseEntity<ApiResponse<Page<PlatformEarningConfigDto>>> getPlatformConfigs(
            Pageable pageable) {
        log.info("Fetching platform earning configurations");
        Page<PlatformEarningConfigDto> configs = earningConfigService.getPlatformConfigs(pageable);
        return ResponseEntity.ok(ApiResponse.success("Platform configs fetched", configs));
    }

    @PostMapping("/platform")
    public ResponseEntity<ApiResponse<PlatformEarningConfigDto>> createPlatformConfig(
            @RequestBody CreatePlatformEarningConfigDto dto) {
        log.info("Creating platform earning config: {}", dto);
        PlatformEarningConfigDto config = earningConfigService.createPlatformConfig(dto);
        return ResponseEntity.ok(ApiResponse.success("Platform config created", config));
    }

    @PutMapping("/platform/{id}")
    public ResponseEntity<ApiResponse<PlatformEarningConfigDto>> updatePlatformConfig(
            @PathVariable Long id,
            @RequestBody CreatePlatformEarningConfigDto dto) {
        log.info("Updating platform earning config id: {}", id);
        PlatformEarningConfigDto config = earningConfigService.updatePlatformConfig(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Platform config updated", config));
    }

    // Provider Earning Config APIs
    @GetMapping("/provider")
    public ResponseEntity<ApiResponse<Page<ProviderEarningConfigDto>>> getProviderConfigs(
            @RequestParam(required = false) Long providerId,
            Pageable pageable) {
        log.info("Fetching provider earning configurations, providerId: {}", providerId);
        Page<ProviderEarningConfigDto> configs = earningConfigService.getProviderConfigs(providerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Provider configs fetched", configs));
    }

    @PostMapping("/provider")
    public ResponseEntity<ApiResponse<ProviderEarningConfigDto>> createProviderConfig(
            @RequestBody CreateProviderEarningConfigDto dto) {
        log.info("Creating provider earning config for providerId: {}", dto.getProviderId());
        ProviderEarningConfigDto config = earningConfigService.createProviderConfig(dto);
        return ResponseEntity.ok(ApiResponse.success("Provider config created", config));
    }

    @PutMapping("/provider/{id}")
    public ResponseEntity<ApiResponse<ProviderEarningConfigDto>> updateProviderConfig(
            @PathVariable Long id,
            @RequestBody CreateProviderEarningConfigDto dto) {
        log.info("Updating provider earning config id: {}", id);
        ProviderEarningConfigDto config = earningConfigService.updateProviderConfig(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Provider config updated", config));
    }

    @DeleteMapping("/provider/{id}")
    public ResponseEntity<ApiResponse<String>> deleteProviderConfig(@PathVariable Long id) {
        log.info("Deleting provider earning config id: {}", id);
        earningConfigService.deleteProviderConfig(id);
        return ResponseEntity.ok(ApiResponse.success("Provider config deleted", "Deleted"));
    }
}
