package com.servichaya.preauth.dto;

import com.servichaya.review.dto.ReviewDto;
import com.servichaya.service.dto.ServiceCategoryDto;
import com.servichaya.service.dto.ServiceSubCategoryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated, read-only data transfer object for the public homepage.
 * This keeps the frontend aligned with backend sources while avoiding
 * multiple round-trips from the client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomePageDataDto {

    private PlatformStatsDto stats;

    /**
     * Featured/top service categories to highlight on the hero section.
     */
    private List<ServiceCategoryDto> featuredCategories;

    /**
     * Root-level categories for the "Explore All Categories" grid.
     */
    private List<ServiceCategoryDto> rootCategories;

    /**
     * A small set of high-quality reviews for the testimonial section.
     */
    private List<ReviewDto> featuredReviews;

    /**
     * Featured subcategories (e.g., specific services) for homepage discovery.
     */
    private List<ServiceSubCategoryDto> featuredSubCategories;
}

