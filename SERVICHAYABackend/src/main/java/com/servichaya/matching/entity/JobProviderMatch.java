package com.servichaya.matching.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_provider_match")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobProviderMatch extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "match_score", precision = 10, scale = 2, nullable = false)
    private BigDecimal matchScore;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, NOTIFIED, ACCEPTED, REJECTED, EXPIRED

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "response_time_seconds")
    private Long responseTimeSeconds;

    @Column(name = "rank_order")
    private Integer rankOrder; // Position in the match list (1 = best match)
}
