package com.servichaya.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDto {
    private Long id;
    private Long userId;
    private String customerCode;
    private String name;
    private String email;
    private String mobileNumber;
    private Long totalJobsCreated;
    private Long totalJobsCompleted;
    private Long totalJobsCancelled;
    private Long activeJobs;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private String accountStatus;
    private Boolean emailVerified;
    private Boolean mobileVerified;
    private String profileImageUrl;
}
