package com.servichaya.job.controller;

import com.servichaya.auth.service.JwtService;
import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.customer.service.CustomerProfileService;
import com.servichaya.customer.dto.CustomerProfileDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Job Contact Details Controller
 * Handles contact details visibility (only after provider accepts)
 */
@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobContactController {

    private final JobMasterRepository jobRepository;
    private final ServiceProviderProfileRepository providerRepository;
    private final CustomerProfileService customerProfileService;
    private final JwtService jwtService;

    /**
     * Get contact details for a job
     * Only visible after job is ACCEPTED
     * Customer sees provider contact, Provider sees customer contact
     */
    @GetMapping("/{jobId}/contact-details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getContactDetails(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Fetching contact details for jobId: {}", jobId);

        Long userId = extractUserIdFromToken(request);
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        // Verify job is ACCEPTED
        if (!"ACCEPTED".equals(job.getStatus()) && !"IN_PROGRESS".equals(job.getStatus()) 
            && !"PAYMENT_PENDING".equals(job.getStatus()) && !"COMPLETED".equals(job.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Contact details are only available after provider accepts the job"));
        }

        Map<String, Object> contactDetails = new HashMap<>();

        // Determine if requester is customer or provider
        boolean isCustomer = job.getCustomerId().equals(userId);
        boolean isProvider = job.getProviderId() != null && job.getProviderId().equals(userId);

        if (!isCustomer && !isProvider) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized: You can only view contact details for your own jobs"));
        }

        if (isCustomer) {
            // Customer sees provider contact details
            if (job.getProviderId() != null) {
                providerRepository.findById(job.getProviderId())
                        .ifPresent(provider -> {
                            contactDetails.put("providerName", 
                                    provider.getProviderType().equals("INDIVIDUAL")
                                            ? provider.getProviderCode()
                                            : provider.getBusinessName());
                            contactDetails.put("providerCode", provider.getProviderCode());
                            // Note: Phone and email should come from UserAccount, not ProviderProfile
                            // For now, we'll return what's available
                            contactDetails.put("providerType", provider.getProviderType());
                        });
            }
        } else if (isProvider) {
            // Provider sees customer contact details
            try {
                CustomerProfileDto customer = customerProfileService.getCustomerProfile(job.getCustomerId());
                contactDetails.put("customerName", customer.getName());
                contactDetails.put("customerMobile", customer.getMobileNumber());
                contactDetails.put("customerEmail", customer.getEmail());
                contactDetails.put("customerAddress", job.getAddressLine1() + 
                        (job.getAddressLine2() != null ? ", " + job.getAddressLine2() : ""));
            } catch (Exception e) {
                log.error("Error fetching customer profile: {}", e.getMessage());
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Failed to fetch customer contact details"));
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Contact details fetched successfully", contactDetails));
    }

    private Long extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }

        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}
