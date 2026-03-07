package com.servichaya.matching.repository;

import com.servichaya.matching.entity.JobProviderMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobProviderMatchRepository extends JpaRepository<JobProviderMatch, Long> {

    List<JobProviderMatch> findByJobIdOrderByMatchScoreDesc(Long jobId);

    List<JobProviderMatch> findByProviderIdAndStatusOrderByCreatedAtDesc(Long providerId, String status);

    Optional<JobProviderMatch> findByJobIdAndProviderId(Long jobId, Long providerId);

    @Query("SELECT jpm FROM JobProviderMatch jpm WHERE jpm.jobId = :jobId AND jpm.status = 'PENDING' ORDER BY jpm.matchScore DESC")
    List<JobProviderMatch> findPendingMatchesByJobId(@Param("jobId") Long jobId);

    @Query("SELECT jpm FROM JobProviderMatch jpm WHERE jpm.providerId = :providerId AND jpm.status IN ('PENDING', 'NOTIFIED') ORDER BY jpm.matchScore DESC")
    List<JobProviderMatch> findAvailableJobsForProvider(@Param("providerId") Long providerId);
}
