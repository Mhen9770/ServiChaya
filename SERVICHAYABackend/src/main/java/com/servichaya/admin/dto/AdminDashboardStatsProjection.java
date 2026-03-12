package com.servichaya.admin.dto;

import java.math.BigDecimal;

/**
 * Projection interface for admin dashboard statistics using native SQL.
 */
public interface AdminDashboardStatsProjection {

    Long getTotalJobs();

    Long getPendingJobs();

    Long getActiveProviders();

    Long getPendingVerifications();

    Long getTotalCustomers();

    BigDecimal getTotalEarnings();
}

