package com.servichaya.admin.service;

import com.servichaya.admin.dto.AdminStatsDto;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.user.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final JobMasterRepository jobRepository;
    private final ServiceProviderProfileRepository providerRepository;
    private final UserAccountRepository userRepository;

    public AdminStatsDto getDashboardStats() {
        log.info("Calculating admin dashboard statistics");

        long totalJobs = jobRepository.count();
        long pendingJobs = jobRepository.countByStatus("PENDING");
        long activeProviders = providerRepository.countByProfileStatus("ACTIVE");
        long pendingVerifications = providerRepository.countByProfileStatus("PENDING_VERIFICATION");
        long totalCustomers = userRepository.count();

        return AdminStatsDto.builder()
                .totalJobs(totalJobs)
                .pendingJobs(pendingJobs)
                .activeProviders(activeProviders)
                .pendingVerifications(pendingVerifications)
                .totalCustomers(totalCustomers)
                .totalEarnings(java.math.BigDecimal.ZERO)
                .build();
    }
}
