package com.servichaya.service.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.service.dto.ServiceSubCategoryDto;
import com.servichaya.service.service.ServiceSubCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/service-subcategories")
@RequiredArgsConstructor
@Slf4j
public class ServiceSubCategoryController {

    private final ServiceSubCategoryService serviceSubCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceSubCategoryDto>>> getAllSubCategories(
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Long categoryId) {
        log.info("Getting service subcategories, featured: {}, categoryId: {}", featured, categoryId);
        try {
            List<ServiceSubCategoryDto> subCategories;
            if (categoryId != null) {
                if (featured != null && featured) {
                    subCategories = serviceSubCategoryService.getFeaturedSubCategoriesByCategory(categoryId);
                } else {
                    subCategories = serviceSubCategoryService.getSubCategoriesByCategoryId(categoryId);
                }
            } else if (featured != null && featured) {
                subCategories = serviceSubCategoryService.getFeaturedSubCategories();
            } else {
                subCategories = serviceSubCategoryService.getAllActiveSubCategories();
            }
            log.debug("Retrieved {} subcategories", subCategories.size());
            return ResponseEntity.ok(ApiResponse.success(subCategories));
        } catch (Exception e) {
            log.error("Error getting service subcategories, featured: {}, categoryId: {}", featured, categoryId, e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceSubCategoryDto>> getSubCategoryById(@PathVariable Long id) {
        log.info("Getting service subcategory by id: {}", id);
        try {
            ServiceSubCategoryDto subCategory = serviceSubCategoryService.getSubCategoryById(id);
            log.debug("SubCategory retrieved successfully, id: {}, name: {}", id, subCategory.getName());
            return ResponseEntity.ok(ApiResponse.success(subCategory));
        } catch (Exception e) {
            log.error("Error getting subcategory by id: {}", id, e);
            throw e;
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<ServiceSubCategoryDto>> getSubCategoryByCode(@PathVariable String code) {
        log.info("Getting service subcategory by code: {}", code);
        try {
            ServiceSubCategoryDto subCategory = serviceSubCategoryService.getSubCategoryByCode(code);
            log.debug("SubCategory retrieved successfully, code: {}, name: {}", code, subCategory.getName());
            return ResponseEntity.ok(ApiResponse.success(subCategory));
        } catch (Exception e) {
            log.error("Error getting subcategory by code: {}", code, e);
            throw e;
        }
    }
}
