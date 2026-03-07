package com.servichaya.job.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.CreateJobDto;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobController {

    private final JobService jobService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<JobDto>> createJob(
            @RequestParam Long customerId,
            @RequestBody CreateJobDto createJobDto) {
        log.info("Received job creation request for customerId: {}", customerId);
        JobDto job = jobService.createJob(customerId, createJobDto);
        log.info("Job created successfully with jobCode: {}", job.getJobCode());
        return ResponseEntity.ok(ApiResponse.success("Job created successfully", job));
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching jobs for customerId: {}, status: {}, page: {}, size: {}", customerId, status, page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<JobDto> jobs = jobService.getCustomerJobs(customerId, status, pageable);
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all jobs with filters - status: {}, cityId: {}, page: {}, size: {}", status, cityId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<JobDto> jobs = jobService.getJobsWithFilters(status, cityId, customerId, providerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched successfully", jobs));
    }
}
