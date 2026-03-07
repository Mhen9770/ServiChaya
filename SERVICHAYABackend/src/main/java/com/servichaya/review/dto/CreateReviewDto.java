package com.servichaya.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewDto {
    private Long jobId;
    private BigDecimal rating; // 1.00 to 5.00
    private BigDecimal qualityRating;
    private BigDecimal punctualityRating;
    private BigDecimal communicationRating;
    private BigDecimal valueRating;
    private String reviewText;
    private List<String> reviewPhotos;
}
