package com.servichaya.service.repository;

import com.servichaya.service.entity.ServiceCategorySkillMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceCategorySkillMapRepository extends JpaRepository<ServiceCategorySkillMap, Long> {

    List<ServiceCategorySkillMap> findByServiceCategoryIdAndIsActiveTrue(Long serviceCategoryId);

    @Query("SELECT m FROM ServiceCategorySkillMap m " +
           "WHERE m.isActive = true AND m.serviceCategoryId IN :categoryIds")
    List<ServiceCategorySkillMap> findActiveByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    /**
     * Fetch mappings for a single category with category and skill eagerly loaded,
     * to avoid LazyInitializationException when accessing their properties in DTO mapping.
     */
    @Query("SELECT m FROM ServiceCategorySkillMap m " +
           "LEFT JOIN FETCH m.category " +
           "LEFT JOIN FETCH m.skill " +
           "WHERE m.isActive = true AND m.serviceCategoryId = :categoryId")
    List<ServiceCategorySkillMap> findActiveByCategoryIdWithDetails(@Param("categoryId") Long categoryId);
}

