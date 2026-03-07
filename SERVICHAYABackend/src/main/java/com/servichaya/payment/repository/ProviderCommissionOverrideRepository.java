package com.servichaya.payment.repository;

import com.servichaya.payment.entity.ProviderCommissionOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderCommissionOverrideRepository extends JpaRepository<ProviderCommissionOverride, Long> {

    @Query("SELECT c FROM ProviderCommissionOverride c WHERE c.providerId = :providerId AND " +
           "c.serviceCategoryId = :serviceCategoryId AND c.isActive = true AND " +
           "c.effectiveFrom <= :date AND (c.effectiveUntil IS NULL OR c.effectiveUntil >= :date)")
    Optional<ProviderCommissionOverride> findActiveOverride(
            @Param("providerId") Long providerId,
            @Param("serviceCategoryId") Long serviceCategoryId,
            @Param("date") LocalDate date);

    @Query("SELECT c FROM ProviderCommissionOverride c WHERE c.providerId = :providerId AND " +
           "c.serviceCategoryId IS NULL AND c.isActive = true AND " +
           "c.effectiveFrom <= :date AND (c.effectiveUntil IS NULL OR c.effectiveUntil >= :date)")
    Optional<ProviderCommissionOverride> findDefaultActiveOverride(
            @Param("providerId") Long providerId,
            @Param("date") LocalDate date);

    @Query("SELECT c FROM ProviderCommissionOverride c WHERE c.providerId = :providerId AND c.isActive = true")
    List<ProviderCommissionOverride> findByProviderId(@Param("providerId") Long providerId);
}
