package com.servichaya.service.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.provider.dto.ProviderProfileDto;
import com.servichaya.service.dto.ServiceCategoryDto;
import com.servichaya.service.service.ServiceCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/service-categories")
@RequiredArgsConstructor
@Slf4j
public class ServiceCategoryController {

    private final ServiceCategoryService serviceCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceCategoryDto>>> getAllCategories(
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) String categoryType,
            @RequestParam(required = false) Boolean rootOnly) {
        log.info("Getting service categories, featured: {}, categoryType: {}, rootOnly: {}", featured, categoryType, rootOnly);
        try {
            List<ServiceCategoryDto> categories;
            if (featured != null && featured) {
                categories = serviceCategoryService.getFeaturedCategories();
                log.debug("Retrieved {} featured categories", categories.size());
            } else if (rootOnly != null && rootOnly) {
                categories = serviceCategoryService.getRootCategories();
                log.debug("Retrieved {} root categories", categories.size());
            } else if (categoryType != null && !categoryType.isEmpty()) {
                categories = serviceCategoryService.getRootCategoriesByType(categoryType);
                log.debug("Retrieved {} root categories of type: {}", categories.size(), categoryType);
            } else {
                categories = serviceCategoryService.getAllActiveCategories();
                log.debug("Retrieved {} active categories", categories.size());
            }
            return ResponseEntity.ok(ApiResponse.success(categories));
        } catch (Exception e) {
            log.error("Error getting service categories, featured: {}, categoryType: {}", featured, categoryType, e);
            throw e;
        }
    }

    @GetMapping("/tree/{id}")
    public ResponseEntity<ApiResponse<ServiceCategoryDto>> getCategoryTree(@PathVariable Long id) {
        log.info("Getting category tree by id: {}", id);
        try {
            ServiceCategoryDto category = serviceCategoryService.getCategoryTreeById(id);
            log.debug("Category tree retrieved successfully, id: {}, name: {}", id, category.getName());
            return ResponseEntity.ok(ApiResponse.success(category));
        } catch (Exception e) {
            log.error("Error getting category tree by id: {}", id, e);
            throw e;
        }
    }

    @GetMapping("/type/{categoryType}")
    public ResponseEntity<ApiResponse<List<ServiceCategoryDto>>> getCategoriesByType(@PathVariable String categoryType) {
        log.info("Getting categories by type: {}", categoryType);
        try {
            List<ServiceCategoryDto> categories = serviceCategoryService.getCategoriesByType(categoryType);
            log.debug("Retrieved {} categories of type: {}", categories.size(), categoryType);
            return ResponseEntity.ok(ApiResponse.success(categories));
        } catch (Exception e) {
            log.error("Error getting categories by type: {}", categoryType, e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceCategoryDto>> getCategoryById(@PathVariable Long id) {
        log.info("Getting service category by id: {}", id);
        try {
            ServiceCategoryDto category = serviceCategoryService.getCategoryById(id);
            log.debug("Category retrieved successfully, id: {}, name: {}", id, category.getName());
            return ResponseEntity.ok(ApiResponse.success(category));
        } catch (Exception e) {
            log.error("Error getting category by id: {}", id, e);
            throw e;
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<ServiceCategoryDto>> getCategoryByCode(@PathVariable String code) {
        log.info("Getting service category by code: {}", code);
        try {
            ServiceCategoryDto category = serviceCategoryService.getCategoryByCode(code);
            log.debug("Category retrieved successfully, code: {}, name: {}", code, category.getName());
            return ResponseEntity.ok(ApiResponse.success(category));
        } catch (Exception e) {
            log.error("Error getting category by code: {}", code, e);
            throw e;
        }
    }

    @GetMapping("/{id}/providers")
    public ResponseEntity<ApiResponse<List<ProviderProfileDto>>> getProvidersByCategory(@PathVariable Long id) {
        log.info("Getting providers for category id: {}", id);
        try {
            List<ProviderProfileDto> providers = serviceCategoryService.getProvidersByCategory(id);
            log.debug("Retrieved {} providers for category id: {}", providers.size(), id);
            return ResponseEntity.ok(ApiResponse.success(providers));
        } catch (Exception e) {
            log.error("Error getting providers for category id: {}", id, e);
            throw e;
        }
    }
}
