package com.servichaya.review.repository;

import com.servichaya.review.entity.JobReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface JobReviewRepository extends JpaRepository<JobReview, Long> {

    Optional<JobReview> findByJobId(Long jobId);

    @Query("SELECT r FROM JobReview r WHERE r.providerId = :providerId AND r.isVisible = true ORDER BY r.createdAt DESC")
    Page<JobReview> findByProviderId(@Param("providerId") Long providerId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM JobReview r WHERE r.providerId = :providerId AND r.isVisible = true")
    BigDecimal getAverageRatingByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT COUNT(r) FROM JobReview r WHERE r.providerId = :providerId AND r.isVisible = true")
    Long getReviewCountByProviderId(@Param("providerId") Long providerId);
}
