package com.servichaya.admin.service;

import com.servichaya.notification.service.NotificationService;
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
    private final NotificationService notificationService;

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

        // Send notification to provider via all configured channels (in-app + browser push)
        try {
            Long userId = provider.getUserId();
            notificationService.createNotification(
                    userId,
                    "PROVIDER",
                    "PROVIDER_APPROVED",
                    "Your SERVICHAYA provider profile is approved",
                    "Congratulations! Your provider profile has been verified and activated. You can now start receiving jobs.",
                    "PROVIDER",
                    providerId,
                    "/provider/dashboard",
                    null
            );
        } catch (Exception e) {
            log.error("Failed to send provider approval notification for providerId: {}", providerId, e);
        }
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

        // Send notification to provider about rejection with reason
        try {
            Long userId = provider.getUserId();
            notificationService.createNotification(
                    userId,
                    "PROVIDER",
                    "PROVIDER_REJECTED",
                    "Issue with your SERVICHAYA provider verification",
                    String.format("Your provider profile verification was rejected. Reason: %s. Please update your documents and try again.", rejectionReason),
                    "PROVIDER",
                    providerId,
                    "/provider/onboarding",
                    null
            );
        } catch (Exception e) {
            log.error("Failed to send provider rejection notification for providerId: {}", providerId, e);
        }
    }
}
