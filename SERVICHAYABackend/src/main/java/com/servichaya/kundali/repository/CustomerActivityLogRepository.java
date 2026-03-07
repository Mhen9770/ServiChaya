package com.servichaya.kundali.repository;

import com.servichaya.kundali.entity.CustomerActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerActivityLogRepository extends JpaRepository<CustomerActivityLog, Long> {

    @Query("SELECT a FROM CustomerActivityLog a WHERE a.customerId = :customerId ORDER BY a.createdAt DESC")
    Page<CustomerActivityLog> findByCustomerId(@Param("customerId") Long customerId, Pageable pageable);

    @Query("SELECT a FROM CustomerActivityLog a WHERE a.customerId = :customerId AND a.activityType = :activityType ORDER BY a.createdAt DESC")
    List<CustomerActivityLog> findByCustomerIdAndActivityType(
            @Param("customerId") Long customerId,
            @Param("activityType") String activityType);

    @Query("SELECT a FROM CustomerActivityLog a WHERE a.customerId = :customerId AND a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    List<CustomerActivityLog> findByCustomerIdAndDateRange(
            @Param("customerId") Long customerId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
