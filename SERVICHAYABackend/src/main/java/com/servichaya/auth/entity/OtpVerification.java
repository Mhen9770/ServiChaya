package com.servichaya.auth.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verification", indexes = {
    @Index(name = "idx_mobile_otp", columnList = "mobile_number,otp_code"),
    @Index(name = "idx_mobile_status", columnList = "mobile_number,status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification extends BaseEntity {

    @Column(name = "mobile_number", length = 20, nullable = false)
    private String mobileNumber;

    @Column(name = "otp_code", length = 6, nullable = false)
    private String otpCode;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "status", length = 20, nullable = false)
    private String status; // PENDING, VERIFIED, EXPIRED

    @Builder.Default
    @Column(name = "attempts", nullable = false)
    private Integer attempts = 0;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;
}
