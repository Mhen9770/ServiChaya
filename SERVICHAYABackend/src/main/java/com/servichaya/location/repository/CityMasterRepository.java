package com.servichaya.location.repository;

import com.servichaya.location.entity.CityMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityMasterRepository extends JpaRepository<CityMaster, Long> {
    Optional<CityMaster> findByCode(String code);
    
    @Query("SELECT c FROM CityMaster c JOIN FETCH c.state s JOIN FETCH s.country WHERE c.isActive = true ORDER BY c.name ASC")
    List<CityMaster> findAllActive();
    
    @Query("SELECT c FROM CityMaster c JOIN FETCH c.state s JOIN FETCH s.country WHERE c.state.id = :stateId AND c.isActive = true ORDER BY c.name ASC")
    List<CityMaster> findByStateIdAndIsActiveTrue(@Param("stateId") Long stateId);
    
    @Query(value = "SELECT DISTINCT c FROM CityMaster c JOIN FETCH c.state s JOIN FETCH s.country",
           countQuery = "SELECT COUNT(DISTINCT c) FROM CityMaster c")
    Page<CityMaster> findAllWithRelations(Pageable pageable);
    
    @Query("SELECT DISTINCT c FROM CityMaster c JOIN FETCH c.state s JOIN FETCH s.country WHERE c.id = :id")
    Optional<CityMaster> findByIdWithRelations(@Param("id") Long id);
}
