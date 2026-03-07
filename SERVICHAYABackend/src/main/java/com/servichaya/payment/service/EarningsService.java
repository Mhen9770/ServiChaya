package com.servichaya.payment.service;

import com.servichaya.payment.dto.EarningsDto;
import com.servichaya.payment.dto.EarningsSummaryDto;
import com.servichaya.payment.entity.ProviderEarnings;
import com.servichaya.payment.repository.ProviderEarningsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EarningsService {

    private final ProviderEarningsRepository earningsRepository;

    public EarningsSummaryDto getEarningsSummary(Long providerId) {
        log.info("Fetching earnings summary for providerId: {}", providerId);

        BigDecimal totalEarnings = earningsRepository.getTotalEarningsByProviderId(providerId);
        BigDecimal pendingEarnings = earningsRepository.getPendingEarningsByProviderId(providerId);

        if (totalEarnings == null) totalEarnings = BigDecimal.ZERO;
        if (pendingEarnings == null) pendingEarnings = BigDecimal.ZERO;

        BigDecimal paidEarnings = totalEarnings.subtract(pendingEarnings);

        Long totalJobs = earningsRepository.countByProviderId(providerId);
        Long completedJobs = earningsRepository.countByProviderIdAndPayoutStatus(providerId, "PAID");

        return EarningsSummaryDto.builder()
                .totalEarnings(totalEarnings)
                .pendingEarnings(pendingEarnings)
                .paidEarnings(paidEarnings)
                .totalJobs(totalJobs != null ? totalJobs : 0L)
                .completedJobs(completedJobs != null ? completedJobs : 0L)
                .build();
    }

    public Page<EarningsDto> getEarningsHistory(Long providerId, Pageable pageable) {
        log.info("Fetching earnings history for providerId: {}, page: {}, size: {}", 
                providerId, pageable.getPageNumber(), pageable.getPageSize());

        return earningsRepository.findByProviderId(providerId, pageable)
                .map(this::mapToDto);
    }

    private EarningsDto mapToDto(ProviderEarnings earnings) {
        return EarningsDto.builder()
                .id(earnings.getId())
                .providerId(earnings.getProviderId())
                .jobId(earnings.getJobId())
                .jobAmount(earnings.getJobAmount())
                .commissionPercentage(earnings.getCommissionPercentage())
                .commissionAmount(earnings.getCommissionAmount())
                .netEarnings(earnings.getNetEarnings())
                .payoutStatus(earnings.getPayoutStatus())
                .payoutDate(earnings.getPayoutDate())
                .payoutTransactionId(earnings.getPayoutTransactionId())
                .build();
    }
}
