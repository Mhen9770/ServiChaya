package com.servichaya.location.repository;

import com.servichaya.location.entity.PodMaster;
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
    
    /**
     * Find PODs within service radius using MySQL ST_Distance_Sphere()
     * Returns PODs where the point is within the POD's service radius
     * 
     * ST_Distance_Sphere returns distance in meters, so we divide by 1000 for km
     * We filter where distance <= service_radius_km * 1000 (convert km to meters)
     */
    @Query(value = """
        SELECT 
            p.id as id,
            p.name as name,
            p.city_id as cityId,
            c.name as cityName,
            p.zone_id as zoneId,
            z.name as zoneName,
            ST_Distance_Sphere(
                POINT(:longitude, :latitude),
                POINT(p.longitude, p.latitude)
            ) / 1000.0 as distanceKm
        FROM pod_master p
        INNER JOIN city_master c ON p.city_id = c.id
        INNER JOIN zone_master z ON p.zone_id = z.id
        WHERE p.is_active = true
          AND p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
          AND p.service_radius_km IS NOT NULL
          AND ST_Distance_Sphere(
                POINT(:longitude, :latitude),
                POINT(p.longitude, p.latitude)
              ) <= (p.service_radius_km * 1000)
        ORDER BY distanceKm ASC
        LIMIT 10
        """, nativeQuery = true)
    List<PodLocationProjection> findPodsWithinRadius(
            @Param("latitude") BigDecimal latitude,
            @Param("longitude") BigDecimal longitude
    );
    
    /**
     * Find closest POD to a point (even if outside service radius)
     * Useful for fallback when no POD is within radius
     */
    @Query(value = """
        SELECT 
            p.id as id,
            p.name as name,
            p.city_id as cityId,
            c.name as cityName,
            p.zone_id as zoneId,
            z.name as zoneName,
            ST_Distance_Sphere(
                POINT(:longitude, :latitude),
                POINT(p.longitude, p.latitude)
            ) / 1000.0 as distanceKm
        FROM pod_master p
        INNER JOIN city_master c ON p.city_id = c.id
        INNER JOIN zone_master z ON p.zone_id = z.id
        WHERE p.is_active = true
          AND p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
        ORDER BY distanceKm ASC
        LIMIT 1
        """, nativeQuery = true)
    Optional<PodLocationProjection> findClosestPod(
            @Param("latitude") BigDecimal latitude,
            @Param("longitude") BigDecimal longitude
    );
}
