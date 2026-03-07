package com.servichaya.kundali.repository;

import com.servichaya.kundali.entity.ProviderActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProviderActivityLogRepository extends JpaRepository<ProviderActivityLog, Long> {

    @Query("SELECT a FROM ProviderActivityLog a WHERE a.providerId = :providerId ORDER BY a.createdAt DESC")
    Page<ProviderActivityLog> findByProviderId(@Param("providerId") Long providerId, Pageable pageable);

    @Query("SELECT a FROM ProviderActivityLog a WHERE a.providerId = :providerId AND a.activityType = :activityType ORDER BY a.createdAt DESC")
    List<ProviderActivityLog> findByProviderIdAndActivityType(
            @Param("providerId") Long providerId,
            @Param("activityType") String activityType);

    @Query("SELECT a FROM ProviderActivityLog a WHERE a.providerId = :providerId AND a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    List<ProviderActivityLog> findByProviderIdAndDateRange(
            @Param("providerId") Long providerId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
