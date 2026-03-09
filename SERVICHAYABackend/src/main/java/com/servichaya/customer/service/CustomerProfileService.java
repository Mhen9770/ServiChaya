package com.servichaya.customer.service;

import com.servichaya.customer.dto.AddressDto;
import com.servichaya.customer.dto.CustomerProfileDto;
import com.servichaya.customer.dto.UpdateCustomerProfileRequestDto;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import com.servichaya.user.entity.UserAccount;
import com.servichaya.user.entity.UserAddress;
import com.servichaya.user.repository.UserAccountRepository;
import com.servichaya.user.repository.UserAddressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerProfileService {

    private final UserAccountRepository userAccountRepository;
    private final UserAddressRepository userAddressRepository;
    private final JobService jobService;

    public CustomerProfileDto getCustomerProfile(Long customerId) {
        log.info("Fetching customer profile for customerId: {}", customerId);

        UserAccount user = userAccountRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("Customer not found with id: {}", customerId);
                    return new RuntimeException("Customer not found");
                });

        List<UserAddress> addresses = userAddressRepository.findByUserIdAndIsDeletedFalse(customerId);
        Page<JobDto> jobs = jobService.getCustomerJobs(customerId, null, 
                org.springframework.data.domain.PageRequest.of(0, 1000));

        long totalJobs = jobs.getTotalElements();
        long completedJobs = jobs.getContent().stream()
                .filter(job -> "COMPLETED".equals(job.getStatus()))
                .count();
        long cancelledJobs = jobs.getContent().stream()
                .filter(job -> "CANCELLED".equals(job.getStatus()))
                .count();
        long activeJobs = jobs.getContent().stream()
                .filter(job -> "PENDING".equals(job.getStatus()) || 
                              "ACCEPTED".equals(job.getStatus()) || 
                              "IN_PROGRESS".equals(job.getStatus()))
                .count();
        
        // Calculate total spent from completed jobs
        double totalSpent = jobs.getContent().stream()
                .filter(job -> "COMPLETED".equals(job.getStatus()) && job.getFinalPrice() != null)
                .mapToDouble(job -> job.getFinalPrice().doubleValue())
                .sum();
        
        // Calculate average rating (placeholder - implement when review system is ready)
        double averageRating = 0.0;

        return CustomerProfileDto.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .name(user.getFullName()) // Alias for frontend compatibility
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .profileImageUrl(user.getProfileImageUrl())
                .addresses(addresses.stream().map(this::mapToAddressDto).collect(Collectors.toList()))
                .totalJobs(totalJobs)
                .completedJobs(completedJobs)
                .cancelledJobs(cancelledJobs)
                .activeJobs(activeJobs)
                .totalSpent(totalSpent)
                .averageRating(averageRating)
                .createdAt(user.getCreatedAt())
                .build();
    }

    public CustomerProfileDto updateCustomerProfile(Long customerId, UpdateCustomerProfileRequestDto request) {
        log.info("Updating customer profile for customerId: {}", customerId);

        UserAccount user = userAccountRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("Customer not found with id: {}", customerId);
                    return new RuntimeException("Customer not found");
                });

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            String name = request.getName().trim();
            user.setFullName(name);

            // Basic split into first/last name for better personalization
            String[] parts = name.split(" ", 2);
            user.setFirstName(parts[0]);
            if (parts.length > 1) {
                user.setLastName(parts[1]);
            }
        }

        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl().trim());
        }

        userAccountRepository.save(user);

        // Reuse existing mapping logic to return updated profile snapshot
        return getCustomerProfile(customerId);
    }

    public Page<JobDto> getCustomerJobHistory(Long customerId, Pageable pageable) {
        log.info("Fetching job history for customerId: {}", customerId);
        return jobService.getCustomerJobs(customerId, null, pageable);
    }

    private AddressDto mapToAddressDto(UserAddress address) {
        return AddressDto.builder()
                .id(address.getId())
                .addressLabel(address.getAddressLabel())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .landmark(address.getLandmark())
                .pincode(address.getPincode())
                .cityId(address.getCity() != null ? address.getCity().getId() : null)
                .cityName(address.getCity() != null ? address.getCity().getName() : null)
                .zoneId(address.getZone() != null ? address.getZone().getId() : null)
                .zoneName(address.getZone() != null ? address.getZone().getName() : null)
                .podId(address.getPod() != null ? address.getPod().getId() : null)
                .podName(address.getPod() != null ? address.getPod().getName() : null)
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .isPrimary(address.getIsPrimary())
                .isDefault(address.getIsPrimary()) // Alias for frontend compatibility
                .build();
    }
}
