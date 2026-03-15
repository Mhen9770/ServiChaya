package com.servichaya.location.repository;

/**
 * Projection interface for Zone location queries with distance
 */
public interface ZoneLocationProjection {
    Long getId();
    String getName();
    Long getCityId();
    String getCityName();
    Double getDistanceKm();
}
