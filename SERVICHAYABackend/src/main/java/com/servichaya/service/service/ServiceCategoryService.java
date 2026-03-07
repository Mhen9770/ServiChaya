package com.servichaya.service.service;

import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.service.dto.ServiceCategoryDto;
import com.servichaya.service.dto.ServiceSubCategoryDto;
import com.servichaya.service.entity.ServiceCategoryMaster;
import com.servichaya.service.repository.ServiceCategoryMasterRepository;
import com.servichaya.service.service.ServiceSubCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ServiceCategoryService {

    private final ServiceCategoryMasterRepository categoryRepository;
    private final ServiceSubCategoryService subCategoryService;
    private final JobMasterRepository jobRepository;

    public List<ServiceCategoryDto> getAllActiveCategories() {
        log.debug("Getting all active service categories");
        try {
            List<ServiceCategoryMaster> categories = categoryRepository.findAllActiveOrdered();
            log.info("Retrieved {} active service categories", categories.size());
            return categories.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all active categories", e);
            throw e;
        }
    }

    public List<ServiceCategoryDto> getFeaturedCategories() {
        log.debug("Getting featured service categories");
        try {
            List<ServiceCategoryMaster> categories = categoryRepository.findFeaturedCategories();
            log.info("Retrieved {} featured service categories", categories.size());
            return categories.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting featured categories", e);
            throw e;
        }
    }

    public ServiceCategoryDto getCategoryById(Long id) {
        log.debug("Getting service category by id: {}", id);
        try {
            ServiceCategoryMaster category = categoryRepository.findById(id)
                    .orElseThrow(() -> {
                        log.error("Category not found for id: {}", id);
                        return new RuntimeException("Category not found");
                    });
            log.debug("Category found, id: {}, name: {}", id, category.getName());
            return mapToDto(category);
        } catch (Exception e) {
            log.error("Error getting category by id: {}", id, e);
            throw e;
        }
    }

    public ServiceCategoryDto getCategoryByCode(String code) {
        log.debug("Getting service category by code: {}", code);
        try {
            ServiceCategoryMaster category = categoryRepository.findByCode(code)
                    .orElseThrow(() -> {
                        log.error("Category not found for code: {}", code);
                        return new RuntimeException("Category not found");
                    });
            log.debug("Category found, code: {}, name: {}", code, category.getName());
            return mapToDto(category);
        } catch (Exception e) {
            log.error("Error getting category by code: {}", code, e);
            throw e;
        }
    }

    private ServiceCategoryDto mapToDto(ServiceCategoryMaster category) {
        List<ServiceSubCategoryDto> subCategories = new ArrayList<>();
        try {
            subCategories = subCategoryService.getSubCategoriesByCategoryId(category.getId());
        } catch (Exception e) {
            log.warn("Error fetching subcategories for categoryId: {}", category.getId(), e);
        }
        
        // Calculate provider count: distinct providers who have completed jobs in this category
        Long providerCount = 0L;
        try {
            Long count = jobRepository.countDistinctProvidersByCategoryId(category.getId());
            providerCount = count != null ? count : 0L;
        } catch (Exception e) {
            log.warn("Error calculating provider count for categoryId: {}", category.getId(), e);
        }
        
        return ServiceCategoryDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .displayOrder(category.getDisplayOrder())
                .isFeatured(category.getIsFeatured())
                .providerCount(providerCount)
                .subCategories(subCategories)
                .build();
    }
}
