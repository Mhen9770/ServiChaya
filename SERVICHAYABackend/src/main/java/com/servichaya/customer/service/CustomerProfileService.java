package com.servichaya.customer.service;

import com.servichaya.customer.dto.AddressDto;
import com.servichaya.customer.dto.CreateAddressRequestDto;
import com.servichaya.customer.dto.CustomerProfileDto;
import com.servichaya.customer.dto.UpdateCustomerProfileRequestDto;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import com.servichaya.location.entity.CityMaster;
import com.servichaya.location.entity.PodMaster;
import com.servichaya.location.entity.ZoneMaster;
import com.servichaya.location.repository.CityMasterRepository;
import com.servichaya.location.repository.PodMasterRepository;
import com.servichaya.location.repository.ZoneMasterRepository;
import com.servichaya.location.service.LocationService;
import com.servichaya.user.entity.UserAccount;
import com.servichaya.user.entity.UserAddress;
import com.servichaya.user.repository.UserAccountRepository;
import com.servichaya.user.repository.UserAddressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerProfileService {

    private final UserAccountRepository userAccountRepository;
    private final UserAddressRepository userAddressRepository;
    private final JobService jobService;
    private final CityMasterRepository cityMasterRepository;
    private final ZoneMasterRepository zoneMasterRepository;
    private final PodMasterRepository podMasterRepository;
    private final LocationService locationService;

    @Transactional(readOnly = true)
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

    @Transactional
    public AddressDto createAddress(Long customerId, CreateAddressRequestDto request) {
        log.info("Creating address for customerId: {}", customerId);

        UserAccount user = userAccountRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.error("Customer not found with id: {}", customerId);
                    return new RuntimeException("Customer not found");
                });

        // Auto-resolve POD/Zone/City from lat/lng if not provided (geofencing)
        Long resolvedCityId = request.getCityId();
        Long resolvedZoneId = request.getZoneId();
        Long resolvedPodId = request.getPodId();
        
        BigDecimal latitude = request.getLatitude();
        BigDecimal longitude = request.getLongitude();
        
        // If lat/lng provided but POD/Zone missing, auto-resolve
        if ((resolvedZoneId == null || resolvedPodId == null) && latitude != null && longitude != null) {
            try {
                log.info("Auto-resolving location from lat/lng: {}, {}", latitude, longitude);
                com.servichaya.location.dto.ResolvedLocationDto resolved = locationService.resolveLocation(latitude, longitude);
                
                // Use resolved city if cityId not provided
                if (resolvedCityId == null && resolved.getCityId() != null) {
                    resolvedCityId = resolved.getCityId();
                    log.info("Auto-resolved cityId: {}", resolvedCityId);
                }
                // Use resolved zone if zoneId not provided
                if (resolvedZoneId == null && resolved.getZoneId() != null) {
                    resolvedZoneId = resolved.getZoneId();
                    log.info("Auto-resolved zoneId: {}", resolvedZoneId);
                }
                // Use resolved POD if podId not provided
                if (resolvedPodId == null && resolved.getPodId() != null) {
                    resolvedPodId = resolved.getPodId();
                    log.info("Auto-resolved podId: {}", resolvedPodId);
                }
            } catch (Exception e) {
                log.warn("Failed to auto-resolve location from lat/lng, using provided values: {}", e.getMessage());
                // Continue with provided values
            }
        }
        
        // Validate city (required)
        final Long finalCityId = resolvedCityId;
        CityMaster city;
        if (finalCityId != null) {
            city = cityMasterRepository.findById(finalCityId)
                    .orElseThrow(() -> {
                        log.error("City not found with id: {}", finalCityId);
                        return new RuntimeException("City not found");
                    });
        } else {
            throw new RuntimeException("City ID is required. Please provide cityId or valid latitude/longitude.");
        }

        // Validate zone if provided
        ZoneMaster zone = null;
        if (resolvedZoneId != null) {
            zone = zoneMasterRepository.findById(resolvedZoneId)
                    .orElse(null);
            if (zone == null) {
                log.warn("Zone not found with id: {}", resolvedZoneId);
            }
        }

        // Validate pod if provided
        PodMaster pod = null;
        if (resolvedPodId != null) {
            pod = podMasterRepository.findById(resolvedPodId)
                    .orElse(null);
            if (pod == null) {
                log.warn("POD not found with id: {}", resolvedPodId);
            }
        }

        // If this is set as primary, unset other primary addresses
        if (request.getIsPrimary() != null && request.getIsPrimary()) {
            List<UserAddress> existingAddresses = userAddressRepository.findByUserIdAndIsDeletedFalse(customerId);
            for (UserAddress existingAddress : existingAddresses) {
                if (existingAddress.getIsPrimary() != null && existingAddress.getIsPrimary()) {
                    existingAddress.setIsPrimary(false);
                    userAddressRepository.save(existingAddress);
                }
            }
        }

        // Default latitude/longitude if not provided (use city center)
        if (latitude == null || longitude == null) {
            if (city.getLatitude() != null && city.getLongitude() != null) {
                latitude = city.getLatitude();
                longitude = city.getLongitude();
            } else {
                // Default to 0,0 if city coordinates not available
                latitude = java.math.BigDecimal.ZERO;
                longitude = java.math.BigDecimal.ZERO;
            }
        }

        UserAddress address = UserAddress.builder()
                .user(user)
                .addressLabel(request.getAddressLabel())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .landmark(request.getLandmark())
                .pincode(request.getPincode())
                .city(city)
                .zone(zone)
                .pod(pod)
                .latitude(latitude)
                .longitude(longitude)
                .isPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false)
                .isVerified(false)
                .build();

        address = userAddressRepository.save(address);
        log.info("Address created with id: {} for customerId: {}", address.getId(), customerId);

        return mapToAddressDto(address);
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
