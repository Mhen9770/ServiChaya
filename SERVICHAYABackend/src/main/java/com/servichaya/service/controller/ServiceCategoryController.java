package com.servichaya.service.controller;

import com.servichaya.common.response.ApiResponse;
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
            @RequestParam(required = false) Boolean featured) {
        log.info("Getting service categories, featured: {}", featured);
        try {
            List<ServiceCategoryDto> categories;
            if (featured != null && featured) {
                categories = serviceCategoryService.getFeaturedCategories();
                log.debug("Retrieved {} featured categories", categories.size());
            } else {
                categories = serviceCategoryService.getAllActiveCategories();
                log.debug("Retrieved {} active categories", categories.size());
            }
            return ResponseEntity.ok(ApiResponse.success(categories));
        } catch (Exception e) {
            log.error("Error getting service categories, featured: {}", featured, e);
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
}
