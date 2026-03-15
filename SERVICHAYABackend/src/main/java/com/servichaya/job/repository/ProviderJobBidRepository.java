package com.servichaya.job.repository;

import com.servichaya.job.entity.ProviderJobBid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderJobBidRepository extends JpaRepository<ProviderJobBid, Long> {

    /**
     * Find all bids for a job, ordered by rank (top providers first)
     */
    @Query("SELECT b FROM ProviderJobBid b WHERE b.jobId = :jobId AND b.status = 'PENDING' ORDER BY b.rankOrder ASC, b.bidAmount DESC, b.createdAt ASC")
    Page<ProviderJobBid> findBidsByJobIdOrderByRank(@Param("jobId") Long jobId, Pageable pageable);

    /**
     * Find bid by job and provider
     */
    Optional<ProviderJobBid> findByJobIdAndProviderId(Long jobId, Long providerId);

    /**
     * Find all bids for a provider
     */
    List<ProviderJobBid> findByProviderIdAndStatusOrderByCreatedAtDesc(Long providerId, String status);

    /**
     * Count active bids for a job
     */
    long countByJobIdAndStatus(Long jobId, String status);

    /**
     * Find top N bids by rank
     */
    @Query("SELECT b FROM ProviderJobBid b WHERE b.jobId = :jobId AND b.status = 'PENDING' ORDER BY b.rankOrder ASC, b.bidAmount DESC LIMIT :limit")
    List<ProviderJobBid> findTopBidsByJobId(@Param("jobId") Long jobId, @Param("limit") int limit);
}
