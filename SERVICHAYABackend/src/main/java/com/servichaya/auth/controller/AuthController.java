package com.servichaya.auth.controller;

import com.servichaya.auth.dto.AuthResponse;
import com.servichaya.auth.dto.OtpRequest;
import com.servichaya.auth.dto.OtpVerifyRequest;
import com.servichaya.auth.service.AuthService;
import com.servichaya.auth.service.OtpService;
import com.servichaya.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final OtpService otpService;
    private final AuthService authService;

    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<String>> sendOtp(
            @Valid @RequestBody OtpRequest request,
            HttpServletRequest httpRequest) {
        try {
            log.info("Sending OTP for mobile: {}", request.getMobileNumber());
            String ipAddress = getClientIpAddress(httpRequest);
            String otp = otpService.generateAndSendOtp(request.getMobileNumber(), ipAddress);
            log.info("OTP sent successfully for mobile: {} , otp : {}", request.getMobileNumber(), otp);
            // In development, return OTP for testing. Remove in production
            return ResponseEntity.ok(ApiResponse.success(
                "OTP sent successfully. OTP: " + otp + " (Remove in production)",
                otp
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request) {
        try {
            boolean isValid = otpService.verifyOtp(request.getMobileNumber(), request.getOtpCode());
            if (!isValid) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid OTP"));
            }
            
            // Create or get user and generate token
            AuthResponse authResponse = authService.authenticateWithOtp(request.getMobileNumber());
            return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(
            @RequestParam String email,
            @RequestParam String name,
            @RequestParam(required = false) String profileImageUrl) {
        try {
            AuthResponse authResponse = authService.authenticateWithGoogle(email, name, profileImageUrl);
            return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
