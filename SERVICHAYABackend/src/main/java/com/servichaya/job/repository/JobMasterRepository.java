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
}
