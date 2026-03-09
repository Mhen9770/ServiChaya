package com.servichaya.payment.repository;

import com.servichaya.payment.entity.PlatformEarningConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformEarningConfigRepository extends JpaRepository<PlatformEarningConfig, Long> {

    // Find most specific match: category + city
    @Query("SELECT e FROM PlatformEarningConfig e WHERE " +
           "e.serviceCategoryId = :categoryId AND " +
           "(e.cityId = :cityId OR e.cityId IS NULL) AND " +
           "e.isActive = true AND " +
           "e.effectiveFrom <= :date AND (e.effectiveUntil IS NULL OR e.effectiveUntil >= :date) " +
           "ORDER BY e.cityId DESC NULLS LAST")
    Optional<PlatformEarningConfig> findActiveConfig(
            @Param("categoryId") Long categoryId,
            @Param("cityId") Long cityId,
            @Param("date") LocalDate date);

    // Find category-only match (city is NULL)
    @Query("SELECT e FROM PlatformEarningConfig e WHERE " +
           "e.serviceCategoryId = :categoryId AND " +
           "e.cityId IS NULL AND " +
           "e.isActive = true AND " +
           "e.effectiveFrom <= :date AND (e.effectiveUntil IS NULL OR e.effectiveUntil >= :date)")
    Optional<PlatformEarningConfig> findCategoryConfig(
            @Param("categoryId") Long categoryId,
            @Param("date") LocalDate date);

    // Find default config (category is NULL)
    @Query("SELECT e FROM PlatformEarningConfig e WHERE " +
           "e.serviceCategoryId IS NULL AND " +
           "e.isActive = true AND " +
           "e.effectiveFrom <= :date AND (e.effectiveUntil IS NULL OR e.effectiveUntil >= :date)")
    Optional<PlatformEarningConfig> findDefaultConfig(@Param("date") LocalDate date);

    @Query("SELECT e FROM PlatformEarningConfig e WHERE e.isActive = true")
    List<PlatformEarningConfig> findAllActive();
}
