package com.servichaya.admin.dto;

public interface CustomerJobStatsProjection {
    Long getCustomerId();
    Long getTotalJobs();
    Long getCompletedJobs();
    Long getCancelledJobs();
    Long getActiveJobs();
}
