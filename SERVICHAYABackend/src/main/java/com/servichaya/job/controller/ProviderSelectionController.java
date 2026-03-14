package com.servichaya.job.controller;

import com.servichaya.auth.service.JwtService;
import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.ProviderSelectionDto;
import com.servichaya.job.dto.SubmitBidRequestDto;
import com.servichaya.job.service.ProviderSelectionService;
import com.servichaya.job.entity.ProviderJobBid;
import com.servichaya.matching.dto.ProviderMatchDto;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.provider.entity.ServiceProviderProfile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Provider Selection Controller
 * Handles provider listing, bidding, and selection for jobs
 */
@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
public class ProviderSelectionController {

    private final ProviderSelectionService selectionService;
    private final JwtService jwtService;
    private final ServiceProviderProfileRepository providerRepository;
    private final com.servichaya.matching.service.MatchingService matchingService;

    /**
     * Get available providers for a job (paginated, ranked)
     * Customer can view this after job creation
     */
    @GetMapping("/{jobId}/providers")
    public ResponseEntity<ApiResponse<Page<ProviderSelectionDto>>> getAvailableProviders(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        log.info("Fetching available providers for jobId: {}, page: {}, size: {}", jobId, page, size);

        // Verify customer owns this job
        Long customerId = extractCustomerIdFromToken(request);
        // Note: Additional validation in service layer

        Page<ProviderSelectionDto> providers = selectionService.getAvailableProviders(jobId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Providers fetched successfully", providers));
    }

    /**
     * Submit or update a provider bid
     * Only providers can bid on jobs
     */
    @PostMapping("/{jobId}/providers/{providerId}/bid")
    public ResponseEntity<ApiResponse<ProviderJobBid>> submitBid(
            @PathVariable Long jobId,
            @PathVariable Long providerId,
            @Valid @RequestBody SubmitBidRequestDto requestDto,
            HttpServletRequest request) {
        log.info("Provider {} submitting bid for job {}: bidAmount={}, proposedPrice={}", 
                providerId, jobId, requestDto.getBidAmount(), requestDto.getProposedPrice());

        // Verify provider is authenticated and matches
        Long authenticatedProviderId = extractProviderIdFromToken(request);
        if (!authenticatedProviderId.equals(providerId)) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized: You can only bid as yourself"));
        }

        ProviderJobBid bid = selectionService.submitBid(
                jobId, 
                providerId, 
                requestDto.getBidAmount(), 
                requestDto.getProposedPrice(), 
                requestDto.getNotes()
        );

        return ResponseEntity.ok(ApiResponse.success("Bid submitted successfully", bid));
    }

    /**
     * Get provider's bid for a job
     */
    @GetMapping("/{jobId}/providers/{providerId}/bid")
    public ResponseEntity<ApiResponse<ProviderJobBid>> getProviderBid(
            @PathVariable Long jobId,
            @PathVariable Long providerId) {
        log.info("Fetching bid for provider {} on job {}", providerId, jobId);

        ProviderJobBid bid = selectionService.getProviderBid(jobId, providerId);
        if (bid == null) {
            return ResponseEntity.ok(ApiResponse.success("No bid found", null));
        }

        return ResponseEntity.ok(ApiResponse.success("Bid fetched successfully", bid));
    }

    /**
     * Get matched providers for a job (for customer to see and chat with)
     */
    @GetMapping("/{jobId}/providers/matched")
    public ResponseEntity<ApiResponse<List<com.servichaya.matching.dto.ProviderMatchDto>>> getMatchedProviders(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Fetching matched providers for jobId: {}", jobId);

        // Verify customer owns this job
        Long customerId = extractCustomerIdFromToken(request);
        
        List<ProviderMatchDto> matchedProviders = matchingService.getJobAssignments(jobId);
        return ResponseEntity.ok(ApiResponse.success("Matched providers fetched successfully", matchedProviders));
    }

    /**
     * Customer confirms a provider who has accepted the job
     * This is the final confirmation step after provider accepts
     */
    @PostMapping("/{jobId}/providers/{providerId}/confirm")
    public ResponseEntity<ApiResponse<String>> confirmProviderAcceptance(
            @PathVariable Long jobId,
            @PathVariable Long providerId,
            HttpServletRequest request) {
        log.info("Customer confirming provider {} acceptance for job {}", providerId, jobId);

        // Verify customer owns this job
        Long customerId = extractCustomerIdFromToken(request);
        
        try {
            selectionService.confirmProviderAcceptance(jobId, providerId, customerId);
            return ResponseEntity.ok(ApiResponse.success("Provider confirmed successfully. Job is now accepted.", 
                    "Provider confirmed"));
        } catch (Exception e) {
            log.error("Error confirming provider: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to confirm provider: " + e.getMessage()));
        }
    }

    /**
     * Customer selects a provider for their job (manual selection before provider accepts)
     * This creates/updates a match record and notifies the provider
     */
    @PostMapping("/{jobId}/providers/{providerId}/select")
    public ResponseEntity<ApiResponse<String>> selectProvider(
            @PathVariable Long jobId,
            @PathVariable Long providerId,
            HttpServletRequest request) {
        log.info("Customer selecting provider {} for job {}", providerId, jobId);

        // Verify customer owns this job
        Long customerId = extractCustomerIdFromToken(request);
        
        try {
            selectionService.selectProvider(jobId, providerId, customerId);
            return ResponseEntity.ok(ApiResponse.success("Provider selected successfully. Provider has been notified.", 
                    "Provider selected and notified"));
        } catch (Exception e) {
            log.error("Error selecting provider: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to select provider: " + e.getMessage()));
        }
    }

    private Long extractCustomerIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }

        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }

    private Long extractProviderIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }

        String token = authHeader.substring(7);
        Long userId = jwtService.extractUserId(token);
        
        // Convert userId to provider profile ID
        ServiceProviderProfile provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider profile not found for user"));
        
        return provider.getId();
    }
}
