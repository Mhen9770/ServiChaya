package com.servichaya.location.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.location.dto.ResolvedLocationDto;
import com.servichaya.location.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Location Controller
 * 
 * Provides endpoints for geofencing and location resolution
 */
@RestController
@RequestMapping("/location")
@RequiredArgsConstructor
@Slf4j
public class LocationController {

    private final LocationService locationService;

    /**
     * Resolve latitude/longitude to SERVICHAYA master data (city/zone/pod)
     * 
     * POST /location/resolve
     * Body: { "latitude": 22.9734, "longitude": 78.6569 }
     * 
     * Returns: { "success": true, "data": { "cityId": 1, "cityName": "...", "zoneId": 2, "podId": 3 } }
     */
    @PostMapping("/resolve")
    public ResponseEntity<ApiResponse<ResolvedLocationDto>> resolveLocation(
            @RequestBody LocationRequest request) {
        
        log.info("Location resolve request: lat={}, lng={}", request.getLatitude(), request.getLongitude());
        
        try {
            BigDecimal lat = new BigDecimal(String.valueOf(request.getLatitude()));
            BigDecimal lng = new BigDecimal(String.valueOf(request.getLongitude()));
            
            ResolvedLocationDto resolved = locationService.resolveLocation(lat, lng);
            
            return ResponseEntity.ok(ApiResponse.success("Location resolved successfully", resolved));
        } catch (IllegalArgumentException e) {
            log.error("Invalid location request", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to resolve location", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Request DTO for location resolution
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class LocationRequest {
        private Double latitude;
        private Double longitude;
    }
}
