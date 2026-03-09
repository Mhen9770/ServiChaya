package com.servichaya.auth.service;

import com.servichaya.auth.entity.OtpVerification;
import com.servichaya.auth.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    
    @Value("${otp.expiration:300000}") // 5 minutes default
    private long otpExpirationMs;
    
    @Value("${otp.length:6}")
    private int otpLength;

    @Transactional
    public String generateAndSendOtp(String mobileNumber, String ipAddress) {
        // Expire old OTPs
        otpRepository.expireOldOtps(mobileNumber, LocalDateTime.now());
        
        // Check rate limiting (max 5 OTPs per hour)
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        Long recentOtps = otpRepository.countByMobileNumberSince(mobileNumber, oneHourAgo);
        if (recentOtps >= 5) {
            throw new RuntimeException("Too many OTP requests. Please try again later.");
        }
        
        // Generate OTP
        String otpCode = generateOtp();
        
        // Save OTP
        OtpVerification otp = OtpVerification.builder()
            .mobileNumber(mobileNumber)
            .otpCode(otpCode)
            .expiresAt(LocalDateTime.now().plusSeconds(otpExpirationMs / 1000))
            .status("PENDING")
            .attempts(0)
            .ipAddress(ipAddress)
            .build();
        
        otpRepository.save(otp);
        
        // TODO: Send SMS via Twilio/MessageBird
        log.info("OTP generated for {}: {}", mobileNumber, otpCode);
        // For development, log OTP. In production, send via SMS service
        
        return otpCode; // Return for testing, remove in production
    }

    @Transactional
    public boolean verifyOtp(String mobileNumber, String otpCode) {
        OtpVerification otp = otpRepository
            .findFirstByMobileNumberAndStatusOrderByCreatedAtDesc(mobileNumber, "PENDING")
            .orElseThrow(() -> new RuntimeException("No pending OTP found"));
        
        // Check if expired
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otp.setStatus("EXPIRED");
            otpRepository.save(otp);
            throw new RuntimeException("OTP has expired");
        }
        
        // Check attempts (max 3)
        if (otp.getAttempts() >= 3) {
            throw new RuntimeException("Too many verification attempts");
        }
        
        // Verify OTP
        otp.setAttempts(otp.getAttempts() + 1);
        if (otp.getOtpCode().equals(otpCode)) {
            otp.setStatus("VERIFIED");
            otp.setVerifiedAt(LocalDateTime.now());
            otpRepository.save(otp);
            return true;
        }
        
        otpRepository.save(otp);
        return false;
    }

    private String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(random.nextInt(10));
        }
        // for Now hardcoded to 123456
        otp = new StringBuilder("123123");
        return otp.toString();
    }
}
