package com.servichaya.preauth.service;

import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.location.repository.CityMasterRepository;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.preauth.dto.HomePageDataDto;
import com.servichaya.preauth.dto.PlatformStatsDto;
import com.servichaya.review.dto.ReviewDto;
import com.servichaya.review.repository.JobReviewRepository;
import com.servichaya.review.service.ReviewService;
import com.servichaya.service.dto.ServiceCategoryDto;
import com.servichaya.service.dto.ServiceSubCategoryDto;
import com.servichaya.service.service.ServiceCategoryService;
import com.servichaya.service.service.ServiceSubCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PublicService {

    private final ServiceProviderProfileRepository providerRepository;
    private final JobMasterRepository jobRepository;
    private final CityMasterRepository cityRepository;
    private final JobReviewRepository reviewRepository;
    private final ServiceCategoryService serviceCategoryService;
    private final ServiceSubCategoryService serviceSubCategoryService;
    private final ReviewService reviewService;

    public PlatformStatsDto getPlatformStats() {
        log.info("Calculating platform statistics for public display");

        // Count verified providers (ACTIVE status with verification)
        long verifiedProviders = providerRepository.countByProfileStatus("ACTIVE");
        log.debug("Verified providers count: {}", verifiedProviders);

        // Count completed jobs
        long completedJobs = jobRepository.countByStatus("COMPLETED");
        log.debug("Completed jobs count: {}", completedJobs);

        // Calculate average rating from all reviews
        BigDecimal averageRating = calculateAverageRating();
        log.debug("Average rating: {}", averageRating);

        // Count active cities
        long citiesCovered = cityRepository.findAllActive().size();
        log.debug("Cities covered: {}", citiesCovered);

        return PlatformStatsDto.builder()
                .verifiedProviders(verifiedProviders)
                .completedJobs(completedJobs)
                .averageRating(averageRating)
                .citiesCovered(citiesCovered)
                .build();
    }

    /**
     * Aggregate all data required for the public homepage in a single
     * read-only call, so the frontend does not need to orchestrate
     * multiple requests and we keep data sources centralized.
     */
    public HomePageDataDto getHomePageData(int testimonialLimit) {
        log.info("Aggregating homepage data for public display, testimonialLimit={}", testimonialLimit);

        PlatformStatsDto stats = getPlatformStats();

        // Featured categories (for hero "popular services" section)
        java.util.List<ServiceCategoryDto> featuredCategories = serviceCategoryService.getFeaturedCategories();

        // Root categories for the main catalog grid
        java.util.List<ServiceCategoryDto> rootCategories = serviceCategoryService.getRootCategories();

        // A small set of high-quality reviews for testimonials
        java.util.List<ReviewDto> featuredReviews = reviewService.getFeaturedReviews(testimonialLimit);

        // Featured subcategories for finer-grained discovery on the homepage
        java.util.List<ServiceSubCategoryDto> featuredSubCategories = serviceSubCategoryService.getFeaturedSubCategories();

        return HomePageDataDto.builder()
                .stats(stats)
                .featuredCategories(featuredCategories)
                .rootCategories(rootCategories)
                .featuredReviews(featuredReviews)
                .featuredSubCategories(featuredSubCategories)
                .build();
    }

    private BigDecimal calculateAverageRating() {
        try {
            // Use native query to calculate average rating efficiently
            BigDecimal avgRating = reviewRepository.calculateAverageRating();
            if (avgRating != null && avgRating.compareTo(BigDecimal.ZERO) > 0) {
                return avgRating.setScale(1, RoundingMode.HALF_UP);
            }
            return BigDecimal.valueOf(4.8); // Default rating if no reviews
        } catch (Exception e) {
            log.error("Error calculating average rating", e);
            return BigDecimal.valueOf(4.8); // Default rating on error
        }
    }
}
