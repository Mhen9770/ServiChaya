package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Provider Job Bid Entity
 * Tracks provider bids/charges for jobs to determine ranking
 */
@Entity
@Table(name = "provider_job_bid", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "provider_id"}),
       indexes = {
           @Index(name = "idx_job_bid_rank", columnList = "job_id, bid_amount DESC, rank_order"),
           @Index(name = "idx_provider_bids", columnList = "provider_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderJobBid extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    /**
     * Bid amount (charge) - Higher bid = Higher rank
     * This is the amount provider is willing to pay platform for this job
     */
    @Column(name = "bid_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal bidAmount;

    /**
     * Calculated rank (1 = top, 2 = second, etc.)
     * Updated by ranking algorithm
     */
    @Column(name = "rank_order")
    private Integer rankOrder;

    /**
     * Status: PENDING, ACCEPTED, REJECTED, WITHDRAWN
     */
    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "PENDING";

    /**
     * Provider's proposed price for the job (optional)
     * Can be different from job's estimatedBudget
     */
    @Column(name = "proposed_price", precision = 10, scale = 2)
    private BigDecimal proposedPrice;

    /**
     * Additional notes from provider
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
