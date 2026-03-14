package com.servichaya.provider.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.provider.dto.ProviderReferralStatsDto;
import com.servichaya.provider.service.ProviderReferralService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/provider/referral")
@RequiredArgsConstructor
@Slf4j
public class ProviderReferralController {

    private final ProviderReferralService referralService;

    /**
     * Link the currently authenticated customer with a provider using a referral code.
     * This endpoint is intended to be called from the customer app after login,
     * when a referral code was present during landing.
     */
    @PostMapping("/link")
    public ResponseEntity<ApiResponse<Void>> linkCustomer(
            @RequestParam Long customerId,
            @RequestParam String providerCode
    ) {
        log.info("Linking customerId: {} with providerCode: {}", customerId, providerCode);
        referralService.linkCustomerWithReferralCode(customerId, providerCode);
        return ResponseEntity.ok(ApiResponse.success("Referral linked successfully", null));
    }

    /**
     * Get referral statistics for a provider
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ProviderReferralStatsDto>> getReferralStats(
            @RequestParam Long providerId
    ) {
        log.info("Fetching referral stats for providerId: {}", providerId);
        ProviderReferralStatsDto stats = referralService.getReferralStats(providerId);
        return ResponseEntity.ok(ApiResponse.success("Referral stats fetched successfully", stats));
    }
}

