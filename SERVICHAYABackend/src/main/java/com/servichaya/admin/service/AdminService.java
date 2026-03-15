package com.servichaya.admin.service;

import com.servichaya.admin.dto.AdminDashboardStatsProjection;
import com.servichaya.admin.dto.AdminStatsDto;
import com.servichaya.job.repository.JobMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final JobMasterRepository jobRepository;

    public AdminStatsDto getDashboardStats() {
        log.info("Calculating admin dashboard statistics");

        // Single native query to fetch all high-level dashboard stats
        AdminDashboardStatsProjection stats = jobRepository.getAdminDashboardStatsNative();

        return AdminStatsDto.builder()
                .totalJobs(stats.getTotalJobs() != null ? stats.getTotalJobs() : 0L)
                .pendingJobs(stats.getPendingJobs() != null ? stats.getPendingJobs() : 0L)
                .activeProviders(stats.getActiveProviders() != null ? stats.getActiveProviders() : 0L)
                .pendingVerifications(stats.getPendingVerifications() != null ? stats.getPendingVerifications() : 0L)
                .totalCustomers(stats.getTotalCustomers() != null ? stats.getTotalCustomers() : 0L)
                .totalEarnings(stats.getTotalEarnings() != null ? stats.getTotalEarnings() : java.math.BigDecimal.ZERO)
                .build();
    }
}
