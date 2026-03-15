package com.servichaya.location.service;

import com.servichaya.location.dto.ResolvedLocationDto;
import com.servichaya.location.repository.CityLocationProjection;
import com.servichaya.location.repository.CityMasterRepository;
import com.servichaya.location.repository.PodLocationProjection;
import com.servichaya.location.repository.PodMasterRepository;
import com.servichaya.location.repository.ZoneLocationProjection;
import com.servichaya.location.repository.ZoneMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

/**
 * Location Service - Geofencing and Location Resolution
 * 
 * Provides:
 * 1. Haversine distance calculation between two lat/lng points
 * 2. POD resolution from lat/lng (finds PODs within service radius)
 * 3. City/Zone/POD resolution for address/job creation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private static final BigDecimal EARTH_RADIUS_KM = new BigDecimal("6371.0");
    
    private final PodMasterRepository podRepository;
    private final ZoneMasterRepository zoneRepository;
    private final CityMasterRepository cityRepository;

    /**
     * Calculate distance between two points using Haversine formula
     * 
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @return Distance in kilometers
     */
    public BigDecimal calculateDistanceKm(
            BigDecimal lat1, BigDecimal lon1,
            BigDecimal lat2, BigDecimal lon2) {
        
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return BigDecimal.ZERO;
        }

        // Convert to radians
        BigDecimal lat1Rad = toRadians(lat1);
        BigDecimal lat2Rad = toRadians(lat2);
        BigDecimal deltaLat = toRadians(lat2.subtract(lat1));
        BigDecimal deltaLon = toRadians(lon2.subtract(lon1));

        // Haversine formula: a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
        BigDecimal sinDeltaLat = sin(deltaLat.divide(new BigDecimal("2"), 10, RoundingMode.HALF_UP));
        BigDecimal a1 = sinDeltaLat.multiply(sinDeltaLat);
        
        BigDecimal cosLat1 = cos(lat1Rad);
        BigDecimal cosLat2 = cos(lat2Rad);
        BigDecimal sinDeltaLon = sin(deltaLon.divide(new BigDecimal("2"), 10, RoundingMode.HALF_UP));
        BigDecimal a2 = cosLat1.multiply(cosLat2).multiply(sinDeltaLon).multiply(sinDeltaLon);
        
        BigDecimal a = a1.add(a2);

        // c = 2 * atan2(√a, √(1-a))
        BigDecimal sqrtA = sqrt(a);
        BigDecimal sqrtOneMinusA = sqrt(BigDecimal.ONE.subtract(a));
        BigDecimal c = new BigDecimal("2").multiply(atan2(sqrtA, sqrtOneMinusA));

        // Distance = R * c
        BigDecimal distance = EARTH_RADIUS_KM.multiply(c);
        
        return distance.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Resolve latitude/longitude to SERVICHAYA master data (city/zone/pod)
     * 
     * Uses MySQL ST_Distance_Sphere() for efficient spatial queries
     * 
     * Algorithm:
     * 1. Find PODs within service radius using MySQL spatial query
     * 2. If multiple PODs found, pick the closest one (already sorted by distance)
     * 3. If no POD found, find closest Zone using MySQL spatial query
     * 4. If no Zone found, find closest City using MySQL spatial query
     * 
     * @param latitude Latitude of the point
     * @param longitude Longitude of the point
     * @return ResolvedLocationDto with cityId, zoneId, podId (and names if found)
     */
    @Transactional(readOnly = true)
    public ResolvedLocationDto resolveLocation(BigDecimal latitude, BigDecimal longitude) {
        log.info("Resolving location for lat: {}, lng: {}", latitude, longitude);
        
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }

        // Step 1: Find PODs within service radius using MySQL ST_Distance_Sphere()
        List<PodLocationProjection> podsWithinRadius = podRepository.findPodsWithinRadius(latitude, longitude);
        
        if (!podsWithinRadius.isEmpty()) {
            PodLocationProjection closestPod = podsWithinRadius.get(0); // Already sorted by distance ASC
            log.info("Found POD: {} (distance: {} km)", closestPod.getName(), closestPod.getDistanceKm());
            return ResolvedLocationDto.builder()
                    .cityId(closestPod.getCityId())
                    .cityName(closestPod.getCityName())
                    .zoneId(closestPod.getZoneId())
                    .zoneName(closestPod.getZoneName())
                    .podId(closestPod.getId())
                    .podName(closestPod.getName())
                    .build();
        }
        
        // Step 2: If no POD found within radius, try to find closest POD (fallback)
        Optional<PodLocationProjection> closestPodFallback = podRepository.findClosestPod(latitude, longitude);
        if (closestPodFallback.isPresent()) {
            PodLocationProjection pod = closestPodFallback.get();
            log.info("Found closest POD (outside radius): {} (distance: {} km)", pod.getName(), pod.getDistanceKm());
            return ResolvedLocationDto.builder()
                    .cityId(pod.getCityId())
                    .cityName(pod.getCityName())
                    .zoneId(pod.getZoneId())
                    .zoneName(pod.getZoneName())
                    .podId(pod.getId())
                    .podName(pod.getName())
                    .build();
        }
        
        // Step 3: If no POD found, find closest Zone using MySQL spatial query
        Optional<ZoneLocationProjection> closestZone = zoneRepository.findClosestZone(latitude, longitude);
        if (closestZone.isPresent()) {
            ZoneLocationProjection zone = closestZone.get();
            log.info("Found Zone: {} (distance: {} km)", zone.getName(), zone.getDistanceKm());
            return ResolvedLocationDto.builder()
                    .cityId(zone.getCityId())
                    .cityName(zone.getCityName())
                    .zoneId(zone.getId())
                    .zoneName(zone.getName())
                    .build();
        }
        
        // Step 4: If no Zone found, find closest City using MySQL spatial query
        Optional<CityLocationProjection> closestCity = cityRepository.findClosestCity(latitude, longitude);
        if (closestCity.isPresent()) {
            CityLocationProjection city = closestCity.get();
            log.info("Found City: {} (distance: {} km)", city.getName(), city.getDistanceKm());
            return ResolvedLocationDto.builder()
                    .cityId(city.getId())
                    .cityName(city.getName())
                    .build();
        }
        
        // Step 5: No match found
        log.warn("No city/zone/pod found for lat: {}, lng: {}", latitude, longitude);
        throw new RuntimeException("No serviceable location found for the given coordinates. Please ensure master data is configured.");
    }

    // Helper methods for trigonometric calculations using BigDecimal
    
    private BigDecimal toRadians(BigDecimal degrees) {
        return degrees.multiply(new BigDecimal(Math.PI))
                .divide(new BigDecimal("180"), 10, RoundingMode.HALF_UP);
    }
    
    private BigDecimal sin(BigDecimal radians) {
        return new BigDecimal(Math.sin(radians.doubleValue()));
    }
    
    private BigDecimal cos(BigDecimal radians) {
        return new BigDecimal(Math.cos(radians.doubleValue()));
    }
    
    private BigDecimal sqrt(BigDecimal value) {
        return new BigDecimal(Math.sqrt(value.doubleValue()));
    }
    
    private BigDecimal atan2(BigDecimal y, BigDecimal x) {
        return new BigDecimal(Math.atan2(y.doubleValue(), x.doubleValue()));
    }
}
