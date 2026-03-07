package com.servichaya.customer.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.customer.dto.CustomerProfileDto;
import com.servichaya.customer.service.CustomerProfileService;
import com.servichaya.job.dto.JobDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customer/profile")
@RequiredArgsConstructor
@Slf4j
public class CustomerProfileController {

    private final CustomerProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<CustomerProfileDto>> getProfile(@RequestParam Long customerId) {
        log.info("Request to fetch profile for customerId: {}", customerId);
        CustomerProfileDto profile = profileService.getCustomerProfile(customerId);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched", profile));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<JobDto>>> getJobHistory(
            @RequestParam Long customerId,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Request to fetch job history for customerId: {}", customerId);
        Page<JobDto> jobs = profileService.getCustomerJobHistory(customerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Job history fetched", jobs));
    }
}
