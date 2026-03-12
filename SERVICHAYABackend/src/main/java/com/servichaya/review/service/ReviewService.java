package com.servichaya.review.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.review.dto.CreateReviewDto;
import com.servichaya.review.dto.ReviewDto;
import com.servichaya.review.entity.JobReview;
import com.servichaya.review.repository.JobReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final JobReviewRepository reviewRepository;
    private final JobMasterRepository jobRepository;
    private final ServiceProviderProfileRepository providerRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ReviewDto createReview(Long customerId, CreateReviewDto dto) {
        log.info("Creating review for jobId: {} by customerId: {}", dto.getJobId(), customerId);

        JobMaster job = jobRepository.findById(dto.getJobId())
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", dto.getJobId());
                    return new RuntimeException("Job not found");
                });

        if (!job.getCustomerId().equals(customerId)) {
            log.error("Customer {} attempted to review job {} not belonging to them", customerId, dto.getJobId());
            throw new RuntimeException("Unauthorized");
        }

        if (!"COMPLETED".equals(job.getStatus())) {
            log.error("Job {} is not completed. Current status: {}", dto.getJobId(), job.getStatus());
            throw new RuntimeException("Job must be completed before review");
        }

        if (reviewRepository.findByJobId(dto.getJobId()).isPresent()) {
            log.error("Review already exists for jobId: {}", dto.getJobId());
            throw new RuntimeException("Review already exists for this job");
        }

        String reviewPhotosJson = null;
        if (dto.getReviewPhotos() != null && !dto.getReviewPhotos().isEmpty()) {
            try {
                reviewPhotosJson = objectMapper.writeValueAsString(dto.getReviewPhotos());
            } catch (Exception e) {
                log.error("Error serializing review photos", e);
            }
        }

        JobReview review = JobReview.builder()
                .jobId(dto.getJobId())
                .providerId(job.getProviderId())
                .customerId(customerId)
                .rating(dto.getRating())
                .qualityRating(dto.getQualityRating())
                .punctualityRating(dto.getPunctualityRating())
                .communicationRating(dto.getCommunicationRating())
                .valueRating(dto.getValueRating())
                .reviewText(dto.getReviewText())
                .reviewPhotos(reviewPhotosJson)
                .isVerified(false)
                .isVisible(true)
                .build();

        review = reviewRepository.save(review);
        log.info("Review created with id: {}", review.getId());

        updateProviderRating(job.getProviderId());

        return mapToDto(review);
    }

    public Page<ReviewDto> getProviderReviews(Long providerId, Pageable pageable) {
        log.info("Fetching reviews for providerId: {}", providerId);
        return reviewRepository.findByProviderId(providerId, pageable)
                .map(this::mapToDto);
    }

    /**
     * Get featured reviews for public display on landing / marketing pages.
     * Uses limited page size for performance and avoids fetching entire table.
     */
    public List<ReviewDto> getFeaturedReviews(int limit) {
        int pageSize = Math.max(1, Math.min(limit, 10));
        log.info("Fetching up to {} featured reviews for public display", pageSize);

        PageRequest pageRequest = PageRequest.of(0, pageSize);
        Page<JobReview> page = reviewRepository.findFeaturedReviews(pageRequest);

        List<JobReview> reviews = page.getContent();
        log.debug("Retrieved {} featured reviews", reviews.size());

        List<ReviewDto> dtos = new ArrayList<>();
        for (JobReview review : reviews) {
            dtos.add(mapToDto(review));
        }
        return dtos;
    }

    public ReviewDto getJobReview(Long jobId) {
        log.info("Fetching review for jobId: {}", jobId);
        return reviewRepository.findByJobId(jobId)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Transactional
    private void updateProviderRating(Long providerId) {
        log.info("Updating provider rating for providerId: {}", providerId);

        BigDecimal averageRating = reviewRepository.getAverageRatingByProviderId(providerId);
        Long reviewCount = reviewRepository.getReviewCountByProviderId(providerId);

        if (averageRating != null) {
            ServiceProviderProfile provider = providerRepository.findById(providerId)
                    .orElseThrow(() -> new RuntimeException("Provider not found"));

            provider.setRating(averageRating.setScale(2, RoundingMode.HALF_UP));
            provider.setRatingCount(reviewCount != null ? reviewCount.intValue() : 0);
            providerRepository.save(provider);

            log.info("Provider rating updated. New rating: {}, Review count: {}", averageRating, reviewCount);
        }
    }

    private ReviewDto mapToDto(JobReview review) {
        List<String> reviewPhotos = new ArrayList<>();
        if (review.getReviewPhotos() != null) {
            try {
                reviewPhotos = objectMapper.readValue(review.getReviewPhotos(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.error("Error deserializing review photos", e);
            }
        }

        return ReviewDto.builder()
                .id(review.getId())
                .jobId(review.getJobId())
                .providerId(review.getProviderId())
                .customerId(review.getCustomerId())
                .rating(review.getRating())
                .qualityRating(review.getQualityRating())
                .punctualityRating(review.getPunctualityRating())
                .communicationRating(review.getCommunicationRating())
                .valueRating(review.getValueRating())
                .reviewText(review.getReviewText())
                .reviewPhotos(reviewPhotos)
                .isVerified(review.getIsVerified())
                .isVisible(review.getIsVisible())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
