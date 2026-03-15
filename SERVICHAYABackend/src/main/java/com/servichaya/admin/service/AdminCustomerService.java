package com.servichaya.admin.service;

import com.servichaya.admin.dto.CustomerDto;
import com.servichaya.admin.dto.CustomerJobStatsProjection;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.user.entity.UserAccount;
import com.servichaya.user.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCustomerService {

    private final UserAccountRepository userAccountRepository;
    private final JobMasterRepository jobRepository;

    public Page<CustomerDto> getCustomers(String status, Pageable pageable) {
        log.info("Fetching customers with status: {}, page: {}, size: {}", status, pageable.getPageNumber(), pageable.getPageSize());

        Specification<UserAccount> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by active status
            if (status != null && !status.isEmpty() && !"ALL".equals(status)) {
                if ("ACTIVE".equals(status)) {
                    predicates.add(cb.equal(root.get("isActive"), true));
                } else if ("INACTIVE".equals(status)) {
                    predicates.add(cb.equal(root.get("isActive"), false));
                }
            }
            
            // Exclude deleted records
            predicates.add(cb.or(
                cb.isNull(root.get("isDeleted")),
                cb.equal(root.get("isDeleted"), false)
            ));
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Fetch customers page
        Page<UserAccount> customersPage = userAccountRepository.findAll(spec, pageable);
        
        // Batch fetch job statistics for all customers in the page
        List<Long> customerIds = customersPage.getContent().stream()
                .map(UserAccount::getId)
                .toList();
        
        Map<Long, CustomerJobStatsProjection> statsMap = new HashMap<>();
        if (!customerIds.isEmpty()) {
            List<CustomerJobStatsProjection> stats = jobRepository.getCustomerJobStatsBatch(customerIds);
            statsMap = stats.stream()
                    .collect(Collectors.toMap(
                        CustomerJobStatsProjection::getCustomerId,
                        stat -> stat
                    ));
        }
        
        final Map<Long, CustomerJobStatsProjection> finalStatsMap = statsMap;
        
        // Map to DTOs with pre-fetched statistics
        return customersPage.map(user -> mapToDtoWithStats(user, finalStatsMap.get(user.getId())));
    }

    public CustomerDto getCustomerById(Long customerId) {
        log.info("Fetching customer by id: {}", customerId);
        UserAccount user = userAccountRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("Customer not found with id: {}", customerId);
                    return new RuntimeException("Customer not found");
                });
        return mapToDto(user);
    }

    @Transactional
    public CustomerDto updateCustomer(Long customerId, CustomerDto dto) {
        log.info("Updating customer id: {}", customerId);
        UserAccount user = userAccountRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("Customer not found with id: {}", customerId);
                    return new RuntimeException("Customer not found");
                });

        // Update allowed fields
        if (dto.getIsActive() != null) {
            user.setIsActive(dto.getIsActive());
        }
        if (dto.getAccountStatus() != null) {
            user.setAccountStatus(dto.getAccountStatus());
        }
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            // Check if email is already taken by another user
            userAccountRepository.findByEmail(dto.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(customerId)) {
                            throw new RuntimeException("Email already exists");
                        }
                    });
            user.setEmail(dto.getEmail());
        }
        if (dto.getMobileNumber() != null && !dto.getMobileNumber().isEmpty()) {
            // Check if mobile is already taken by another user
            userAccountRepository.findByMobileNumber(dto.getMobileNumber())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(customerId)) {
                            throw new RuntimeException("Mobile number already exists");
                        }
                    });
            user.setMobileNumber(dto.getMobileNumber());
        }
        if (dto.getName() != null) {
            user.setFullName(dto.getName());
            // Try to split name into first and last name
            String[] nameParts = dto.getName().split(" ", 2);
            if (nameParts.length > 0) {
                user.setFirstName(nameParts[0]);
                if (nameParts.length > 1) {
                    user.setLastName(nameParts[1]);
                }
            }
        }

        user = userAccountRepository.save(user);
        log.info("Customer {} updated successfully", customerId);
        return mapToDto(user);
    }

    @Transactional
    public void deactivateCustomer(Long customerId) {
        log.info("Deactivating customer id: {}", customerId);
        UserAccount user = userAccountRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("Customer not found with id: {}", customerId);
                    return new RuntimeException("Customer not found");
                });

        user.setIsActive(false);
        user.setAccountStatus("DEACTIVATED");
        userAccountRepository.save(user);
        log.info("Customer {} deactivated successfully", customerId);
    }

    @Transactional
    public void activateCustomer(Long customerId) {
        log.info("Activating customer id: {}", customerId);
        UserAccount user = userAccountRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("Customer not found with id: {}", customerId);
                    return new RuntimeException("Customer not found");
                });

        user.setIsActive(true);
        if ("DEACTIVATED".equals(user.getAccountStatus())) {
            user.setAccountStatus("ACTIVE");
        }
        userAccountRepository.save(user);
        log.info("Customer {} activated successfully", customerId);
    }

    private CustomerDto mapToDto(UserAccount user) {
        // For single customer fetch, use individual queries
        return mapToDtoWithStats(user, null);
    }

    private CustomerDto mapToDtoWithStats(UserAccount user, CustomerJobStatsProjection stats) {
        // Generate customer code if not exists (format: CUST{userId})
        String customerCode = "CUST" + String.format("%06d", user.getId());
        
        // Get job statistics - use pre-fetched stats if available, otherwise fetch individually
        Long totalJobsCreated;
        Long totalJobsCompleted;
        Long totalJobsCancelled;
        Long activeJobs;
        
        if (stats != null) {
            // Use pre-fetched batch statistics
            totalJobsCreated = stats.getTotalJobs() != null ? stats.getTotalJobs() : 0L;
            totalJobsCompleted = stats.getCompletedJobs() != null ? stats.getCompletedJobs() : 0L;
            totalJobsCancelled = stats.getCancelledJobs() != null ? stats.getCancelledJobs() : 0L;
            activeJobs = stats.getActiveJobs() != null ? stats.getActiveJobs() : 0L;
        } else {
            // Fallback to individual queries (for single customer fetch)
            totalJobsCreated = jobRepository.countByCustomerId(user.getId());
            totalJobsCompleted = jobRepository.countByCustomerIdAndStatus(user.getId(), "COMPLETED");
            totalJobsCancelled = jobRepository.countByCustomerIdAndStatus(user.getId(), "CANCELLED");
            activeJobs = jobRepository.countByCustomerIdAndStatusIn(
                user.getId(), 
                List.of("PENDING", "MATCHING", "MATCHED", "ACCEPTED", "IN_PROGRESS", "PAYMENT_PENDING")
            );
        }

        return CustomerDto.builder()
                .id(user.getId())
                .userId(user.getId())
                .customerCode(customerCode)
                .name(user.getFullName() != null ? user.getFullName() : 
                      (user.getFirstName() != null ? user.getFirstName() + 
                       (user.getLastName() != null ? " " + user.getLastName() : "") : "Customer"))
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .totalJobsCreated(totalJobsCreated)
                .totalJobsCompleted(totalJobsCompleted)
                .totalJobsCancelled(totalJobsCancelled)
                .activeJobs(activeJobs)
                .isActive(user.getIsActive() != null ? user.getIsActive() : true)
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .accountStatus(user.getAccountStatus())
                .emailVerified(user.getEmailVerified())
                .mobileVerified(user.getMobileVerified())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
