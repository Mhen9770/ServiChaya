package com.servichaya.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private Long id;
    private Long jobId;
    private Long providerId;
    private Long customerId;
    private BigDecimal rating;
    private BigDecimal qualityRating;
    private BigDecimal punctualityRating;
    private BigDecimal communicationRating;
    private BigDecimal valueRating;
    private String reviewText;
    private List<String> reviewPhotos;
    private Boolean isVerified;
    private Boolean isVisible;
    private LocalDateTime createdAt;
}
