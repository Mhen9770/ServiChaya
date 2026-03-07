package com.servichaya.job.repository;

import com.servichaya.job.entity.JobMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobMasterRepository extends JpaRepository<JobMaster, Long> {

    Optional<JobMaster> findByJobCode(String jobCode);

    Page<JobMaster> findByCustomerIdAndIsDeletedFalse(Long customerId, Pageable pageable);

    @Query("SELECT j FROM JobMaster j WHERE j.customerId = :customerId AND j.status = :status AND (j.isDeleted IS NULL OR j.isDeleted = false)")
    Page<JobMaster> findByCustomerIdAndStatusAndIsDeletedFalse(@Param("customerId") Long customerId, @Param("status") String status, Pageable pageable);

    Page<JobMaster> findByProviderIdAndIsDeletedFalse(Long providerId, Pageable pageable);

    @Query("SELECT j FROM JobMaster j WHERE j.providerId = :providerId AND j.status = :status AND (j.isDeleted IS NULL OR j.isDeleted = false)")
    Page<JobMaster> findByProviderIdAndStatusAndIsDeletedFalse(@Param("providerId") Long providerId, @Param("status") String status, Pageable pageable);

    @Query("SELECT j FROM JobMaster j WHERE j.status = :status AND j.isDeleted = false")
    Page<JobMaster> findByStatus(@Param("status") String status, Pageable pageable);

    @Query("SELECT j FROM JobMaster j WHERE j.podId = :podId AND j.status = 'PENDING' AND j.isDeleted = false")
    List<JobMaster> findPendingJobsByPod(@Param("podId") Long podId);

    @Query("SELECT j FROM JobMaster j WHERE j.cityId = :cityId AND j.status = 'PENDING' AND j.isDeleted = false")
    List<JobMaster> findPendingJobsByCity(@Param("cityId") Long cityId);

    @Query("SELECT COUNT(j) FROM JobMaster j WHERE j.status = :status AND (j.isDeleted IS NULL OR j.isDeleted = false)")
    long countByStatus(@Param("status") String status);

    @Query("SELECT j FROM JobMaster j WHERE j.isDeleted is null OR j.isDeleted = false")
    Page<JobMaster> findAllByIsDeletedNotTrue(Pageable pageable);

    // Advanced filtering queries
    @Query("SELECT j FROM JobMaster j WHERE j.customerId = :customerId " +
           "AND (:status IS NULL OR :status = 'ALL' OR j.status = :status) " +
           "AND (:isEmergency IS NULL OR j.isEmergency = :isEmergency) " +
           "AND (:dateFrom IS NULL OR j.createdAt >= :dateFrom) " +
           "AND (:dateTo IS NULL OR j.createdAt <= :dateTo) " +
           "AND (:budgetMin IS NULL OR j.estimatedBudget >= :budgetMin) " +
           "AND (:budgetMax IS NULL OR j.estimatedBudget <= :budgetMax) " +
           "AND (j.isDeleted IS NULL OR j.isDeleted = false)")
    Page<JobMaster> findCustomerJobsWithFilters(
            @Param("customerId") Long customerId,
            @Param("status") String status,
            @Param("isEmergency") Boolean isEmergency,
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo") java.time.LocalDateTime dateTo,
            @Param("budgetMin") java.math.BigDecimal budgetMin,
            @Param("budgetMax") java.math.BigDecimal budgetMax,
            Pageable pageable);

    @Query("SELECT j FROM JobMaster j WHERE " +
           "(:status IS NULL OR :status = 'ALL' OR j.status = :status) " +
           "AND (:cityId IS NULL OR j.cityId = :cityId) " +
           "AND (:customerId IS NULL OR j.customerId = :customerId) " +
           "AND (:providerId IS NULL OR j.providerId = :providerId) " +
           "AND (:categoryId IS NULL OR j.serviceCategoryId = :categoryId) " +
           "AND (:subCategoryId IS NULL OR j.serviceSubCategoryId = :subCategoryId) " +
           "AND (:isEmergency IS NULL OR j.isEmergency = :isEmergency) " +
           "AND (:dateFrom IS NULL OR j.createdAt >= :dateFrom) " +
           "AND (:dateTo IS NULL OR j.createdAt <= :dateTo) " +
           "AND (:budgetMin IS NULL OR j.estimatedBudget >= :budgetMin) " +
           "AND (:budgetMax IS NULL OR j.estimatedBudget <= :budgetMax) " +
           "AND (j.isDeleted IS NULL OR j.isDeleted = false)")
    Page<JobMaster> findAllJobsWithAdvancedFilters(
            @Param("status") String status,
            @Param("cityId") Long cityId,
            @Param("customerId") Long customerId,
            @Param("providerId") Long providerId,
            @Param("categoryId") Long categoryId,
            @Param("subCategoryId") Long subCategoryId,
            @Param("isEmergency") Boolean isEmergency,
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo") java.time.LocalDateTime dateTo,
            @Param("budgetMin") java.math.BigDecimal budgetMin,
            @Param("budgetMax") java.math.BigDecimal budgetMax,
            Pageable pageable);

    // Count distinct providers who have completed jobs in a category
    @Query("SELECT COUNT(DISTINCT j.providerId) FROM JobMaster j " +
           "WHERE j.serviceCategoryId = :categoryId " +
           "AND j.providerId IS NOT NULL " +
           "AND j.status = 'COMPLETED' " +
           "AND (j.isDeleted IS NULL OR j.isDeleted = false)")
    Long countDistinctProvidersByCategoryId(@Param("categoryId") Long categoryId);

    // Count distinct providers who have completed jobs in a subcategory
    @Query("SELECT COUNT(DISTINCT j.providerId) FROM JobMaster j " +
           "WHERE j.serviceSubCategoryId = :subCategoryId " +
           "AND j.providerId IS NOT NULL " +
           "AND j.status = 'COMPLETED' " +
           "AND (j.isDeleted IS NULL OR j.isDeleted = false)")
    Long countDistinctProvidersBySubCategoryId(@Param("subCategoryId") Long subCategoryId);
}
