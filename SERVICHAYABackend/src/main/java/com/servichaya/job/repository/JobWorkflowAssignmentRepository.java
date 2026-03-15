package com.servichaya.job.repository;

import com.servichaya.job.entity.JobWorkflowAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobWorkflowAssignmentRepository extends JpaRepository<JobWorkflowAssignment, Long> {

    /**
     * Find workflow assignments that match the given category and subcategory.
     * Priority: subcategory match > category match > global (no category/subcategory)
     * 
     * This query finds assignments where:
     * - If subCategoryId is provided: matches subcategory (and optionally category)
     * - If only categoryId is provided: matches category (and no subcategory)
     * - If both are null: matches global assignments (no category/subcategory)
     */
    @Query("SELECT a FROM JobWorkflowAssignment a " +
           "WHERE a.isActive = true " +
           "AND (" +
           "  (:subCategoryId IS NOT NULL AND a.serviceSubCategoryId = :subCategoryId " +
           "   AND (:categoryId IS NULL OR a.serviceCategoryId = :categoryId OR a.serviceCategoryId IS NULL)) " +
           "  OR (:subCategoryId IS NULL AND :categoryId IS NOT NULL AND a.serviceCategoryId = :categoryId " +
           "      AND a.serviceSubCategoryId IS NULL) " +
           "  OR (:subCategoryId IS NULL AND :categoryId IS NULL " +
           "      AND a.serviceCategoryId IS NULL AND a.serviceSubCategoryId IS NULL)" +
           ") " +
           "ORDER BY " +
           "  CASE WHEN (:subCategoryId IS NOT NULL AND a.serviceSubCategoryId = :subCategoryId) THEN 1 " +
           "       WHEN (:categoryId IS NOT NULL AND a.serviceCategoryId = :categoryId) THEN 2 " +
           "       ELSE 3 END, " +
           "  a.priority DESC, a.id ASC")
    List<JobWorkflowAssignment> findApplicableAssignments(@Param("categoryId") Long categoryId,
                                                          @Param("subCategoryId") Long subCategoryId);
}

