package com.servichaya.auth.repository;

import com.servichaya.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findFirstByMobileNumberAndStatusOrderByCreatedAtDesc(
        String mobileNumber, 
        String status
    );

    @Modifying
    @Query("UPDATE OtpVerification o SET o.status = 'EXPIRED' WHERE o.mobileNumber = :mobileNumber AND o.status = 'PENDING' AND o.expiresAt < :now")
    void expireOldOtps(@Param("mobileNumber") String mobileNumber, @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(o) FROM OtpVerification o WHERE o.mobileNumber = :mobileNumber AND o.createdAt >= :since")
    Long countByMobileNumberSince(@Param("mobileNumber") String mobileNumber, @Param("since") LocalDateTime since);
}
