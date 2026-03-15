package com.servichaya.location.repository;

import com.servichaya.location.entity.CityMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
    
    /**
     * Find closest City to a point using MySQL ST_Distance_Sphere()
     */
    @Query(value = """
        SELECT 
            c.id as id,
            c.name as name,
            ST_Distance_Sphere(
                POINT(:longitude, :latitude),
                POINT(c.longitude, c.latitude)
            ) / 1000.0 as distanceKm
        FROM city_master c
        WHERE c.is_active = true
          AND c.latitude IS NOT NULL
          AND c.longitude IS NOT NULL
        ORDER BY distanceKm ASC
        LIMIT 1
        """, nativeQuery = true)
    Optional<CityLocationProjection> findClosestCity(
            @Param("latitude") BigDecimal latitude,
            @Param("longitude") BigDecimal longitude
    );
}
