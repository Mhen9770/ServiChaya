package com.servichaya.job.repository;

import com.servichaya.job.entity.JobWorkflowAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobWorkflowAssignmentRepository extends JpaRepository<JobWorkflowAssignment, Long> {

    @Query("SELECT a FROM JobWorkflowAssignment a " +
           "WHERE a.isActive = true " +
           "AND ((:subCategoryId IS NOT NULL AND a.serviceSubCategoryId = :subCategoryId) " +
           "  OR (:subCategoryId IS NULL AND a.serviceSubCategoryId IS NULL)) " +
           "AND ((:categoryId IS NOT NULL AND a.serviceCategoryId = :categoryId) " +
           "  OR (:categoryId IS NULL AND a.serviceCategoryId IS NULL)) " +
           "ORDER BY a.priority DESC, a.id ASC")
    List<JobWorkflowAssignment> findApplicableAssignments(@Param("categoryId") Long categoryId,
                                                          @Param("subCategoryId") Long subCategoryId);
}

