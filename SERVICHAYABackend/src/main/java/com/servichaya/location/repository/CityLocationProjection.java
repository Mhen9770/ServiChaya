package com.servichaya.location.repository;

/**
 * Projection interface for City location queries with distance
 */
public interface CityLocationProjection {
    Long getId();
    String getName();
    Double getDistanceKm();
}
