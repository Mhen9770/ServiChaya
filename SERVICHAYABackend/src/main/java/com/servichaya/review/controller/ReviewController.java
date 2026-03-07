package com.servichaya.review.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.review.dto.CreateReviewDto;
import com.servichaya.review.dto.ReviewDto;
import com.servichaya.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDto>> createReview(
            @RequestParam Long customerId,
            @RequestBody CreateReviewDto dto) {
        log.info("Request to create review for jobId: {} by customerId: {}", dto.getJobId(), customerId);
        ReviewDto review = reviewService.createReview(customerId, dto);
        return ResponseEntity.ok(ApiResponse.success("Review created successfully", review));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse<Page<ReviewDto>>> getProviderReviews(
            @PathVariable Long providerId,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Request to fetch reviews for providerId: {}", providerId);
        Page<ReviewDto> reviews = reviewService.getProviderReviews(providerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Reviews fetched", reviews));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<ApiResponse<ReviewDto>> getJobReview(@PathVariable Long jobId) {
        log.info("Request to fetch review for jobId: {}", jobId);
        ReviewDto review = reviewService.getJobReview(jobId);
        if (review == null) {
            return ResponseEntity.ok(ApiResponse.success("No review found", null));
        }
        return ResponseEntity.ok(ApiResponse.success("Review fetched", review));
    }
}
