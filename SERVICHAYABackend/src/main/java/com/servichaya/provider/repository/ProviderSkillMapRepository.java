package com.servichaya.provider.repository;

import com.servichaya.provider.entity.ProviderSkillMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderSkillMapRepository extends JpaRepository<ProviderSkillMap, Long> {

    List<ProviderSkillMap> findByProviderId(Long providerId);

    @Modifying
    @Query("DELETE FROM ProviderSkillMap s WHERE s.providerId = :providerId")
    void deleteByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT s FROM ProviderSkillMap s WHERE s.providerId = :providerId AND s.skillId = :skillId")
    java.util.Optional<ProviderSkillMap> findByProviderIdAndSkillId(@Param("providerId") Long providerId, @Param("skillId") Long skillId);
}
