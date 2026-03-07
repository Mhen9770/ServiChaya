package com.servichaya.payment.repository;

import com.servichaya.payment.entity.ProviderPaymentPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderPaymentPreferenceRepository extends JpaRepository<ProviderPaymentPreference, Long> {

    @Query("SELECT p FROM ProviderPaymentPreference p WHERE p.providerId = :providerId AND p.isActive = true")
    List<ProviderPaymentPreference> findByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT p FROM ProviderPaymentPreference p WHERE p.providerId = :providerId AND " +
           "p.serviceCategoryId = :serviceCategoryId AND p.isActive = true")
    Optional<ProviderPaymentPreference> findByProviderIdAndServiceCategoryId(
            @Param("providerId") Long providerId,
            @Param("serviceCategoryId") Long serviceCategoryId);

    @Query("SELECT p FROM ProviderPaymentPreference p WHERE p.providerId = :providerId AND " +
           "p.serviceCategoryId IS NULL AND p.isActive = true")
    Optional<ProviderPaymentPreference> findDefaultByProviderId(@Param("providerId") Long providerId);
}
