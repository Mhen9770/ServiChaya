package com.servichaya.service.service;

import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.provider.dto.ProviderProfileDto;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.provider.service.ProviderProfileService;
import com.servichaya.service.dto.ServiceCategoryDto;
import com.servichaya.service.entity.ServiceCategoryMaster;
import com.servichaya.service.repository.ServiceCategoryMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ServiceCategoryService {

    private final ServiceCategoryMasterRepository categoryRepository;
    private final JobMasterRepository jobRepository;
    private final ServiceProviderProfileRepository providerRepository;
    private final ProviderProfileService providerProfileService;

    @Cacheable(value = "categories", key = "'all-active'")
    public List<ServiceCategoryDto> getAllActiveCategories() {
        log.debug("Getting all active service categories");
        try {
            List<ServiceCategoryMaster> categories = categoryRepository.findAllActiveOrdered();
            log.info("Retrieved {} active service categories", categories.size());
            return buildCategoryTree(categories);
        } catch (Exception e) {
            log.error("Error getting all active categories", e);
            throw e;
        }
    }

    @Cacheable(value = "categories", key = "'root'")
    public List<ServiceCategoryDto> getRootCategories() {
        log.debug("Getting root categories (no parent)");
        try {
            List<ServiceCategoryMaster> rootCategories = categoryRepository.findRootCategories();
            log.info("Retrieved {} root categories", rootCategories.size());
            return buildCategoryTree(rootCategories);
        } catch (Exception e) {
            log.error("Error getting root categories", e);
            throw e;
        }
    }

    public List<ServiceCategoryDto> getCategoriesByType(String categoryType) {
        log.debug("Getting categories by type: {}", categoryType);
        try {
            List<ServiceCategoryMaster> categories = categoryRepository.findByCategoryType(categoryType);
            log.info("Retrieved {} categories of type: {}", categories.size(), categoryType);
            return buildCategoryTree(categories);
        } catch (Exception e) {
            log.error("Error getting categories by type: {}", categoryType, e);
            throw e;
        }
    }

    public List<ServiceCategoryDto> getRootCategoriesByType(String categoryType) {
        log.debug("Getting root categories by type: {}", categoryType);
        try {
            List<ServiceCategoryMaster> rootCategories = categoryRepository.findRootCategoriesByType(categoryType);
            log.info("Retrieved {} root categories of type: {}", rootCategories.size(), categoryType);
            return buildCategoryTree(rootCategories);
        } catch (Exception e) {
            log.error("Error getting root categories by type: {}", categoryType, e);
            throw e;
        }
    }

    @Cacheable(value = "categories", key = "'featured'")
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

    @Cacheable(value = "categories", key = "'id:' + #id")
    public ServiceCategoryDto getCategoryById(Long id) {
        log.debug("Getting service category by id: {}", id);
        try {
            ServiceCategoryMaster category = categoryRepository.findById(id)
                    .orElseThrow(() -> {
                        log.error("Category not found for id: {}", id);
                        return new RuntimeException("Category not found");
                    });
            log.debug("Category found, id: {}, name: {}", id, category.getName());
            return mapToDtoWithChildren(category);
        } catch (Exception e) {
            log.error("Error getting category by id: {}", id, e);
            throw e;
        }
    }

    @Cacheable(value = "categories", key = "'tree:' + #id")
    public ServiceCategoryDto getCategoryTreeById(Long id) {
        log.debug("Getting category tree by id: {}", id);
        try {
            ServiceCategoryMaster category = categoryRepository.findById(id)
                    .orElseThrow(() -> {
                        log.error("Category not found for id: {}", id);
                        return new RuntimeException("Category not found");
                    });
            
            // Build full tree starting from this category
            List<ServiceCategoryMaster> allCategories = categoryRepository.findAllActiveOrdered();
            return buildCategoryTreeFromRoot(category, allCategories);
        } catch (Exception e) {
            log.error("Error getting category tree by id: {}", id, e);
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

    /**
     * Build hierarchical category tree from flat list
     */
    private List<ServiceCategoryDto> buildCategoryTree(List<ServiceCategoryMaster> categories) {
        if (categories == null || categories.isEmpty()) {
            return new ArrayList<>();
        }

        // Create a map for quick lookup
        Map<Long, ServiceCategoryMaster> categoryMap = categories.stream()
                .collect(Collectors.toMap(ServiceCategoryMaster::getId, Function.identity()));

        // Build tree starting from root categories (parentId is null)
        List<ServiceCategoryMaster> rootCategories = categories.stream()
                .filter(c -> c.getParentId() == null)
                .sorted((a, b) -> {
                    int orderCompare = Integer.compare(
                            a.getDisplayOrder() != null ? a.getDisplayOrder() : Integer.MAX_VALUE,
                            b.getDisplayOrder() != null ? b.getDisplayOrder() : Integer.MAX_VALUE
                    );
                    return orderCompare != 0 ? orderCompare : a.getName().compareTo(b.getName());
                })
                .collect(Collectors.toList());

        return rootCategories.stream()
                .map(root -> buildCategoryTreeFromRoot(root, categories))
                .collect(Collectors.toList());
    }

    /**
     * Recursively build category tree from a root category
     */
    private ServiceCategoryDto buildCategoryTreeFromRoot(ServiceCategoryMaster category, List<ServiceCategoryMaster> allCategories) {
        // Calculate provider count
        Long providerCount = 0L;
        try {
            Long count = jobRepository.countDistinctProvidersByCategoryId(category.getId());
            providerCount = count != null ? count : 0L;
        } catch (Exception e) {
            log.warn("Error calculating provider count for categoryId: {}", category.getId(), e);
        }

        // Find children
        List<ServiceCategoryMaster> children = allCategories.stream()
                .filter(c -> category.getId().equals(c.getParentId()))
                .sorted((a, b) -> {
                    int orderCompare = Integer.compare(
                            a.getDisplayOrder() != null ? a.getDisplayOrder() : Integer.MAX_VALUE,
                            b.getDisplayOrder() != null ? b.getDisplayOrder() : Integer.MAX_VALUE
                    );
                    return orderCompare != 0 ? orderCompare : a.getName().compareTo(b.getName());
                })
                .collect(Collectors.toList());

        // Recursively build children
        List<ServiceCategoryDto> childrenDtos = children.stream()
                .map(child -> buildCategoryTreeFromRoot(child, allCategories))
                .collect(Collectors.toList());

        return ServiceCategoryDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .displayOrder(category.getDisplayOrder())
                .isFeatured(category.getIsFeatured())
                .providerCount(providerCount)
                .parentId(category.getParentId())
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .categoryType(category.getCategoryType())
                .level(category.getLevel() != null ? category.getLevel() : 0)
                .path(category.getPath())
                .children(childrenDtos)
                .subCategories(new ArrayList<>()) // Legacy support - empty for now
                .build();
    }

    /**
     * Map single category to DTO without children (for flat lists)
     */
    private ServiceCategoryDto mapToDto(ServiceCategoryMaster category) {
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
                .parentId(category.getParentId())
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .categoryType(category.getCategoryType())
                .level(category.getLevel() != null ? category.getLevel() : 0)
                .path(category.getPath())
                .children(new ArrayList<>())
                .subCategories(new ArrayList<>())
                .build();
    }

    /**
     * Map category with its direct children
     */
    private ServiceCategoryDto mapToDtoWithChildren(ServiceCategoryMaster category) {
        List<ServiceCategoryMaster> allCategories = categoryRepository.findAllActiveOrdered();
        return buildCategoryTreeFromRoot(category, allCategories);
    }

    /**
     * Get active providers who have worked or are working in this category
     */
    public List<ProviderProfileDto> getProvidersByCategory(Long categoryId) {
        log.debug("Getting providers for category id: {}", categoryId);
        try {
            // Get distinct provider IDs who have jobs in this category (accepted, in_progress, or completed)
            List<Long> providerIds = jobRepository.findDistinctProviderIdsByCategoryId(categoryId);

            log.debug("Found {} distinct provider IDs for category id: {}", providerIds.size(), categoryId);

            // Get active provider profiles
            List<ProviderProfileDto> providers = providerIds.stream()
                    .map(providerId -> {
                        try {
                            ServiceProviderProfile provider = providerRepository.findById(providerId).orElse(null);
                            if (provider != null && 
                                "ACTIVE".equals(provider.getProfileStatus()) &&
                                (provider.getIsDeleted() == null || !provider.getIsDeleted()) &&
                                (provider.getIsAvailable() == null || provider.getIsAvailable())) {
                                return providerProfileService.getProviderProfile(providerId);
                            }
                            return null;
                        } catch (Exception e) {
                            log.warn("Error fetching provider profile for providerId: {}", providerId, e);
                            return null;
                        }
                    })
                    .filter(provider -> provider != null)
                    .collect(Collectors.toList());

            log.info("Retrieved {} active providers for category id: {}", providers.size(), categoryId);
            return providers;
        } catch (Exception e) {
            log.error("Error getting providers for category id: {}", categoryId, e);
            throw e;
        }
    }
}
