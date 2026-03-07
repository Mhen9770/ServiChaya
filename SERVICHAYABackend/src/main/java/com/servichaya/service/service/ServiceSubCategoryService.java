package com.servichaya.service.service;

import com.servichaya.service.dto.ServiceSubCategoryDto;
import com.servichaya.service.entity.ServiceSubCategoryMaster;
import com.servichaya.service.repository.ServiceSubCategoryMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ServiceSubCategoryService {

    private final ServiceSubCategoryMasterRepository subCategoryRepository;

    public List<ServiceSubCategoryDto> getAllActiveSubCategories() {
        log.debug("Getting all active service subcategories");
        try {
            List<ServiceSubCategoryMaster> subCategories = subCategoryRepository.findAllActiveOrdered();
            log.info("Retrieved {} active service subcategories", subCategories.size());
            return subCategories.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all active subcategories", e);
            throw e;
        }
    }

    public List<ServiceSubCategoryDto> getSubCategoriesByCategoryId(Long categoryId) {
        log.debug("Getting subcategories for categoryId: {}", categoryId);
        try {
            List<ServiceSubCategoryMaster> subCategories = subCategoryRepository.findByCategoryIdAndIsActiveTrue(categoryId);
            log.info("Retrieved {} subcategories for categoryId: {}", subCategories.size(), categoryId);
            return subCategories.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting subcategories for categoryId: {}", categoryId, e);
            throw e;
        }
    }

    public List<ServiceSubCategoryDto> getFeaturedSubCategories() {
        log.debug("Getting featured service subcategories");
        try {
            List<ServiceSubCategoryMaster> subCategories = subCategoryRepository.findFeaturedSubCategories();
            log.info("Retrieved {} featured service subcategories", subCategories.size());
            return subCategories.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting featured subcategories", e);
            throw e;
        }
    }

    public List<ServiceSubCategoryDto> getFeaturedSubCategoriesByCategory(Long categoryId) {
        log.debug("Getting featured subcategories for categoryId: {}", categoryId);
        try {
            List<ServiceSubCategoryMaster> subCategories = subCategoryRepository.findFeaturedSubCategoriesByCategory(categoryId);
            log.info("Retrieved {} featured subcategories for categoryId: {}", subCategories.size(), categoryId);
            return subCategories.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting featured subcategories for categoryId: {}", categoryId, e);
            throw e;
        }
    }

    public ServiceSubCategoryDto getSubCategoryById(Long id) {
        log.debug("Getting service subcategory by id: {}", id);
        try {
            ServiceSubCategoryMaster subCategory = subCategoryRepository.findById(id)
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
            ServiceSubCategoryMaster subCategory = subCategoryRepository.findByCode(code)
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

    private ServiceSubCategoryDto mapToDto(ServiceSubCategoryMaster subCategory) {
        return ServiceSubCategoryDto.builder()
                .id(subCategory.getId())
                .code(subCategory.getCode())
                .name(subCategory.getName())
                .description(subCategory.getDescription())
                .categoryId(subCategory.getCategoryId())
                .categoryName(subCategory.getCategory() != null ? subCategory.getCategory().getName() : null)
                .iconUrl(subCategory.getIconUrl())
                .displayOrder(subCategory.getDisplayOrder())
                .isFeatured(subCategory.getIsFeatured())
                .providerCount(0L) // TODO: Calculate actual provider count
                .build();
    }
}
