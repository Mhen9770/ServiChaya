package com.servichaya.provider.service;

import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.payment.entity.ProviderEarnings;
import com.servichaya.payment.repository.ProviderEarningsRepository;
import com.servichaya.provider.dto.ProviderReferralStatsDto;
import com.servichaya.provider.entity.ProviderCustomerLink;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ProviderCustomerLinkRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.user.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderReferralService {

    private final ServiceProviderProfileRepository providerRepository;
    private final ProviderCustomerLinkRepository linkRepository;
    private final UserAccountRepository userAccountRepository;
    private final JobMasterRepository jobRepository;
    private final ProviderEarningsRepository earningsRepository;

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

    /**
     * Get referral statistics for a provider
     */
    @Transactional(readOnly = true)
    public ProviderReferralStatsDto getReferralStats(Long providerId) {
        log.info("Fetching referral stats for providerId: {}", providerId);

        // Get all customers referred by this provider
        List<ProviderCustomerLink> referralLinks = linkRepository.findByProviderId(providerId)
                .stream()
                .filter(link -> "REFERRAL_CODE".equals(link.getSource()))
                .toList();

        long totalReferred = referralLinks.size();

        // Count active customers (customers who have completed at least one job)
        long activeCustomers = referralLinks.stream()
                .mapToLong(link -> {
                    long completedJobs = jobRepository.findByCustomerIdAndIsDeletedFalse(link.getCustomerId(), 
                            org.springframework.data.domain.Pageable.unpaged())
                            .getContent()
                            .stream()
                            .filter(job -> "COMPLETED".equals(job.getStatus()) && 
                                    providerId.equals(job.getProviderId()))
                            .count();
                    return completedJobs > 0 ? 1 : 0;
                })
                .sum();

        // Calculate total earnings from referred customers
        BigDecimal totalEarningsFromReferrals = BigDecimal.ZERO;
        long totalJobsFromReferrals = 0;

        for (ProviderCustomerLink link : referralLinks) {
            List<JobMaster> customerJobs = jobRepository.findByCustomerIdAndIsDeletedFalse(
                    link.getCustomerId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
            
            for (JobMaster job : customerJobs) {
                if (providerId.equals(job.getProviderId()) && 
                    (job.getStatus().equals("COMPLETED") || job.getStatus().equals("PAYMENT_PENDING"))) {
                    Optional<ProviderEarnings> earnings = earningsRepository.findByJobIdAndProviderId(job.getId(), providerId);
                    if (earnings.isPresent() && earnings.get().getNetEarnings() != null) {
                        totalEarningsFromReferrals = totalEarningsFromReferrals.add(earnings.get().getNetEarnings());
                        totalJobsFromReferrals++;
                    }
                }
            }
        }

        // Get provider code for shareable link
        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found: " + providerId));

        String referralCode = provider.getProviderCode();
        // Shareable link - login page with referral code (login page handles new user registration)
        String shareableLink = referralCode != null ? 
                "/login?ref=" + referralCode : null;

        return ProviderReferralStatsDto.builder()
                .referralCode(referralCode)
                .shareableLink(shareableLink)
                .totalReferred((int) totalReferred)
                .activeCustomers((int) activeCustomers)
                .totalEarningsFromReferrals(totalEarningsFromReferrals)
                .totalJobsFromReferrals(totalJobsFromReferrals)
                .conversionRate(totalReferred > 0 ? 
                        (double) activeCustomers / totalReferred * 100 : 0.0)
                .build();
    }
}

