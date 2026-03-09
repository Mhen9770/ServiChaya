package com.servichaya.config.repository;

import com.servichaya.config.entity.FeatureFlagMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureFlagMasterRepository extends JpaRepository<FeatureFlagMaster, Long> {

    Optional<FeatureFlagMaster> findByFeatureCode(String featureCode);

    @Query("SELECT f FROM FeatureFlagMaster f WHERE f.isActive = true AND f.featureCode = :featureCode")
    Optional<FeatureFlagMaster> findActiveByFeatureCode(@Param("featureCode") String featureCode);

    @Query("SELECT f FROM FeatureFlagMaster f WHERE f.isActive = true")
    List<FeatureFlagMaster> findAllActive();

    @Query("SELECT f FROM FeatureFlagMaster f WHERE f.isActive = true AND f.isEnabled = true")
    List<FeatureFlagMaster> findAllEnabled();
}
