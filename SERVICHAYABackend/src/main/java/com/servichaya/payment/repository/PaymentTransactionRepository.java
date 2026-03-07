package com.servichaya.payment.repository;

import com.servichaya.payment.entity.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionCode(String transactionCode);

    Optional<PaymentTransaction> findByRazorpayPaymentId(String razorpayPaymentId);

    @Query("SELECT p FROM PaymentTransaction p WHERE p.jobId = :jobId ORDER BY p.createdAt DESC")
    Page<PaymentTransaction> findByJobId(@Param("jobId") Long jobId, Pageable pageable);

    @Query("SELECT p FROM PaymentTransaction p WHERE p.userId = :userId ORDER BY p.createdAt DESC")
    Page<PaymentTransaction> findByUserId(@Param("userId") Long userId, Pageable pageable);
}
