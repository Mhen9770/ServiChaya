package com.servichaya.payment.service;

import com.servichaya.payment.dto.CreatePaymentPreferenceDto;
import com.servichaya.payment.dto.PaymentPreferenceDto;
import com.servichaya.payment.entity.ProviderPaymentPreference;
import com.servichaya.payment.repository.ProviderPaymentPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentPreferenceService {

    private final ProviderPaymentPreferenceRepository preferenceRepository;

    @Transactional
    public PaymentPreferenceDto createPreference(Long providerId, CreatePaymentPreferenceDto dto) {
        log.info("Creating payment preference for providerId: {}, serviceCategoryId: {}, paymentType: {}", 
                providerId, dto.getServiceCategoryId(), dto.getPaymentType());

        ProviderPaymentPreference preference = ProviderPaymentPreference.builder()
                .providerId(providerId)
                .serviceCategoryId(dto.getServiceCategoryId())
                .paymentType(dto.getPaymentType())
                .partialPaymentPercentage(dto.getPartialPaymentPercentage())
                .minimumUpfrontAmount(dto.getMinimumUpfrontAmount())
                .hourlyRate(dto.getHourlyRate())
                .isActive(true)
                .build();

        preference = preferenceRepository.save(preference);
        log.info("Payment preference created with id: {}", preference.getId());

        return mapToDto(preference);
    }

    public List<PaymentPreferenceDto> getProviderPreferences(Long providerId) {
        log.info("Fetching payment preferences for providerId: {}", providerId);
        return preferenceRepository.findByProviderId(providerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentPreferenceDto updatePreference(Long preferenceId, CreatePaymentPreferenceDto dto) {
        log.info("Updating payment preference id: {}", preferenceId);

        ProviderPaymentPreference preference = preferenceRepository.findById(preferenceId)
                .orElseThrow(() -> {
                    log.error("Payment preference not found with id: {}", preferenceId);
                    return new RuntimeException("Payment preference not found");
                });

        preference.setServiceCategoryId(dto.getServiceCategoryId());
        preference.setPaymentType(dto.getPaymentType());
        preference.setPartialPaymentPercentage(dto.getPartialPaymentPercentage());
        preference.setMinimumUpfrontAmount(dto.getMinimumUpfrontAmount());
        preference.setHourlyRate(dto.getHourlyRate());

        preference = preferenceRepository.save(preference);
        log.info("Payment preference updated successfully");

        return mapToDto(preference);
    }

    @Transactional
    public void deletePreference(Long preferenceId) {
        log.info("Deleting payment preference id: {}", preferenceId);
        ProviderPaymentPreference preference = preferenceRepository.findById(preferenceId)
                .orElseThrow(() -> new RuntimeException("Payment preference not found"));
        preference.setIsActive(false);
        preferenceRepository.save(preference);
        log.info("Payment preference deactivated successfully");
    }

    private PaymentPreferenceDto mapToDto(ProviderPaymentPreference preference) {
        return PaymentPreferenceDto.builder()
                .id(preference.getId())
                .providerId(preference.getProviderId())
                .serviceCategoryId(preference.getServiceCategoryId())
                .paymentType(preference.getPaymentType())
                .partialPaymentPercentage(preference.getPartialPaymentPercentage())
                .minimumUpfrontAmount(preference.getMinimumUpfrontAmount())
                .hourlyRate(preference.getHourlyRate())
                .isActive(preference.getIsActive())
                .build();
    }
}
