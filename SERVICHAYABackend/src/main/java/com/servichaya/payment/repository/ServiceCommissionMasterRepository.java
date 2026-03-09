package com.servichaya.payment.repository;

import com.servichaya.payment.entity.ServiceCommissionMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCommissionMasterRepository extends JpaRepository<ServiceCommissionMaster, Long> {

    // Find most specific match: category + type + city
    @Query("SELECT c FROM ServiceCommissionMaster c WHERE " +
           "c.serviceCategoryId = :categoryId AND " +
           "c.serviceTypeId = :typeId AND " +
           "(c.cityId = :cityId OR c.cityId IS NULL) AND " +
           "c.isActive = true " +
           "ORDER BY c.cityId DESC NULLS LAST")
    Optional<ServiceCommissionMaster> findSpecificMatch(
            @Param("categoryId") Long categoryId,
            @Param("typeId") Long typeId,
            @Param("cityId") Long cityId);

    // Find category + city match (type is NULL)
    @Query("SELECT c FROM ServiceCommissionMaster c WHERE " +
           "c.serviceCategoryId = :categoryId AND " +
           "c.serviceTypeId IS NULL AND " +
           "(c.cityId = :cityId OR c.cityId IS NULL) AND " +
           "c.isActive = true " +
           "ORDER BY c.cityId DESC NULLS LAST")
    Optional<ServiceCommissionMaster> findCategoryCityMatch(
            @Param("categoryId") Long categoryId,
            @Param("cityId") Long cityId);

    // Find category-only match (type and city are NULL)
    @Query("SELECT c FROM ServiceCommissionMaster c WHERE " +
           "c.serviceCategoryId = :categoryId AND " +
           "c.serviceTypeId IS NULL AND " +
           "c.cityId IS NULL AND " +
           "c.isActive = true")
    Optional<ServiceCommissionMaster> findCategoryMatch(@Param("categoryId") Long categoryId);

    // Find all active commissions for a category
    @Query("SELECT c FROM ServiceCommissionMaster c WHERE " +
           "c.serviceCategoryId = :categoryId AND c.isActive = true")
    List<ServiceCommissionMaster> findByCategoryId(@Param("categoryId") Long categoryId);
}
