package com.servichaya.location.repository;

/**
 * Projection interface for POD location queries with distance
 */
public interface PodLocationProjection {
    Long getId();
    String getName();
    Long getCityId();
    String getCityName();
    Long getZoneId();
    String getZoneName();
    Double getDistanceKm();
}
