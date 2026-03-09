package com.servichaya.matching.repository;

import java.math.BigDecimal;

/**
 * Interface projection for native SQL query results
 * Spring Data JPA automatically maps column aliases to interface methods
 */
public interface ProviderMatchCandidateProjection {
    Long getProviderId();
    String getProviderCode();
    Long getUserId();
    BigDecimal getRating();
    String getProfileStatus();
    Boolean getIsAvailable();
    Boolean getIsOnline();
    Integer getTotalJobsCompleted();
    Integer getAvgResponseTimeMinutes();
    Integer getHasPodMatch();
    Integer getHasZoneMatch();
    Integer getHasCityMatch();
    Integer getHasSkillMatch();
    BigDecimal getDistanceKm(); // NULL for now, can be calculated later if needed
}
