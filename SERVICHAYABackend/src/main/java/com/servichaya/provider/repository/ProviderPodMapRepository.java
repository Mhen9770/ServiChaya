package com.servichaya.provider.repository;

import com.servichaya.provider.entity.ProviderPodMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderPodMapRepository extends JpaRepository<ProviderPodMap, Long> {

    List<ProviderPodMap> findByProviderId(Long providerId);

    @Modifying
    @Query("DELETE FROM ProviderPodMap p WHERE p.providerId = :providerId")
    void deleteByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT p FROM ProviderPodMap p WHERE p.providerId = :providerId AND p.podId = :podId")
    java.util.Optional<ProviderPodMap> findByProviderIdAndPodId(@Param("providerId") Long providerId, @Param("podId") Long podId);

    @Query("SELECT p FROM ProviderPodMap p WHERE p.providerId = :providerId AND p.zoneId = :zoneId")
    java.util.Optional<ProviderPodMap> findByProviderIdAndZoneId(@Param("providerId") Long providerId, @Param("zoneId") Long zoneId);

    @Query("SELECT p FROM ProviderPodMap p WHERE p.providerId = :providerId AND p.cityId = :cityId")
    java.util.Optional<ProviderPodMap> findByProviderIdAndCityId(@Param("providerId") Long providerId, @Param("cityId") Long cityId);
}
