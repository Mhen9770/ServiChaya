package com.servichaya.provider.service;

import com.servichaya.provider.entity.ProviderCustomerLink;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ProviderCustomerLinkRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.user.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderReferralService {

    private final ServiceProviderProfileRepository providerRepository;
    private final ProviderCustomerLinkRepository linkRepository;
    private final UserAccountRepository userAccountRepository;

    /**
     * Attach a customer to a provider using providerCode as referral.
     * This is idempotent – calling multiple times will not create duplicates.
     */
    @Transactional
    public void linkCustomerWithReferralCode(Long customerId, String providerCode) {
        if (providerCode == null || providerCode.isBlank()) {
            log.warn("Referral code is null/blank for customerId: {}", customerId);
            return;
        }

        ServiceProviderProfile provider = providerRepository.findByProviderCode(providerCode.trim())
                .orElseThrow(() -> new RuntimeException("Invalid provider referral code"));

        // Ensure customer exists
        userAccountRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Long defaultCategoryId = null; // category-specific linking can be added later

        Optional<ProviderCustomerLink> existing =
                linkRepository.findByProviderIdAndCustomerIdAndCategoryId(provider.getId(), customerId, defaultCategoryId);

        if (existing.isPresent()) {
            log.info("ProviderCustomerLink already exists for providerId: {}, customerId: {}", provider.getId(), customerId);
            return;
        }

        // Try to infer pod/city from customer's primary address if needed in future.
        Long podId = null;
        Long cityId = null;

        ProviderCustomerLink link = ProviderCustomerLink.builder()
                .providerId(provider.getId())
                .customerId(customerId)
                .categoryId(defaultCategoryId)
                .cityId(cityId)
                .podId(podId)
                .isPrimary(true)
                .source("REFERRAL_CODE")
                .build();

        linkRepository.save(link);
        log.info("Created ProviderCustomerLink via referral for providerId: {}, customerId: {}", provider.getId(), customerId);
    }
}

