package com.servichaya.payment.repository;

import com.servichaya.payment.entity.ProviderEarningConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderEarningConfigRepository extends JpaRepository<ProviderEarningConfig, Long> {

    // Find provider-specific config for category
    @Query("SELECT e FROM ProviderEarningConfig e WHERE " +
           "e.providerId = :providerId AND " +
           "e.serviceCategoryId = :categoryId AND " +
           "e.isActive = true AND " +
           "e.effectiveFrom <= :date AND (e.effectiveUntil IS NULL OR e.effectiveUntil >= :date)")
    Optional<ProviderEarningConfig> findActiveConfig(
            @Param("providerId") Long providerId,
            @Param("categoryId") Long categoryId,
            @Param("date") LocalDate date);

    // Find provider default config (category is NULL)
    @Query("SELECT e FROM ProviderEarningConfig e WHERE " +
           "e.providerId = :providerId AND " +
           "e.serviceCategoryId IS NULL AND " +
           "e.isActive = true AND " +
           "e.effectiveFrom <= :date AND (e.effectiveUntil IS NULL OR e.effectiveUntil >= :date)")
    Optional<ProviderEarningConfig> findDefaultConfig(
            @Param("providerId") Long providerId,
            @Param("date") LocalDate date);

    @Query("SELECT e FROM ProviderEarningConfig e WHERE e.providerId = :providerId AND e.isActive = true")
    List<ProviderEarningConfig> findByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT e FROM ProviderEarningConfig e WHERE (:providerId IS NULL OR e.providerId = :providerId) AND e.isActive = true")
    org.springframework.data.domain.Page<ProviderEarningConfig> findByProviderIdOptional(
            @Param("providerId") Long providerId,
            org.springframework.data.domain.Pageable pageable);
}
