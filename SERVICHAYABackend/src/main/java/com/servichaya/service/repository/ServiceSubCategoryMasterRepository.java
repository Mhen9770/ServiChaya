package com.servichaya.service.repository;

import com.servichaya.service.entity.ServiceSubCategoryMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceSubCategoryMasterRepository extends JpaRepository<ServiceSubCategoryMaster, Long> {

    Optional<ServiceSubCategoryMaster> findByCode(String code);

    @Query("SELECT s FROM ServiceSubCategoryMaster s WHERE s.categoryId = :categoryId AND s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceSubCategoryMaster> findByCategoryIdAndIsActiveTrue(@Param("categoryId") Long categoryId);

    @Query("SELECT s FROM ServiceSubCategoryMaster s WHERE s.isActive = true ORDER BY s.displayOrder ASC, s.name ASC")
    List<ServiceSubCategoryMaster> findAllActiveOrdered();

    @Query("SELECT s FROM ServiceSubCategoryMaster s WHERE s.isActive = true AND s.isFeatured = true ORDER BY s.displayOrder ASC")
    List<ServiceSubCategoryMaster> findFeaturedSubCategories();

    @Query("SELECT s FROM ServiceSubCategoryMaster s WHERE s.categoryId = :categoryId AND s.isActive = true AND s.isFeatured = true ORDER BY s.displayOrder ASC")
    List<ServiceSubCategoryMaster> findFeaturedSubCategoriesByCategory(@Param("categoryId") Long categoryId);
}
