package com.servichaya.provider.service;

import com.servichaya.customer.dto.CustomerProfileDto;
import com.servichaya.customer.service.CustomerProfileService;
import com.servichaya.job.dto.JobDto;
import com.servichaya.job.service.JobService;
import com.servichaya.provider.dto.ProviderCustomerDto;
import com.servichaya.provider.entity.ProviderCustomerLink;
import com.servichaya.provider.repository.ProviderCustomerLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderCustomerService {

    private final ProviderCustomerLinkRepository linkRepository;
    private final CustomerProfileService customerProfileService;
    private final JobService jobService;

    public List<ProviderCustomerDto> getCustomersForProvider(Long providerId) {
        log.info("Fetching customers for providerId: {}", providerId);

        List<ProviderCustomerLink> links = linkRepository.findByProviderId(providerId);
        if (links.isEmpty()) {
            return Collections.emptyList();
        }

        // Group links by customerId
        Map<Long, List<ProviderCustomerLink>> byCustomer = links.stream()
                .collect(Collectors.groupingBy(ProviderCustomerLink::getCustomerId));

        List<ProviderCustomerDto> result = new ArrayList<>();

        for (Map.Entry<Long, List<ProviderCustomerLink>> entry : byCustomer.entrySet()) {
            Long customerId = entry.getKey();
            List<ProviderCustomerLink> customerLinks = entry.getValue();

            try {
                CustomerProfileDto customer = customerProfileService.getCustomerProfile(customerId);

                // Fetch jobs between provider and this customer (limited)
                Page<JobDto> jobsPage = jobService.getProviderJobs(
                        providerId,
                        null,
                        PageRequest.of(0, 500)
                );
                List<JobDto> jobsWithCustomer = jobsPage.getContent().stream()
                        .filter(j -> Objects.equals(j.getCustomerId(), customerId))
                        .collect(Collectors.toList());

                long totalJobs = jobsWithCustomer.size();
                long completedJobs = jobsWithCustomer.stream()
                        .filter(j -> "COMPLETED".equals(j.getStatus()))
                        .count();
                double totalEarnings = jobsWithCustomer.stream()
                        .filter(j -> "COMPLETED".equals(j.getStatus()) && j.getFinalPrice() != null)
                        .mapToDouble(j -> j.getFinalPrice().doubleValue())
                        .sum();

                boolean primary = customerLinks.stream()
                        .anyMatch(l -> Boolean.TRUE.equals(l.getIsPrimary()));
                String source = customerLinks.stream()
                        .map(ProviderCustomerLink::getSource)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse("UNKNOWN");

                ProviderCustomerDto dto = ProviderCustomerDto.builder()
                        .customerId(customer.getUserId())
                        .name(Optional.ofNullable(customer.getFullName()).orElse(customer.getName()))
                        .mobileNumber(customer.getMobileNumber())
                        .email(customer.getEmail())
                        .totalJobsTogether(totalJobs)
                        .completedJobsTogether(completedJobs)
                        .totalEarningsFromCustomer(totalEarnings)
                        .primaryForThisProvider(primary)
                        .source(source)
                        .build();

                result.add(dto);
            } catch (Exception ex) {
                log.error("Failed to build ProviderCustomerDto for providerId: {}, customerId: {}", providerId, customerId, ex);
            }
        }

        // Sort by most recent / highest value later; for now, sort by completed jobs desc
        result.sort(Comparator.comparingLong(ProviderCustomerDto::getCompletedJobsTogether).reversed());
        return result;
    }
}

