package com.servichaya.service.repository;

import com.servichaya.service.entity.ServiceCategoryMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCategoryMasterRepository extends JpaRepository<ServiceCategoryMaster, Long> {

    Optional<ServiceCategoryMaster> findByCode(String code);

    @Query("SELECT s FROM ServiceCategoryMaster s WHERE s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceCategoryMaster> findAllActiveOrdered();

    @Query("SELECT s FROM ServiceCategoryMaster s WHERE s.isActive = true AND s.isFeatured = true ORDER BY s.displayOrder ASC")
    List<ServiceCategoryMaster> findFeaturedCategories();

    // Hierarchical queries
    @Query("SELECT s FROM ServiceCategoryMaster s WHERE s.parentId IS NULL AND s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceCategoryMaster> findRootCategories();

    @Query("SELECT s FROM ServiceCategoryMaster s WHERE s.parentId = :parentId AND s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceCategoryMaster> findByParentId(@Param("parentId") Long parentId);

    @Query("SELECT s FROM ServiceCategoryMaster s WHERE s.categoryType = :categoryType AND s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceCategoryMaster> findByCategoryType(@Param("categoryType") String categoryType);

    @Query("SELECT s FROM ServiceCategoryMaster s WHERE s.parentId IS NULL AND s.categoryType = :categoryType AND s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceCategoryMaster> findRootCategoriesByType(@Param("categoryType") String categoryType);

    @Query("SELECT s FROM ServiceCategoryMaster s WHERE s.path LIKE :pathPattern AND s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceCategoryMaster> findByPathPattern(@Param("pathPattern") String pathPattern);
}
