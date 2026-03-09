package com.servichaya.payment.service;

import com.servichaya.payment.dto.*;
import com.servichaya.payment.entity.PlatformEarningConfig;
import com.servichaya.payment.entity.ProviderEarningConfig;
import com.servichaya.payment.repository.PlatformEarningConfigRepository;
import com.servichaya.payment.repository.ProviderEarningConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class EarningConfigService {

    private final PlatformEarningConfigRepository platformConfigRepository;
    private final ProviderEarningConfigRepository providerConfigRepository;

    // Platform Config Methods
    public Page<PlatformEarningConfigDto> getPlatformConfigs(Pageable pageable) {
        return platformConfigRepository.findAll(pageable)
                .map(this::mapToPlatformDto);
    }

    @Transactional
    public PlatformEarningConfigDto createPlatformConfig(CreatePlatformEarningConfigDto dto) {
        log.info("Creating platform earning config: {}", dto);
        
        PlatformEarningConfig config = PlatformEarningConfig.builder()
                .earningModel(dto.getEarningModel())
                .serviceCategoryId(dto.getServiceCategoryId())
                .cityId(dto.getCityId())
                .commissionPercentage(dto.getCommissionPercentage())
                .fixedCommissionAmount(dto.getFixedCommissionAmount())
                .minimumCommission(dto.getMinimumCommission())
                .maximumCommission(dto.getMaximumCommission())
                .leadPrice(dto.getLeadPrice())
                .leadPricePercentage(dto.getLeadPricePercentage())
                .minimumLeadPrice(dto.getMinimumLeadPrice())
                .maximumLeadPrice(dto.getMaximumLeadPrice())
                .hybridCommissionWeight(dto.getHybridCommissionWeight())
                .hybridLeadWeight(dto.getHybridLeadWeight())
                .effectiveFrom(dto.getEffectiveFrom() != null ? dto.getEffectiveFrom() : LocalDate.now())
                .effectiveUntil(dto.getEffectiveUntil())
                .description(dto.getDescription())
                .isActive(true)
                .build();
        
        config = platformConfigRepository.save(config);
        return mapToPlatformDto(config);
    }

    @Transactional
    public PlatformEarningConfigDto updatePlatformConfig(Long id, CreatePlatformEarningConfigDto dto) {
        log.info("Updating platform earning config id: {}", id);
        
        PlatformEarningConfig config = platformConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Platform config not found"));
        
        config.setEarningModel(dto.getEarningModel());
        config.setServiceCategoryId(dto.getServiceCategoryId());
        config.setCityId(dto.getCityId());
        config.setCommissionPercentage(dto.getCommissionPercentage());
        config.setFixedCommissionAmount(dto.getFixedCommissionAmount());
        config.setMinimumCommission(dto.getMinimumCommission());
        config.setMaximumCommission(dto.getMaximumCommission());
        config.setLeadPrice(dto.getLeadPrice());
        config.setLeadPricePercentage(dto.getLeadPricePercentage());
        config.setMinimumLeadPrice(dto.getMinimumLeadPrice());
        config.setMaximumLeadPrice(dto.getMaximumLeadPrice());
        config.setHybridCommissionWeight(dto.getHybridCommissionWeight());
        config.setHybridLeadWeight(dto.getHybridLeadWeight());
        config.setEffectiveFrom(dto.getEffectiveFrom());
        config.setEffectiveUntil(dto.getEffectiveUntil());
        config.setDescription(dto.getDescription());
        
        config = platformConfigRepository.save(config);
        return mapToPlatformDto(config);
    }

    // Provider Config Methods
    public Page<ProviderEarningConfigDto> getProviderConfigs(Long providerId, Pageable pageable) {
        return providerConfigRepository.findByProviderIdOptional(providerId, pageable)
                .map(this::mapToProviderDto);
    }

    @Transactional
    public ProviderEarningConfigDto createProviderConfig(CreateProviderEarningConfigDto dto) {
        log.info("Creating provider earning config for providerId: {}", dto.getProviderId());
        
        ProviderEarningConfig config = ProviderEarningConfig.builder()
                .providerId(dto.getProviderId())
                .serviceCategoryId(dto.getServiceCategoryId())
                .earningModel(dto.getEarningModel())
                .commissionPercentage(dto.getCommissionPercentage())
                .fixedCommissionAmount(dto.getFixedCommissionAmount())
                .minimumCommission(dto.getMinimumCommission())
                .maximumCommission(dto.getMaximumCommission())
                .leadPrice(dto.getLeadPrice())
                .leadPricePercentage(dto.getLeadPricePercentage())
                .minimumLeadPrice(dto.getMinimumLeadPrice())
                .maximumLeadPrice(dto.getMaximumLeadPrice())
                .hybridCommissionWeight(dto.getHybridCommissionWeight())
                .hybridLeadWeight(dto.getHybridLeadWeight())
                .effectiveFrom(dto.getEffectiveFrom() != null ? dto.getEffectiveFrom() : LocalDate.now())
                .effectiveUntil(dto.getEffectiveUntil())
                .reason(dto.getReason())
                .isActive(true)
                .build();
        
        config = providerConfigRepository.save(config);
        return mapToProviderDto(config);
    }

    @Transactional
    public ProviderEarningConfigDto updateProviderConfig(Long id, CreateProviderEarningConfigDto dto) {
        log.info("Updating provider earning config id: {}", id);
        
        ProviderEarningConfig config = providerConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider config not found"));
        
        config.setServiceCategoryId(dto.getServiceCategoryId());
        config.setEarningModel(dto.getEarningModel());
        config.setCommissionPercentage(dto.getCommissionPercentage());
        config.setFixedCommissionAmount(dto.getFixedCommissionAmount());
        config.setMinimumCommission(dto.getMinimumCommission());
        config.setMaximumCommission(dto.getMaximumCommission());
        config.setLeadPrice(dto.getLeadPrice());
        config.setLeadPricePercentage(dto.getLeadPricePercentage());
        config.setMinimumLeadPrice(dto.getMinimumLeadPrice());
        config.setMaximumLeadPrice(dto.getMaximumLeadPrice());
        config.setHybridCommissionWeight(dto.getHybridCommissionWeight());
        config.setHybridLeadWeight(dto.getHybridLeadWeight());
        config.setEffectiveFrom(dto.getEffectiveFrom());
        config.setEffectiveUntil(dto.getEffectiveUntil());
        config.setReason(dto.getReason());
        
        config = providerConfigRepository.save(config);
        return mapToProviderDto(config);
    }

    @Transactional
    public void deleteProviderConfig(Long id) {
        log.info("Deleting provider earning config id: {}", id);
        ProviderEarningConfig config = providerConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider config not found"));
        config.setIsActive(false);
        providerConfigRepository.save(config);
    }

    // Mapper methods
    private PlatformEarningConfigDto mapToPlatformDto(PlatformEarningConfig config) {
        return PlatformEarningConfigDto.builder()
                .id(config.getId())
                .earningModel(config.getEarningModel())
                .serviceCategoryId(config.getServiceCategoryId())
                .cityId(config.getCityId())
                .commissionPercentage(config.getCommissionPercentage())
                .fixedCommissionAmount(config.getFixedCommissionAmount())
                .minimumCommission(config.getMinimumCommission())
                .maximumCommission(config.getMaximumCommission())
                .leadPrice(config.getLeadPrice())
                .leadPricePercentage(config.getLeadPricePercentage())
                .minimumLeadPrice(config.getMinimumLeadPrice())
                .maximumLeadPrice(config.getMaximumLeadPrice())
                .hybridCommissionWeight(config.getHybridCommissionWeight())
                .hybridLeadWeight(config.getHybridLeadWeight())
                .effectiveFrom(config.getEffectiveFrom())
                .effectiveUntil(config.getEffectiveUntil())
                .isActive(config.getIsActive())
                .description(config.getDescription())
                .build();
    }

    private ProviderEarningConfigDto mapToProviderDto(ProviderEarningConfig config) {
        return ProviderEarningConfigDto.builder()
                .id(config.getId())
                .providerId(config.getProviderId())
                .serviceCategoryId(config.getServiceCategoryId())
                .earningModel(config.getEarningModel())
                .commissionPercentage(config.getCommissionPercentage())
                .fixedCommissionAmount(config.getFixedCommissionAmount())
                .minimumCommission(config.getMinimumCommission())
                .maximumCommission(config.getMaximumCommission())
                .leadPrice(config.getLeadPrice())
                .leadPricePercentage(config.getLeadPricePercentage())
                .minimumLeadPrice(config.getMinimumLeadPrice())
                .maximumLeadPrice(config.getMaximumLeadPrice())
                .hybridCommissionWeight(config.getHybridCommissionWeight())
                .hybridLeadWeight(config.getHybridLeadWeight())
                .effectiveFrom(config.getEffectiveFrom())
                .effectiveUntil(config.getEffectiveUntil())
                .isActive(config.getIsActive())
                .reason(config.getReason())
                .createdByAdmin(config.getCreatedByAdmin())
                .build();
    }
}
