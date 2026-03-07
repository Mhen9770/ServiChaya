package com.servichaya.location.repository;

import com.servichaya.location.entity.PodMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PodMasterRepository extends JpaRepository<PodMaster, Long> {
    Optional<PodMaster> findByCode(String code);
    
    @Query("SELECT p FROM PodMaster p JOIN FETCH p.city JOIN FETCH p.zone WHERE p.isActive = true ORDER BY p.name ASC")
    List<PodMaster> findAllActive();
    
    @Query("SELECT p FROM PodMaster p JOIN FETCH p.city JOIN FETCH p.zone WHERE p.city.id = :cityId AND p.isActive = true ORDER BY p.name ASC")
    List<PodMaster> findByCityIdAndIsActiveTrue(@Param("cityId") Long cityId);
    
    @Query("SELECT p FROM PodMaster p JOIN FETCH p.city JOIN FETCH p.zone WHERE p.zone.id = :zoneId AND p.isActive = true ORDER BY p.name ASC")
    List<PodMaster> findByZoneIdAndIsActiveTrue(@Param("zoneId") Long zoneId);
    
    @Query("SELECT p FROM PodMaster p JOIN FETCH p.city JOIN FETCH p.zone WHERE p.city.id = :cityId AND p.zone.id = :zoneId AND p.isActive = true ORDER BY p.name ASC")
    List<PodMaster> findByCityIdAndZoneIdAndIsActiveTrue(@Param("cityId") Long cityId, @Param("zoneId") Long zoneId);
    
    @Query(value = "SELECT DISTINCT p FROM PodMaster p JOIN FETCH p.city JOIN FETCH p.zone",
           countQuery = "SELECT COUNT(DISTINCT p) FROM PodMaster p")
    Page<PodMaster> findAllWithRelations(Pageable pageable);
    
    @Query("SELECT DISTINCT p FROM PodMaster p JOIN FETCH p.city JOIN FETCH p.zone WHERE p.id = :id")
    Optional<PodMaster> findByIdWithRelations(@Param("id") Long id);
}
