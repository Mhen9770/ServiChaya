package com.servichaya.location.repository;

import com.servichaya.location.entity.ZoneMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneMasterRepository extends JpaRepository<ZoneMaster, Long> {
    Optional<ZoneMaster> findByCode(String code);
    
    @Query("SELECT z FROM ZoneMaster z JOIN FETCH z.city WHERE z.isActive = true ORDER BY z.name ASC")
    List<ZoneMaster> findAllActive();
    
    @Query("SELECT z FROM ZoneMaster z JOIN FETCH z.city WHERE z.city.id = :cityId AND z.isActive = true ORDER BY z.name ASC")
    List<ZoneMaster> findByCityIdAndIsActiveTrue(@Param("cityId") Long cityId);
    
    @Query(value = "SELECT DISTINCT z FROM ZoneMaster z JOIN FETCH z.city",
           countQuery = "SELECT COUNT(DISTINCT z) FROM ZoneMaster z")
    Page<ZoneMaster> findAllWithRelations(Pageable pageable);
    
    @Query("SELECT DISTINCT z FROM ZoneMaster z JOIN FETCH z.city WHERE z.id = :id")
    Optional<ZoneMaster> findByIdWithRelations(@Param("id") Long id);
}
