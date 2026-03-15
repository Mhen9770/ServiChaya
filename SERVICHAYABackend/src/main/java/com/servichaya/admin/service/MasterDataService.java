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
import com.servichaya.service.entity.ServiceCategorySkillMap;
import com.servichaya.service.repository.ServiceCategoryMasterRepository;
import com.servichaya.service.repository.ServiceSkillMasterRepository;
import com.servichaya.service.repository.ServiceCategorySkillMapRepository;
import com.servichaya.user.entity.UserRoleMaster;
import com.servichaya.user.repository.UserRoleMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
    private final ServiceSkillMasterRepository skillRepository;
    private final ServiceCategorySkillMapRepository categorySkillMapRepository;
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
        // Backwards-compatible wrapper for callers that don't filter by parent
        return getAllServiceCategories(pageable, null);
    }

    public Page<ServiceCategoryMasterDto> getAllServiceCategories(Pageable pageable, Long parentId) {
        log.info("Fetching service categories, page: {}, size: {}, parentId: {}",
                pageable.getPageNumber(), pageable.getPageSize(), parentId);
        if (parentId != null) {
            return categoryRepository.findByParentId(parentId, pageable).map(this::mapCategoryToDto);
        }
        return categoryRepository.findAll(pageable).map(this::mapCategoryToDto);
    }

    public ServiceCategoryMasterDto getServiceCategoryById(Long id) {
        log.info("Fetching service category by id: {}", id);
        ServiceCategoryMaster category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service category not found"));
        return mapCategoryToDto(category);
    }

    @Transactional
    @CacheEvict(value = {"categories", "subcategories"}, allEntries = true)
    public ServiceCategoryMasterDto createServiceCategory(ServiceCategoryMasterDto dto) {
        log.info("Creating service category: {}", dto.getName());
        
        // Validate parent if provided
        ServiceCategoryMaster parent = null;
        Integer level = 0;
        String path = dto.getName();
        
        if (dto.getParentId() != null) {
            parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            level = parent.getLevel() != null ? parent.getLevel() + 1 : 1;
            path = (parent.getPath() != null ? parent.getPath() : parent.getName()) + "/" + dto.getName();
        }
        
        ServiceCategoryMaster category = ServiceCategoryMaster.builder()
                .parentId(dto.getParentId())
                .categoryType(dto.getCategoryType())
                .iconUrl(dto.getIconUrl())
                .displayOrder(dto.getDisplayOrder())
                .isFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false)
                .level(level)
                .path(path)
                .build();
        
        // Set inherited fields from MasterEntity
        category.setCode(dto.getCode());
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        category = categoryRepository.save(category);
        log.info("Service category created successfully with id: {}, level: {}", category.getId(), level);
        return mapCategoryToDto(category);
    }

    @Transactional
    @CacheEvict(value = {"categories", "subcategories"}, allEntries = true)
    public ServiceCategoryMasterDto updateServiceCategory(Long id, ServiceCategoryMasterDto dto) {
        log.info("Updating service category id: {}", id);
        ServiceCategoryMaster category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service category not found"));

        // Handle parent change
        if (dto.getParentId() != null && !dto.getParentId().equals(category.getParentId())) {
            // Prevent circular reference
            if (dto.getParentId().equals(id)) {
                throw new RuntimeException("Category cannot be its own parent");
            }
            
            // Check if new parent is not a descendant
            if (isDescendant(dto.getParentId(), id)) {
                throw new RuntimeException("Cannot set parent: would create circular reference");
            }
            
            ServiceCategoryMaster newParent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            
            category.setParentId(dto.getParentId());
            Integer newLevel = newParent.getLevel() != null ? newParent.getLevel() + 1 : 1;
            category.setLevel(newLevel);
            String newPath = (newParent.getPath() != null ? newParent.getPath() : newParent.getName()) + "/" + category.getName();
            category.setPath(newPath);
            
            // Update all descendants' levels and paths
            updateDescendantsPath(category);
        }

        if (dto.getName() != null) {
            category.setName(dto.getName());
            // Update path if name changed
            if (category.getParentId() != null) {
                ServiceCategoryMaster parent = categoryRepository.findById(category.getParentId()).orElse(null);
                if (parent != null) {
                    category.setPath((parent.getPath() != null ? parent.getPath() : parent.getName()) + "/" + dto.getName());
                    updateDescendantsPath(category);
                }
            } else {
                category.setPath(dto.getName());
            }
        }
        if (dto.getDescription() != null) category.setDescription(dto.getDescription());
        if (dto.getIconUrl() != null) category.setIconUrl(dto.getIconUrl());
        if (dto.getDisplayOrder() != null) category.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getIsFeatured() != null) category.setIsFeatured(dto.getIsFeatured());
        if (dto.getIsActive() != null) category.setIsActive(dto.getIsActive());
        if (dto.getCategoryType() != null) category.setCategoryType(dto.getCategoryType());

        category = categoryRepository.save(category);
        log.info("Service category updated successfully");
        return mapCategoryToDto(category);
    }

    private boolean isDescendant(Long potentialAncestorId, Long categoryId) {
        ServiceCategoryMaster category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null || category.getParentId() == null) {
            return false;
        }
        if (category.getParentId().equals(potentialAncestorId)) {
            return true;
        }
        return isDescendant(potentialAncestorId, category.getParentId());
    }

    private void updateDescendantsPath(ServiceCategoryMaster parent) {
        List<ServiceCategoryMaster> children = categoryRepository.findByParentId(parent.getId());
        for (ServiceCategoryMaster child : children) {
            Integer newLevel = parent.getLevel() != null ? parent.getLevel() + 1 : 1;
            child.setLevel(newLevel);
            child.setPath((parent.getPath() != null ? parent.getPath() : parent.getName()) + "/" + child.getName());
            categoryRepository.save(child);
            updateDescendantsPath(child); // Recursive
        }
    }

    @Transactional
    @CacheEvict(value = {"categories", "subcategories"}, allEntries = true)
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
                .parentId(category.getParentId())
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .categoryType(category.getCategoryType())
                .level(category.getLevel() != null ? category.getLevel() : 0)
                .path(category.getPath())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
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
    @Cacheable(value = "skills", key = "'all:' + (#serviceCategoryId != null ? #serviceCategoryId : 'all') + ':' + #pageable.pageNumber + ':' + #pageable.pageSize")
    public Page<ServiceSkillMasterDto> getAllServiceSkills(Pageable pageable, Long serviceCategoryId) {
        log.info("Fetching all service skills, page: {}, size: {}, serviceCategoryId: {}",
                pageable.getPageNumber(), pageable.getPageSize(), serviceCategoryId);

        if (serviceCategoryId == null) {
            return skillRepository.findAll(pageable).map(this::mapSkillToDto);
        }

        // Resolve mapped skills for the given category (or sub-category)
        List<ServiceCategorySkillMap> mappings =
                categorySkillMapRepository.findByServiceCategoryIdAndIsActiveTrue(serviceCategoryId);

        if (mappings.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Long> skillIds = mappings.stream()
                .map(ServiceCategorySkillMap::getServiceSkillId)
                .distinct()
                .toList();

        List<ServiceSkillMaster> skills = skillRepository.findByIdInAndIsActiveTrue(skillIds);
        List<ServiceSkillMasterDto> dtos = skills.stream()
                .map(this::mapSkillToDto)
                .toList();

        return new org.springframework.data.domain.PageImpl<>(dtos, pageable, dtos.size());
    }

    public ServiceSkillMasterDto getServiceSkillById(Long id) {
        log.info("Fetching service skill by id: {}", id);
        ServiceSkillMaster skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service skill not found"));
        return mapSkillToDto(skill);
    }

    @Transactional
    @CacheEvict(value = "skills", allEntries = true)
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
    @CacheEvict(value = "skills", allEntries = true)
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
    @CacheEvict(value = "skills", allEntries = true)
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

    // ========== Service Category - Skill Mapping ==========
    @Transactional(readOnly = true)
    public List<ServiceCategorySkillMapDto> getCategorySkillMappings(Long categoryId) {
        log.info("Fetching category-skill mappings for categoryId: {}", categoryId);
        // Use fetch-join query to eagerly load category and skill to avoid LazyInitializationException
        List<ServiceCategorySkillMap> mappings =
                categorySkillMapRepository.findActiveByCategoryIdWithDetails(categoryId);
        return mappings.stream()
                .map(this::mapCategorySkillMapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "skills", allEntries = true)
    public ServiceCategorySkillMapDto createCategorySkillMapping(Long categoryId, Long skillId) {
        log.info("Creating category-skill mapping: categoryId={}, skillId={}", categoryId, skillId);
        
        // Check if mapping already exists
        boolean exists = categorySkillMapRepository.findByServiceCategoryIdAndIsActiveTrue(categoryId).stream()
                .anyMatch(m -> m.getServiceSkillId().equals(skillId));
        
        if (exists) {
            throw new RuntimeException("Mapping already exists for this category and skill");
        }

        ServiceCategorySkillMap mapping = ServiceCategorySkillMap.builder()
                .serviceCategoryId(categoryId)
                .serviceSkillId(skillId)
                .isActive(true)
                .build();
        
        mapping = categorySkillMapRepository.save(mapping);
        log.info("Category-skill mapping created successfully with id: {}", mapping.getId());
        return mapCategorySkillMapToDto(mapping);
    }

    @Transactional
    @CacheEvict(value = "skills", allEntries = true)
    public void deleteCategorySkillMapping(Long mappingId) {
        log.info("Deleting category-skill mapping id: {}", mappingId);
        ServiceCategorySkillMap mapping = categorySkillMapRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Category-skill mapping not found"));
        mapping.setIsActive(false);
        categorySkillMapRepository.save(mapping);
        log.info("Category-skill mapping deactivated successfully");
    }

    @Transactional
    @CacheEvict(value = "skills", allEntries = true)
    public void bulkUpdateCategorySkillMappings(Long categoryId, List<Long> skillIds) {
        log.info("Bulk updating category-skill mappings for categoryId: {}, skillIds: {}", categoryId, skillIds);
        
        // Get existing mappings
        List<ServiceCategorySkillMap> existingMappings = categorySkillMapRepository.findByServiceCategoryIdAndIsActiveTrue(categoryId);
        List<Long> existingSkillIds = existingMappings.stream()
                .map(ServiceCategorySkillMap::getServiceSkillId)
                .collect(Collectors.toList());

        // Deactivate mappings that are not in the new list
        for (ServiceCategorySkillMap mapping : existingMappings) {
            if (!skillIds.contains(mapping.getServiceSkillId())) {
                mapping.setIsActive(false);
                categorySkillMapRepository.save(mapping);
            }
        }

        // Create new mappings for skills not already mapped
        for (Long skillId : skillIds) {
            if (!existingSkillIds.contains(skillId)) {
                ServiceCategorySkillMap mapping = ServiceCategorySkillMap.builder()
                        .serviceCategoryId(categoryId)
                        .serviceSkillId(skillId)
                        .isActive(true)
                        .build();
                categorySkillMapRepository.save(mapping);
            }
        }

        log.info("Bulk update completed for categoryId: {}", categoryId);
    }

    private ServiceCategorySkillMapDto mapCategorySkillMapToDto(ServiceCategorySkillMap mapping) {
        ServiceCategoryMaster category = mapping.getCategory();
        ServiceSkillMaster skill = mapping.getSkill();
        
        return ServiceCategorySkillMapDto.builder()
                .id(mapping.getId())
                .serviceCategoryId(mapping.getServiceCategoryId())
                .serviceCategoryName(category != null ? category.getName() : null)
                .serviceSkillId(mapping.getServiceSkillId())
                .serviceSkillName(skill != null ? skill.getName() : null)
                .isActive(mapping.getIsActive())
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
