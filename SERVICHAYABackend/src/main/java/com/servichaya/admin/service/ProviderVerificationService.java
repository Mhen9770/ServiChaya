package com.servichaya.admin.service;

import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderVerificationService {

    private final ServiceProviderProfileRepository providerRepository;

    @Transactional
    public void approveProvider(Long providerId, Long adminId, String adminNotes) {
        log.info("Approving providerId: {} by adminId: {}", providerId, adminId);

        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> {
                    log.error("Provider not found with id: {}", providerId);
                    return new RuntimeException("Provider not found");
                });

        if (!"PENDING_VERIFICATION".equals(provider.getProfileStatus())) {
            log.error("Provider {} is not in PENDING_VERIFICATION status. Current status: {}", 
                    providerId, provider.getProfileStatus());
            throw new RuntimeException("Provider is not in pending verification status");
        }

        provider.setVerificationStatus("VERIFIED");
        provider.setProfileStatus("ACTIVE");
        provider.setIsAvailable(true);
        providerRepository.save(provider);

        log.info("Provider {} approved successfully by admin {}", providerId, adminId);
    }

    @Transactional
    public void rejectProvider(Long providerId, Long adminId, String rejectionReason) {
        log.info("Rejecting providerId: {} by adminId: {} with reason: {}", providerId, adminId, rejectionReason);

        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> {
                    log.error("Provider not found with id: {}", providerId);
                    return new RuntimeException("Provider not found");
                });

        if (!"PENDING_VERIFICATION".equals(provider.getProfileStatus())) {
            log.error("Provider {} is not in PENDING_VERIFICATION status. Current status: {}", 
                    providerId, provider.getProfileStatus());
            throw new RuntimeException("Provider is not in pending verification status");
        }

        provider.setVerificationStatus("REJECTED");
        provider.setProfileStatus("ONBOARDING");
        provider.setIsAvailable(false);
        providerRepository.save(provider);

        log.info("Provider {} rejected by admin {} with reason: {}", providerId, adminId, rejectionReason);
    }
}
