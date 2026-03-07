package com.servichaya.kundali.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servichaya.kundali.entity.CustomerActivityLog;
import com.servichaya.kundali.entity.ProviderActivityLog;
import com.servichaya.kundali.repository.CustomerActivityLogRepository;
import com.servichaya.kundali.repository.ProviderActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ProviderActivityLogRepository providerActivityLogRepository;
    private final CustomerActivityLogRepository customerActivityLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void logProviderActivity(Long providerId, String activityType, Map<String, Object> activityData,
                                     String ipAddress, String deviceInfo, BigDecimal latitude, BigDecimal longitude) {
        log.info("Logging provider activity: providerId={}, activityType={}", providerId, activityType);

        String activityDataJson = null;
        if (activityData != null && !activityData.isEmpty()) {
            try {
                activityDataJson = objectMapper.writeValueAsString(activityData);
            } catch (Exception e) {
                log.error("Error serializing activity data", e);
            }
        }

        ProviderActivityLog activityLog = ProviderActivityLog.builder()
                .providerId(providerId)
                .activityType(activityType)
                .activityData(activityDataJson)
                .ipAddress(ipAddress)
                .deviceInfo(deviceInfo)
                .locationLatitude(latitude)
                .locationLongitude(longitude)
                .build();

        providerActivityLogRepository.save(activityLog);
        log.debug("Provider activity logged successfully");
    }

    @Transactional
    public void logCustomerActivity(Long customerId, String activityType, Map<String, Object> activityData,
                                    String ipAddress, String deviceInfo, BigDecimal latitude, BigDecimal longitude) {
        log.info("Logging customer activity: customerId={}, activityType={}", customerId, activityType);

        String activityDataJson = null;
        if (activityData != null && !activityData.isEmpty()) {
            try {
                activityDataJson = objectMapper.writeValueAsString(activityData);
            } catch (Exception e) {
                log.error("Error serializing activity data", e);
            }
        }

        CustomerActivityLog activityLog = CustomerActivityLog.builder()
                .customerId(customerId)
                .activityType(activityType)
                .activityData(activityDataJson)
                .ipAddress(ipAddress)
                .deviceInfo(deviceInfo)
                .locationLatitude(latitude)
                .locationLongitude(longitude)
                .build();

        customerActivityLogRepository.save(activityLog);
        log.debug("Customer activity logged successfully");
    }

    public Page<ProviderActivityLog> getProviderActivityLogs(Long providerId, Pageable pageable) {
        log.info("Fetching activity logs for providerId: {}", providerId);
        return providerActivityLogRepository.findByProviderId(providerId, pageable);
    }

    public Page<CustomerActivityLog> getCustomerActivityLogs(Long customerId, Pageable pageable) {
        log.info("Fetching activity logs for customerId: {}", customerId);
        return customerActivityLogRepository.findByCustomerId(customerId, pageable);
    }
}
