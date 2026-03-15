package com.servichaya.job.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.CreateJobDto;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import com.servichaya.auth.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobController {

    private final JobService jobService;
    private final JwtService jwtService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<JobDto>> createJob(
            @RequestParam Long customerId,
            @RequestBody @jakarta.validation.Valid CreateJobDto createJobDto,
            HttpServletRequest request) {
        log.info("Received job creation request for customerId: {}", customerId);
        
        // Security: Verify that the authenticated user matches the customerId
        Long authenticatedUserId = extractUserIdFromToken(request);
        if (!authenticatedUserId.equals(customerId)) {
            log.error("Authorization failed: authenticated userId {} does not match requested customerId {}", authenticatedUserId, customerId);
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Unauthorized: You can only create jobs for yourself"));
        }
        
        JobDto job = jobService.createJob(customerId, createJobDto);
        log.info("Job created successfully with jobCode: {}", job.getJobCode());
        return ResponseEntity.ok(ApiResponse.success("Job created successfully", job));
    }
    
    private Long extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("Authorization header missing or invalid");
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }
        
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        try {
            Long userId = jwtService.extractUserId(token);
            log.debug("Extracted userId: {} from token", userId);
            return userId;
        } catch (Exception e) {
            log.error("Error extracting userId from token", e);
            throw new RuntimeException("Unauthorized: Invalid token", e);
        }
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobDto>> getJobById(@PathVariable Long jobId) {
        log.info("Fetching job by id: {}", jobId);
        JobDto job = jobService.getJobById(jobId);
        return ResponseEntity.ok(ApiResponse.success("Job fetched successfully", job));
    }

    @GetMapping("/code/{jobCode}")
    public ResponseEntity<ApiResponse<JobDto>> getJobByCode(@PathVariable String jobCode) {
        log.info("Fetching job by code: {}", jobCode);
        JobDto job = jobService.getJobByCode(jobCode);
        return ResponseEntity.ok(ApiResponse.success("Job fetched successfully", job));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<Page<JobDto>>> getCustomerJobs(
            @PathVariable Long customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isEmergency,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) java.math.BigDecimal budgetMin,
            @RequestParam(required = false) java.math.BigDecimal budgetMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching jobs for customerId: {}, status: {}, isEmergency: {}, dateFrom: {}, dateTo: {}, budgetMin: {}, budgetMax: {}, page: {}, size: {}", 
                customerId, status, isEmergency, dateFrom, dateTo, budgetMin, budgetMax, page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Parse date strings to LocalDateTime
        LocalDateTime parsedDateFrom = null;
        LocalDateTime parsedDateTo = null;
        if (dateFrom != null && !dateFrom.isEmpty()) {
            try {
                parsedDateFrom = LocalDateTime.parse(dateFrom, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                log.warn("Invalid dateFrom format: {}", dateFrom);
            }
        }
        if (dateTo != null && !dateTo.isEmpty()) {
            try {
                parsedDateTo = LocalDateTime.parse(dateTo, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                log.warn("Invalid dateTo format: {}", dateTo);
            }
        }
        
        Page<JobDto> jobs = jobService.getCustomerJobsWithFilters(customerId, status, isEmergency, parsedDateFrom, parsedDateTo, budgetMin, budgetMax, pageable);
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched successfully", jobs));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse<Page<JobDto>>> getProviderJobs(
            @PathVariable Long providerId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching jobs for providerId: {}, status: {}, page: {}, size: {}", providerId, status, page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<JobDto> jobs = jobService.getProviderJobs(providerId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched successfully", jobs));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<JobDto>>> getJobsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Fetching jobs by status: {}, page: {}, size: {}", status, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<JobDto> jobs = jobService.getJobsByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched successfully", jobs));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<Page<JobDto>>> getAllJobs(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long subCategoryId,
            @RequestParam(required = false) Boolean isEmergency,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) java.math.BigDecimal budgetMin,
            @RequestParam(required = false) java.math.BigDecimal budgetMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all jobs with advanced filters - status: {}, cityId: {}, customerId: {}, providerId: {}, categoryId: {}, subCategoryId: {}, isEmergency: {}, dateFrom: {}, dateTo: {}, budgetMin: {}, budgetMax: {}, page: {}, size: {}", 
                status, cityId, customerId, providerId, categoryId, subCategoryId, isEmergency, dateFrom, dateTo, budgetMin, budgetMax, page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Parse date strings to LocalDateTime
        LocalDateTime parsedDateFrom = null;
        LocalDateTime parsedDateTo = null;
        if (dateFrom != null && !dateFrom.isEmpty()) {
            try {
                parsedDateFrom = LocalDateTime.parse(dateFrom, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                log.warn("Invalid dateFrom format: {}", dateFrom);
            }
        }
        if (dateTo != null && !dateTo.isEmpty()) {
            try {
                parsedDateTo = LocalDateTime.parse(dateTo, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                log.warn("Invalid dateTo format: {}", dateTo);
            }
        }
        
        Page<JobDto> jobs = jobService.getJobsWithAdvancedFilters(
                status, cityId, customerId, providerId, categoryId, subCategoryId, 
                isEmergency, parsedDateFrom, parsedDateTo, budgetMin, budgetMax, pageable);
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched successfully", jobs));
    }
}
