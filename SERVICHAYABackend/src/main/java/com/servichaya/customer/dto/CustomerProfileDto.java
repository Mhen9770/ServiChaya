package com.servichaya.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileDto {
    private Long userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String name; // Alias for fullName for frontend compatibility
    private String email;
    private String mobileNumber;
    private String profileImageUrl;
    private List<AddressDto> addresses;
    private Long totalJobs;
    private Long completedJobs;
    private Long cancelledJobs;
    private Long activeJobs;
    private Double totalSpent;
    private Double averageRating;
    private java.time.LocalDateTime createdAt;
}
