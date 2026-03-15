package com.servichaya.service.service;

import com.servichaya.service.dto.ServiceSubCategoryDto;
import com.servichaya.service.entity.ServiceCategoryMaster;
import com.servichaya.service.repository.ServiceCategoryMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ServiceSubCategoryService {

    /**
     * NOTE:
     * Historically we had a separate ServiceSubCategoryMaster table. The system
     * has been refactored to use the hierarchical ServiceCategoryMaster with
     * self-join (parent/children) instead. This service now exposes "subcategories"
     * by reading from ServiceCategoryMaster where parentId and/or level indicate
     * child categories.
     */
    private final ServiceCategoryMasterRepository categoryRepository;

    public List<ServiceSubCategoryDto> getAllActiveSubCategories() {
        log.debug("Getting all active service subcategories");
        try {
            // Treat any non-root active category as a potential subcategory
            List<ServiceCategoryMaster> all = categoryRepository.findAllActiveOrdered();
            List<ServiceCategoryMaster> subCategories = all.stream()
                    .filter(c -> c.getParentId() != null)
                    .collect(Collectors.toList());
            log.info("Retrieved {} active service subcategories (from category hierarchy)", subCategories.size());
            return subCategories.stream().map(this::mapToDto).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all active subcategories", e);
            throw e;
        }
    }

    @Cacheable(value = "subcategories", key = "'category:' + #categoryId")
    public List<ServiceSubCategoryDto> getSubCategoriesByCategoryId(Long categoryId) {
        log.debug("Getting subcategories for categoryId: {}", categoryId);
        try {
            List<ServiceCategoryMaster> subCategories = categoryRepository.findByParentId(categoryId);
            log.info("Retrieved {} subcategories for categoryId: {}", subCategories.size(), categoryId);
            return subCategories.stream().map(this::mapToDto).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting subcategories for categoryId: {}", categoryId, e);
            throw e;
        }
    }

    @Cacheable(value = "subcategories", key = "'featured'")
    public List<ServiceSubCategoryDto> getFeaturedSubCategories() {
        log.debug("Getting featured service subcategories");
        try {
            List<ServiceCategoryMaster> all = categoryRepository.findFeaturedCategories();
            List<ServiceCategoryMaster> subCategories = all.stream()
                    .filter(c -> c.getParentId() != null)
                    .collect(Collectors.toList());
            log.info("Retrieved {} featured service subcategories (from category hierarchy)", subCategories.size());
            return subCategories.stream().map(this::mapToDto).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting featured subcategories", e);
            throw e;
        }
    }

    public List<ServiceSubCategoryDto> getFeaturedSubCategoriesByCategory(Long categoryId) {
        log.debug("Getting featured subcategories for categoryId: {}", categoryId);
        try {
            // Featured children for a given parent category
            List<ServiceCategoryMaster> all = categoryRepository.findFeaturedCategories();
            List<ServiceCategoryMaster> subCategories = all.stream()
                    .filter(c -> categoryId.equals(c.getParentId()))
                    .collect(Collectors.toList());
            log.info("Retrieved {} featured subcategories for categoryId: {}", subCategories.size(), categoryId);
            return subCategories.stream().map(this::mapToDto).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting featured subcategories for categoryId: {}", categoryId, e);
            throw e;
        }
    }

    public ServiceSubCategoryDto getSubCategoryById(Long id) {
        log.debug("Getting service subcategory by id: {}", id);
        try {
            ServiceCategoryMaster subCategory = categoryRepository.findById(id)
                    .orElseThrow(() -> {
                        log.error("SubCategory not found for id: {}", id);
                        return new RuntimeException("SubCategory not found");
                    });
            log.debug("SubCategory found, id: {}, name: {}", id, subCategory.getName());
            return mapToDto(subCategory);
        } catch (Exception e) {
            log.error("Error getting subcategory by id: {}", id, e);
            throw e;
        }
    }

    public ServiceSubCategoryDto getSubCategoryByCode(String code) {
        log.debug("Getting service subcategory by code: {}", code);
        try {
            ServiceCategoryMaster subCategory = categoryRepository.findByCode(code)
                    .orElseThrow(() -> {
                        log.error("SubCategory not found for code: {}", code);
                        return new RuntimeException("SubCategory not found");
                    });
            log.debug("SubCategory found, code: {}, name: {}", code, subCategory.getName());
            return mapToDto(subCategory);
        } catch (Exception e) {
            log.error("Error getting subcategory by code: {}", code, e);
            throw e;
        }
    }

    private ServiceSubCategoryDto mapToDto(ServiceCategoryMaster subCategory) {
        return ServiceSubCategoryDto.builder()
                .id(subCategory.getId())
                .code(subCategory.getCode())
                .name(subCategory.getName())
                .description(subCategory.getDescription())
                .categoryId(subCategory.getParentId())
                .categoryName(subCategory.getParent() != null ? subCategory.getParent().getName() : null)
                .iconUrl(subCategory.getIconUrl())
                .displayOrder(subCategory.getDisplayOrder())
                .isFeatured(subCategory.getIsFeatured())
                .providerCount(0L) // TODO: Calculate actual provider count
                .build();
    }
}
