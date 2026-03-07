package com.servichaya.admin.service;

import com.servichaya.admin.dto.*;
import com.servichaya.location.entity.CityMaster;
import com.servichaya.location.entity.CountryMaster;
import com.servichaya.location.entity.PodMaster;
import com.servichaya.location.entity.StateMaster;
import com.servichaya.location.entity.ZoneMaster;
import com.servichaya.location.repository.CityMasterRepository;
import com.servichaya.location.repository.CountryMasterRepository;
import com.servichaya.location.repository.PodMasterRepository;
import com.servichaya.location.repository.StateMasterRepository;
import com.servichaya.location.repository.ZoneMasterRepository;
import com.servichaya.matching.entity.MatchingRuleMaster;
import com.servichaya.matching.repository.MatchingRuleMasterRepository;
import com.servichaya.service.entity.ServiceCategoryMaster;
import com.servichaya.service.entity.ServiceSkillMaster;
import com.servichaya.service.entity.ServiceSubCategoryMaster;
import com.servichaya.service.repository.ServiceCategoryMasterRepository;
import com.servichaya.service.repository.ServiceSkillMasterRepository;
import com.servichaya.service.repository.ServiceSubCategoryMasterRepository;
import com.servichaya.user.entity.UserRoleMaster;
import com.servichaya.user.repository.UserRoleMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterDataService {

    private final CityMasterRepository cityRepository;
    private final ZoneMasterRepository zoneRepository;
    private final PodMasterRepository podRepository;
    private final StateMasterRepository stateRepository;
    private final CountryMasterRepository countryRepository;
    private final ServiceCategoryMasterRepository categoryRepository;
    private final ServiceSubCategoryMasterRepository subCategoryRepository;
    private final ServiceSkillMasterRepository skillRepository;
    private final MatchingRuleMasterRepository ruleRepository;
    private final UserRoleMasterRepository roleMasterRepository;

    // ========== City Master ==========
    public Page<CityMasterDto> getAllCities(Pageable pageable) {
        log.info("Fetching all cities, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return cityRepository.findAllWithRelations(pageable).map(this::mapCityToDto);
    }

    public CityMasterDto getCityById(Long id) {
        log.info("Fetching city by id: {}", id);
        CityMaster city = cityRepository.findByIdWithRelations(id)
                .orElseThrow(() -> {
                    log.error("City not found with id: {}", id);
                    return new RuntimeException("City not found");
                });
        return mapCityToDto(city);
    }

    @Transactional
    public CityMasterDto createCity(CityMasterDto dto) {
        log.info("Creating city: {}", dto.getName());
        StateMaster state = stateRepository.findById(dto.getStateId())
                .orElseThrow(() -> new RuntimeException("State not found"));

        CityMaster city = CityMaster.builder()
                .state(state)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .timezone(dto.getTimezone())
                .population(dto.getPopulation())
                .isServiceable(dto.getIsServiceable() != null ? dto.getIsServiceable() : false)
                .build();
        
        // Set inherited fields from MasterEntity
        city.setCode(dto.getCode());
        city.setName(dto.getName());
        city.setDescription(dto.getDescription());
        city.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        city = cityRepository.save(city);
        log.info("City created successfully with id: {}", city.getId());
        // Reload with relations for DTO mapping
        city = cityRepository.findByIdWithRelations(city.getId()).orElse(city);
        return mapCityToDto(city);
    }

    @Transactional
    public CityMasterDto updateCity(Long id, CityMasterDto dto) {
        log.info("Updating city id: {}", id);
        CityMaster city = cityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("City not found"));

        if (dto.getStateId() != null && !dto.getStateId().equals(city.getState().getId())) {
            StateMaster state = stateRepository.findById(dto.getStateId())
                    .orElseThrow(() -> new RuntimeException("State not found"));
            city.setState(state);
        }

        if (dto.getName() != null) city.setName(dto.getName());
        if (dto.getDescription() != null) city.setDescription(dto.getDescription());
        if (dto.getLatitude() != null) city.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) city.setLongitude(dto.getLongitude());
        if (dto.getTimezone() != null) city.setTimezone(dto.getTimezone());
        if (dto.getPopulation() != null) city.setPopulation(dto.getPopulation());
        if (dto.getIsServiceable() != null) city.setIsServiceable(dto.getIsServiceable());
        if (dto.getIsActive() != null) city.setIsActive(dto.getIsActive());

        city = cityRepository.save(city);
        log.info("City updated successfully");
        // Reload with relations for DTO mapping
        city = cityRepository.findByIdWithRelations(id).orElse(city);
        return mapCityToDto(city);
    }

    @Transactional
    public void deleteCity(Long id) {
        log.info("Deleting city id: {}", id);
        CityMaster city = cityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("City not found"));
        city.setIsActive(false);
        cityRepository.save(city);
        log.info("City deactivated successfully");
    }

    public List<CityMasterDto> getAllActiveCities() {
        log.info("Fetching all active cities");
        return cityRepository.findAllActive().stream()
                .map(this::mapCityToDto)
                .collect(Collectors.toList());
    }

    private CityMasterDto mapCityToDto(CityMaster city) {
        return CityMasterDto.builder()
                .id(city.getId())
                .code(city.getCode())
                .name(city.getName())
                .description(city.getDescription())
                .stateId(city.getState().getId())
                .stateName(city.getState().getName())
                .latitude(city.getLatitude())
                .longitude(city.getLongitude())
                .timezone(city.getTimezone())
                .population(city.getPopulation())
                .isServiceable(city.getIsServiceable())
                .isActive(city.getIsActive())
                .createdAt(city.getCreatedAt())
                .updatedAt(city.getUpdatedAt())
                .build();
    }

    // ========== Zone Master ==========
    public Page<ZoneMasterDto> getAllZones(Pageable pageable) {
        log.info("Fetching all zones, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return zoneRepository.findAllWithRelations(pageable).map(this::mapZoneToDto);
    }

    public ZoneMasterDto getZoneById(Long id) {
        log.info("Fetching zone by id: {}", id);
        ZoneMaster zone = zoneRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        return mapZoneToDto(zone);
    }

    @Transactional
    public ZoneMasterDto createZone(ZoneMasterDto dto) {
        log.info("Creating zone: {}", dto.getName());
        CityMaster city = cityRepository.findById(dto.getCityId())
                .orElseThrow(() -> new RuntimeException("City not found"));

        ZoneMaster zone = ZoneMaster.builder()
                .city(city)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .servicePriority(dto.getServicePriority())
                .build();
        
        // Set inherited fields from MasterEntity
        zone.setCode(dto.getCode());
        zone.setName(dto.getName());
        zone.setDescription(dto.getDescription());
        zone.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        zone = zoneRepository.save(zone);
        log.info("Zone created successfully with id: {}", zone.getId());
        // Reload with relations for DTO mapping
        zone = zoneRepository.findByIdWithRelations(zone.getId()).orElse(zone);
        return mapZoneToDto(zone);
    }

    @Transactional
    public ZoneMasterDto updateZone(Long id, ZoneMasterDto dto) {
        log.info("Updating zone id: {}", id);
        ZoneMaster zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));

        if (dto.getCityId() != null && !dto.getCityId().equals(zone.getCity().getId())) {
            CityMaster city = cityRepository.findById(dto.getCityId())
                    .orElseThrow(() -> new RuntimeException("City not found"));
            zone.setCity(city);
        }

        if (dto.getName() != null) zone.setName(dto.getName());
        if (dto.getDescription() != null) zone.setDescription(dto.getDescription());
        if (dto.getLatitude() != null) zone.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) zone.setLongitude(dto.getLongitude());
        if (dto.getServicePriority() != null) zone.setServicePriority(dto.getServicePriority());
        if (dto.getIsActive() != null) zone.setIsActive(dto.getIsActive());

        zone = zoneRepository.save(zone);
        log.info("Zone updated successfully");
        // Reload with relations for DTO mapping
        zone = zoneRepository.findByIdWithRelations(id).orElse(zone);
        return mapZoneToDto(zone);
    }

    @Transactional
    public void deleteZone(Long id) {
        log.info("Deleting zone id: {}", id);
        ZoneMaster zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        zone.setIsActive(false);
        zoneRepository.save(zone);
        log.info("Zone deactivated successfully");
    }

    public List<ZoneMasterDto> getZonesByCity(Long cityId) {
        log.info("Fetching zones for city id: {}", cityId);
        return zoneRepository.findByCityIdAndIsActiveTrue(cityId).stream()
                .map(this::mapZoneToDto)
                .collect(Collectors.toList());
    }

    private ZoneMasterDto mapZoneToDto(ZoneMaster zone) {
        return ZoneMasterDto.builder()
                .id(zone.getId())
                .code(zone.getCode())
                .name(zone.getName())
                .description(zone.getDescription())
                .cityId(zone.getCity().getId())
                .cityName(zone.getCity().getName())
                .latitude(zone.getLatitude())
                .longitude(zone.getLongitude())
                .servicePriority(zone.getServicePriority())
                .isActive(zone.getIsActive())
                .createdAt(zone.getCreatedAt())
                .updatedAt(zone.getUpdatedAt())
                .build();
    }

    // ========== POD Master ==========
    public Page<PodMasterDto> getAllPods(Pageable pageable) {
        log.info("Fetching all PODs, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return podRepository.findAllWithRelations(pageable).map(this::mapPodToDto);
    }

    public PodMasterDto getPodById(Long id) {
        log.info("Fetching POD by id: {}", id);
        PodMaster pod = podRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new RuntimeException("POD not found"));
        return mapPodToDto(pod);
    }

    @Transactional
    public PodMasterDto createPod(PodMasterDto dto) {
        log.info("Creating POD: {}", dto.getName());
        CityMaster city = cityRepository.findById(dto.getCityId())
                .orElseThrow(() -> new RuntimeException("City not found"));
        ZoneMaster zone = zoneRepository.findById(dto.getZoneId())
                .orElseThrow(() -> new RuntimeException("Zone not found"));

        PodMaster pod = PodMaster.builder()
                .city(city)
                .zone(zone)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .serviceRadiusKm(dto.getServiceRadiusKm())
                .maxProviders(dto.getMaxProviders())
                .maxWorkforce(dto.getMaxWorkforce())
                .build();
        
        // Set inherited fields from MasterEntity
        pod.setCode(dto.getCode());
        pod.setName(dto.getName());
        pod.setDescription(dto.getDescription());
        pod.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        pod = podRepository.save(pod);
        log.info("POD created successfully with id: {}", pod.getId());
        // Reload with relations for DTO mapping
        pod = podRepository.findByIdWithRelations(pod.getId()).orElse(pod);
        return mapPodToDto(pod);
    }

    @Transactional
    public PodMasterDto updatePod(Long id, PodMasterDto dto) {
        log.info("Updating POD id: {}", id);
        PodMaster pod = podRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("POD not found"));

        if (dto.getCityId() != null && !dto.getCityId().equals(pod.getCity().getId())) {
            CityMaster city = cityRepository.findById(dto.getCityId())
                    .orElseThrow(() -> new RuntimeException("City not found"));
            pod.setCity(city);
        }

        if (dto.getZoneId() != null && !dto.getZoneId().equals(pod.getZone().getId())) {
            ZoneMaster zone = zoneRepository.findById(dto.getZoneId())
                    .orElseThrow(() -> new RuntimeException("Zone not found"));
            pod.setZone(zone);
        }

        if (dto.getName() != null) pod.setName(dto.getName());
        if (dto.getDescription() != null) pod.setDescription(dto.getDescription());
        if (dto.getLatitude() != null) pod.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) pod.setLongitude(dto.getLongitude());
        if (dto.getServiceRadiusKm() != null) pod.setServiceRadiusKm(dto.getServiceRadiusKm());
        if (dto.getMaxProviders() != null) pod.setMaxProviders(dto.getMaxProviders());
        if (dto.getMaxWorkforce() != null) pod.setMaxWorkforce(dto.getMaxWorkforce());
        if (dto.getIsActive() != null) pod.setIsActive(dto.getIsActive());

        pod = podRepository.save(pod);
        log.info("POD updated successfully");
        // Reload with relations for DTO mapping
        pod = podRepository.findByIdWithRelations(id).orElse(pod);
        return mapPodToDto(pod);
    }

    @Transactional
    public void deletePod(Long id) {
        log.info("Deleting POD id: {}", id);
        PodMaster pod = podRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("POD not found"));
        pod.setIsActive(false);
        podRepository.save(pod);
        log.info("POD deactivated successfully");
    }

    public List<PodMasterDto> getPodsByCity(Long cityId) {
        log.info("Fetching PODs for city id: {}", cityId);
        return podRepository.findByCityIdAndIsActiveTrue(cityId).stream()
                .map(this::mapPodToDto)
                .collect(Collectors.toList());
    }

    public List<PodMasterDto> getPodsByZone(Long zoneId) {
        log.info("Fetching PODs for zone id: {}", zoneId);
        return podRepository.findByZoneIdAndIsActiveTrue(zoneId).stream()
                .map(this::mapPodToDto)
                .collect(Collectors.toList());
    }

    private PodMasterDto mapPodToDto(PodMaster pod) {
        return PodMasterDto.builder()
                .id(pod.getId())
                .code(pod.getCode())
                .name(pod.getName())
                .description(pod.getDescription())
                .cityId(pod.getCity().getId())
                .cityName(pod.getCity().getName())
                .zoneId(pod.getZone().getId())
                .zoneName(pod.getZone().getName())
                .latitude(pod.getLatitude())
                .longitude(pod.getLongitude())
                .serviceRadiusKm(pod.getServiceRadiusKm())
                .maxProviders(pod.getMaxProviders())
                .maxWorkforce(pod.getMaxWorkforce())
                .isActive(pod.getIsActive())
                .createdAt(pod.getCreatedAt())
                .updatedAt(pod.getUpdatedAt())
                .build();
    }

    // ========== Service Category Master ==========
    public Page<ServiceCategoryMasterDto> getAllServiceCategories(Pageable pageable) {
        log.info("Fetching all service categories, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return categoryRepository.findAll(pageable).map(this::mapCategoryToDto);
    }

    public ServiceCategoryMasterDto getServiceCategoryById(Long id) {
        log.info("Fetching service category by id: {}", id);
        ServiceCategoryMaster category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service category not found"));
        return mapCategoryToDto(category);
    }

    @Transactional
    public ServiceCategoryMasterDto createServiceCategory(ServiceCategoryMasterDto dto) {
        log.info("Creating service category: {}", dto.getName());
        ServiceCategoryMaster category = ServiceCategoryMaster.builder()
                .iconUrl(dto.getIconUrl())
                .displayOrder(dto.getDisplayOrder())
                .isFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false)
                .build();
        
        // Set inherited fields from MasterEntity
        category.setCode(dto.getCode());
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        category = categoryRepository.save(category);
        log.info("Service category created successfully with id: {}", category.getId());
        return mapCategoryToDto(category);
    }

    @Transactional
    public ServiceCategoryMasterDto updateServiceCategory(Long id, ServiceCategoryMasterDto dto) {
        log.info("Updating service category id: {}", id);
        ServiceCategoryMaster category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service category not found"));

        if (dto.getName() != null) category.setName(dto.getName());
        if (dto.getDescription() != null) category.setDescription(dto.getDescription());
        if (dto.getIconUrl() != null) category.setIconUrl(dto.getIconUrl());
        if (dto.getDisplayOrder() != null) category.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getIsFeatured() != null) category.setIsFeatured(dto.getIsFeatured());
        if (dto.getIsActive() != null) category.setIsActive(dto.getIsActive());

        category = categoryRepository.save(category);
        log.info("Service category updated successfully");
        return mapCategoryToDto(category);
    }

    @Transactional
    public void deleteServiceCategory(Long id) {
        log.info("Deleting service category id: {}", id);
        ServiceCategoryMaster category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service category not found"));
        category.setIsActive(false);
        categoryRepository.save(category);
        log.info("Service category deactivated successfully");
    }

    private ServiceCategoryMasterDto mapCategoryToDto(ServiceCategoryMaster category) {
        return ServiceCategoryMasterDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .displayOrder(category.getDisplayOrder())
                .isFeatured(category.getIsFeatured())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    // ========== Service SubCategory Master ==========
    public Page<ServiceSubCategoryMasterDto> getAllServiceSubCategories(Pageable pageable) {
        log.info("Fetching all service subcategories, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return subCategoryRepository.findAll(pageable).map(this::mapSubCategoryToDto);
    }

    public ServiceSubCategoryMasterDto getServiceSubCategoryById(Long id) {
        log.info("Fetching service subcategory by id: {}", id);
        ServiceSubCategoryMaster subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service subcategory not found"));
        return mapSubCategoryToDto(subCategory);
    }

    @Transactional
    public ServiceSubCategoryMasterDto createServiceSubCategory(ServiceSubCategoryMasterDto dto) {
        log.info("Creating service subcategory: {}", dto.getName());
        
        // Validate category exists
        ServiceCategoryMaster category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Service category not found"));
        
        ServiceSubCategoryMaster subCategory = ServiceSubCategoryMaster.builder()
                .categoryId(dto.getCategoryId())
                .iconUrl(dto.getIconUrl())
                .displayOrder(dto.getDisplayOrder())
                .isFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false)
                .build();
        
        // Set inherited fields from MasterEntity
        subCategory.setCode(dto.getCode());
        subCategory.setName(dto.getName());
        subCategory.setDescription(dto.getDescription());
        subCategory.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        subCategory = subCategoryRepository.save(subCategory);
        log.info("Service subcategory created successfully with id: {}", subCategory.getId());
        return mapSubCategoryToDto(subCategory);
    }

    @Transactional
    public ServiceSubCategoryMasterDto updateServiceSubCategory(Long id, ServiceSubCategoryMasterDto dto) {
        log.info("Updating service subcategory id: {}", id);
        ServiceSubCategoryMaster subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service subcategory not found"));

        if (dto.getCategoryId() != null && !dto.getCategoryId().equals(subCategory.getCategoryId())) {
            // Validate new category exists
            categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Service category not found"));
            subCategory.setCategoryId(dto.getCategoryId());
        }
        if (dto.getName() != null) subCategory.setName(dto.getName());
        if (dto.getDescription() != null) subCategory.setDescription(dto.getDescription());
        if (dto.getIconUrl() != null) subCategory.setIconUrl(dto.getIconUrl());
        if (dto.getDisplayOrder() != null) subCategory.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getIsFeatured() != null) subCategory.setIsFeatured(dto.getIsFeatured());
        if (dto.getIsActive() != null) subCategory.setIsActive(dto.getIsActive());

        subCategory = subCategoryRepository.save(subCategory);
        log.info("Service subcategory updated successfully");
        return mapSubCategoryToDto(subCategory);
    }

    @Transactional
    public void deleteServiceSubCategory(Long id) {
        log.info("Deleting service subcategory id: {}", id);
        ServiceSubCategoryMaster subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service subcategory not found"));
        subCategory.setIsActive(false);
        subCategoryRepository.save(subCategory);
        log.info("Service subcategory deactivated successfully");
    }

    private ServiceSubCategoryMasterDto mapSubCategoryToDto(ServiceSubCategoryMaster subCategory) {
        AtomicReference<String> categoryName = new AtomicReference<>();
        if (subCategory.getCategory() != null) {
            categoryName.set(subCategory.getCategory().getName());
        } else if (subCategory.getCategoryId() != null) {
            categoryRepository.findById(subCategory.getCategoryId())
                    .ifPresent(cat -> categoryName.set(cat.getName()));
        }
        
        return ServiceSubCategoryMasterDto.builder()
                .id(subCategory.getId())
                .code(subCategory.getCode())
                .name(subCategory.getName())
                .description(subCategory.getDescription())
                .categoryId(subCategory.getCategoryId())
                .categoryName(categoryName.get())
                .iconUrl(subCategory.getIconUrl())
                .displayOrder(subCategory.getDisplayOrder())
                .isFeatured(subCategory.getIsFeatured())
                .isActive(subCategory.getIsActive())
                .createdAt(subCategory.getCreatedAt())
                .updatedAt(subCategory.getUpdatedAt())
                .build();
    }

    // ========== Matching Rule Master ==========
    public Page<MatchingRuleMasterDto> getAllMatchingRules(Pageable pageable) {
        log.info("Fetching all matching rules, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return ruleRepository.findAll(pageable).map(this::mapRuleToDto);
    }

    public MatchingRuleMasterDto getMatchingRuleById(Long id) {
        log.info("Fetching matching rule by id: {}", id);
        MatchingRuleMaster rule = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matching rule not found"));
        return mapRuleToDto(rule);
    }

    @Transactional
    public MatchingRuleMasterDto createMatchingRule(MatchingRuleMasterDto dto) {
        log.info("Creating matching rule: {}", dto.getRuleName());
        MatchingRuleMaster rule = MatchingRuleMaster.builder()
                .ruleCode(dto.getRuleCode())
                .ruleName(dto.getRuleName())
                .ruleType(dto.getRuleType())
                .weightPercentage(dto.getWeightPercentage())
                .calculationLogic(dto.getCalculationLogic())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .priorityOrder(dto.getPriorityOrder() != null ? dto.getPriorityOrder() : 0)
                .build();

        rule = ruleRepository.save(rule);
        log.info("Matching rule created successfully with id: {}", rule.getId());
        return mapRuleToDto(rule);
    }

    @Transactional
    public MatchingRuleMasterDto updateMatchingRule(Long id, MatchingRuleMasterDto dto) {
        log.info("Updating matching rule id: {}", id);
        MatchingRuleMaster rule = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matching rule not found"));

        if (dto.getRuleName() != null) rule.setRuleName(dto.getRuleName());
        if (dto.getRuleType() != null) rule.setRuleType(dto.getRuleType());
        if (dto.getWeightPercentage() != null) rule.setWeightPercentage(dto.getWeightPercentage());
        if (dto.getCalculationLogic() != null) rule.setCalculationLogic(dto.getCalculationLogic());
        if (dto.getIsActive() != null) rule.setIsActive(dto.getIsActive());
        if (dto.getPriorityOrder() != null) rule.setPriorityOrder(dto.getPriorityOrder());

        rule = ruleRepository.save(rule);
        log.info("Matching rule updated successfully");
        return mapRuleToDto(rule);
    }

    @Transactional
    public void deleteMatchingRule(Long id) {
        log.info("Deleting matching rule id: {}", id);
        MatchingRuleMaster rule = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matching rule not found"));
        rule.setIsActive(false);
        ruleRepository.save(rule);
        log.info("Matching rule deactivated successfully");
    }

    private MatchingRuleMasterDto mapRuleToDto(MatchingRuleMaster rule) {
        return MatchingRuleMasterDto.builder()
                .id(rule.getId())
                .ruleCode(rule.getRuleCode())
                .ruleName(rule.getRuleName())
                .ruleType(rule.getRuleType())
                .weightPercentage(rule.getWeightPercentage())
                .calculationLogic(rule.getCalculationLogic())
                .isActive(rule.getIsActive())
                .priorityOrder(rule.getPriorityOrder())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }

    // ========== Service Skill Master ==========
    public Page<ServiceSkillMasterDto> getAllServiceSkills(Pageable pageable) {
        log.info("Fetching all service skills, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return skillRepository.findAll(pageable).map(this::mapSkillToDto);
    }

    public ServiceSkillMasterDto getServiceSkillById(Long id) {
        log.info("Fetching service skill by id: {}", id);
        ServiceSkillMaster skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service skill not found"));
        return mapSkillToDto(skill);
    }

    @Transactional
    public ServiceSkillMasterDto createServiceSkill(ServiceSkillMasterDto dto) {
        log.info("Creating service skill: {}", dto.getName());
        ServiceSkillMaster skill = new ServiceSkillMaster();
        skill.setCode(dto.getCode());
        skill.setName(dto.getName());
        skill.setDescription(dto.getDescription());
        skill.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        skill = skillRepository.save(skill);
        log.info("Service skill created successfully with id: {}", skill.getId());
        return mapSkillToDto(skill);
    }

    @Transactional
    public ServiceSkillMasterDto updateServiceSkill(Long id, ServiceSkillMasterDto dto) {
        log.info("Updating service skill id: {}", id);
        ServiceSkillMaster skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service skill not found"));

        if (dto.getName() != null) skill.setName(dto.getName());
        if (dto.getDescription() != null) skill.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) skill.setIsActive(dto.getIsActive());

        skill = skillRepository.save(skill);
        log.info("Service skill updated successfully");
        return mapSkillToDto(skill);
    }

    @Transactional
    public void deleteServiceSkill(Long id) {
        log.info("Deleting service skill id: {}", id);
        ServiceSkillMaster skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service skill not found"));
        skill.setIsActive(false);
        skillRepository.save(skill);
        log.info("Service skill deactivated successfully");
    }

    private ServiceSkillMasterDto mapSkillToDto(ServiceSkillMaster skill) {
        return ServiceSkillMasterDto.builder()
                .id(skill.getId())
                .code(skill.getCode())
                .name(skill.getName())
                .description(skill.getDescription())
                .isActive(skill.getIsActive())
                .createdAt(skill.getCreatedAt())
                .updatedAt(skill.getUpdatedAt())
                .build();
    }

    // ========== Country Master ==========
    public Page<CountryMasterDto> getAllCountries(Pageable pageable) {
        log.info("Fetching all countries, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return countryRepository.findAll(pageable).map(this::mapCountryToDto);
    }

    public CountryMasterDto getCountryById(Long id) {
        log.info("Fetching country by id: {}", id);
        CountryMaster country = countryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Country not found"));
        return mapCountryToDto(country);
    }

    @Transactional
    public CountryMasterDto createCountry(CountryMasterDto dto) {
        log.info("Creating country: {}", dto.getName());
        CountryMaster country = CountryMaster.builder()
                .countryCode(dto.getCountryCode())
                .currencyCode(dto.getCurrencyCode())
                .phoneCode(dto.getPhoneCode())
                .build();
        country.setCode(dto.getCode());
        country.setName(dto.getName());
        country.setDescription(dto.getDescription());
        country.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        country = countryRepository.save(country);
        log.info("Country created successfully with id: {}", country.getId());
        return mapCountryToDto(country);
    }

    @Transactional
    public CountryMasterDto updateCountry(Long id, CountryMasterDto dto) {
        log.info("Updating country id: {}", id);
        CountryMaster country = countryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Country not found"));

        if (dto.getName() != null) country.setName(dto.getName());
        if (dto.getDescription() != null) country.setDescription(dto.getDescription());
        if (dto.getCountryCode() != null) country.setCountryCode(dto.getCountryCode());
        if (dto.getCurrencyCode() != null) country.setCurrencyCode(dto.getCurrencyCode());
        if (dto.getPhoneCode() != null) country.setPhoneCode(dto.getPhoneCode());
        if (dto.getIsActive() != null) country.setIsActive(dto.getIsActive());

        country = countryRepository.save(country);
        log.info("Country updated successfully");
        return mapCountryToDto(country);
    }

    @Transactional
    public void deleteCountry(Long id) {
        log.info("Deleting country id: {}", id);
        CountryMaster country = countryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Country not found"));
        country.setIsActive(false);
        countryRepository.save(country);
        log.info("Country deactivated successfully");
    }

    public List<CountryMasterDto> getAllActiveCountries() {
        log.info("Fetching all active countries");
        return countryRepository.findAllActive().stream()
                .map(this::mapCountryToDto)
                .collect(Collectors.toList());
    }

    private CountryMasterDto mapCountryToDto(CountryMaster country) {
        return CountryMasterDto.builder()
                .id(country.getId())
                .code(country.getCode())
                .name(country.getName())
                .description(country.getDescription())
                .countryCode(country.getCountryCode())
                .currencyCode(country.getCurrencyCode())
                .phoneCode(country.getPhoneCode())
                .isActive(country.getIsActive())
                .createdAt(country.getCreatedAt())
                .updatedAt(country.getUpdatedAt())
                .build();
    }

    // ========== State Master ==========
    public Page<StateMasterDto> getAllStates(Pageable pageable) {
        log.info("Fetching all states, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return stateRepository.findAllWithRelations(pageable).map(this::mapStateToDto);
    }

    public StateMasterDto getStateById(Long id) {
        log.info("Fetching state by id: {}", id);
        StateMaster state = stateRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new RuntimeException("State not found"));
        return mapStateToDto(state);
    }

    @Transactional
    public StateMasterDto createState(StateMasterDto dto) {
        log.info("Creating state: {}", dto.getName());
        CountryMaster country = countryRepository.findById(dto.getCountryId())
                .orElseThrow(() -> new RuntimeException("Country not found"));

        StateMaster state = StateMaster.builder()
                .country(country)
                .build();
        state.setCode(dto.getCode());
        state.setName(dto.getName());
        state.setDescription(dto.getDescription());
        state.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        state = stateRepository.save(state);
        log.info("State created successfully with id: {}", state.getId());
        // Reload with relations for DTO mapping
        state = stateRepository.findByIdWithRelations(state.getId()).orElse(state);
        return mapStateToDto(state);
    }

    @Transactional
    public StateMasterDto updateState(Long id, StateMasterDto dto) {
        log.info("Updating state id: {}", id);
        StateMaster state = stateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("State not found"));

        if (dto.getCountryId() != null && !dto.getCountryId().equals(state.getCountry().getId())) {
            CountryMaster country = countryRepository.findById(dto.getCountryId())
                    .orElseThrow(() -> new RuntimeException("Country not found"));
            state.setCountry(country);
        }

        if (dto.getName() != null) state.setName(dto.getName());
        if (dto.getDescription() != null) state.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) state.setIsActive(dto.getIsActive());

        state = stateRepository.save(state);
        log.info("State updated successfully");
        // Reload with relations for DTO mapping
        state = stateRepository.findByIdWithRelations(id).orElse(state);
        return mapStateToDto(state);
    }

    @Transactional
    public void deleteState(Long id) {
        log.info("Deleting state id: {}", id);
        StateMaster state = stateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("State not found"));
        state.setIsActive(false);
        stateRepository.save(state);
        log.info("State deactivated successfully");
    }

    public List<StateMasterDto> getStatesByCountry(Long countryId) {
        log.info("Fetching states for country id: {}", countryId);
        return stateRepository.findAllActive().stream()
                .filter(s -> s.getCountry().getId().equals(countryId))
                .map(this::mapStateToDto)
                .collect(Collectors.toList());
    }

    private StateMasterDto mapStateToDto(StateMaster state) {
        return StateMasterDto.builder()
                .id(state.getId())
                .code(state.getCode())
                .name(state.getName())
                .description(state.getDescription())
                .countryId(state.getCountry().getId())
                .countryName(state.getCountry().getName())
                .isActive(state.getIsActive())
                .createdAt(state.getCreatedAt())
                .updatedAt(state.getUpdatedAt())
                .build();
    }

    // ========== User Role Master ==========
    public Page<UserRoleMasterDto> getAllUserRoles(Pageable pageable) {
        log.info("Fetching all user roles, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return roleMasterRepository.findAll(pageable).map(this::mapUserRoleToDto);
    }

    public UserRoleMasterDto getUserRoleById(Long id) {
        log.info("Fetching user role by id: {}", id);
        UserRoleMaster role = roleMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User role not found"));
        return mapUserRoleToDto(role);
    }

    @Transactional
    public UserRoleMasterDto createUserRole(UserRoleMasterDto dto) {
        log.info("Creating user role: {}", dto.getName());
        UserRoleMaster role = UserRoleMaster.builder()
                .roleCode(dto.getRoleCode())
                .isSystemRole(dto.getIsSystemRole() != null ? dto.getIsSystemRole() : false)
                .build();
        role.setCode(dto.getCode());
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
        role.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        role = roleMasterRepository.save(role);
        log.info("User role created successfully with id: {}", role.getId());
        return mapUserRoleToDto(role);
    }

    @Transactional
    public UserRoleMasterDto updateUserRole(Long id, UserRoleMasterDto dto) {
        log.info("Updating user role id: {}", id);
        UserRoleMaster role = roleMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User role not found"));

        if (dto.getName() != null) role.setName(dto.getName());
        if (dto.getDescription() != null) role.setDescription(dto.getDescription());
        if (dto.getRoleCode() != null) role.setRoleCode(dto.getRoleCode());
        if (dto.getIsSystemRole() != null) role.setIsSystemRole(dto.getIsSystemRole());
        if (dto.getIsActive() != null) role.setIsActive(dto.getIsActive());

        role = roleMasterRepository.save(role);
        log.info("User role updated successfully");
        return mapUserRoleToDto(role);
    }

    @Transactional
    public void deleteUserRole(Long id) {
        log.info("Deleting user role id: {}", id);
        UserRoleMaster role = roleMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User role not found"));
        // Don't allow deletion of system roles
        if (role.getIsSystemRole() != null && role.getIsSystemRole()) {
            throw new RuntimeException("Cannot delete system role");
        }
        role.setIsActive(false);
        roleMasterRepository.save(role);
        log.info("User role deactivated successfully");
    }

    private UserRoleMasterDto mapUserRoleToDto(UserRoleMaster role) {
        return UserRoleMasterDto.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .roleCode(role.getRoleCode())
                .isSystemRole(role.getIsSystemRole())
                .isActive(role.getIsActive())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }

    // ========== Helper Methods ==========
    public List<StateMaster> getAllStates() {
        log.info("Fetching all states");
        return stateRepository.findAllActive();
    }
}
