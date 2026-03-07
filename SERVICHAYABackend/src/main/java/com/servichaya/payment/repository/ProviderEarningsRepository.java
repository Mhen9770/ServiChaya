package com.servichaya.payment.repository;

import com.servichaya.payment.entity.ProviderEarnings;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface ProviderEarningsRepository extends JpaRepository<ProviderEarnings, Long> {

    Optional<ProviderEarnings> findByJobId(Long jobId);

    @Query("SELECT e FROM ProviderEarnings e WHERE e.providerId = :providerId ORDER BY e.createdAt DESC")
    Page<ProviderEarnings> findByProviderId(@Param("providerId") Long providerId, Pageable pageable);

    @Query("SELECT SUM(e.netEarnings) FROM ProviderEarnings e WHERE e.providerId = :providerId AND e.payoutStatus = 'PAID'")
    BigDecimal getTotalEarningsByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT SUM(e.netEarnings) FROM ProviderEarnings e WHERE e.providerId = :providerId AND e.payoutStatus = 'PENDING'")
    BigDecimal getPendingEarningsByProviderId(@Param("providerId") Long providerId);

    long countByProviderId(Long providerId);

    long countByProviderIdAndPayoutStatus(Long providerId, String payoutStatus);
}
