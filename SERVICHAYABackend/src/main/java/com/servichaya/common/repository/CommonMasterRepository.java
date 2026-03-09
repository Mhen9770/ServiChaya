package com.servichaya.common.repository;

import com.servichaya.common.entity.CommonMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommonMasterRepository extends JpaRepository<CommonMaster, Long> {

    @Query("SELECT c FROM CommonMaster c WHERE c.configCategory = :category AND " +
           "c.configKey = :key AND c.isActive = true AND (c.isDeleted IS NULL OR c.isDeleted = false)")
    Optional<CommonMaster> findByCategoryAndKey(
            @Param("category") String category,
            @Param("key") String key);

    @Query("SELECT c FROM CommonMaster c WHERE c.configCategory = :category AND " +
           "c.isActive = true AND (c.isDeleted IS NULL OR c.isDeleted = false) " +
           "ORDER BY c.displayOrder ASC")
    List<CommonMaster> findByCategory(@Param("category") String category);

    @Query("SELECT c FROM CommonMaster c WHERE c.configCategory = :category AND " +
           "c.appliesTo = :appliesTo AND c.isActive = true AND (c.isDeleted IS NULL OR c.isDeleted = false) " +
           "ORDER BY c.displayOrder ASC")
    List<CommonMaster> findByCategoryAndAppliesTo(
            @Param("category") String category,
            @Param("appliesTo") String appliesTo);
}
