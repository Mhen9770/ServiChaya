package com.servichaya.admin.controller;

import com.servichaya.admin.dto.ProviderDto;
import com.servichaya.admin.service.AdminProviderService;
import com.servichaya.auth.service.JwtService;
import com.servichaya.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/providers")
@RequiredArgsConstructor
@Slf4j
public class AdminProviderController {

    private final AdminProviderService providerService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProviderDto>>> getProviders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Fetching providers with status: {}, page: {}, size: {}", status, pageable.getPageNumber(), pageable.getPageSize());
        Page<ProviderDto> providers = providerService.getProviders(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Providers fetched successfully", providers));
    }

    @GetMapping("/{providerId}")
    public ResponseEntity<ApiResponse<ProviderDto>> getProviderById(@PathVariable Long providerId) {
        log.info("Fetching provider by id: {}", providerId);
        ProviderDto provider = providerService.getProviderById(providerId);
        return ResponseEntity.ok(ApiResponse.success("Provider fetched successfully", provider));
    }

    @PostMapping("/{providerId}/approve")
    public ResponseEntity<ApiResponse<String>> approveProvider(
            @PathVariable Long providerId,
            @RequestParam(required = false) String adminNotes,
            HttpServletRequest request) {
        Long adminId = extractUserIdFromToken(request);
        log.info("Request to approve providerId: {} by adminId: {}", providerId, adminId);
        providerService.approveProvider(providerId, adminId, adminNotes);
        return ResponseEntity.ok(ApiResponse.success("Provider approved successfully", "Approved"));
    }

    @PostMapping("/{providerId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectProvider(
            @PathVariable Long providerId,
            @RequestParam String rejectionReason,
            HttpServletRequest request) {
        Long adminId = extractUserIdFromToken(request);
        log.info("Request to reject providerId: {} by adminId: {} with reason: {}", providerId, adminId, rejectionReason);
        providerService.rejectProvider(providerId, adminId, rejectionReason);
        return ResponseEntity.ok(ApiResponse.success("Provider rejected", "Rejected"));
    }

    private Long extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("Authorization header missing or invalid");
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }
        
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        try {
            Long userId = jwtService.extractUserId(token);
            log.debug("Extracted userId: {} from token", userId);
            return userId;
        } catch (Exception e) {
            log.error("Error extracting userId from token", e);
            throw new RuntimeException("Unauthorized: Invalid token", e);
        }
    }
}
