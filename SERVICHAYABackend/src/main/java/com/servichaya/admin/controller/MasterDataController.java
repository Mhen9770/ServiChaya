package com.servichaya.admin.controller;

import com.servichaya.admin.dto.*;
import com.servichaya.admin.service.MasterDataService;
import com.servichaya.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/master-data")
@RequiredArgsConstructor
@Slf4j
public class MasterDataController {

    private final MasterDataService masterDataService;

    // ========== City Master ==========
    @GetMapping("/cities")
    public ResponseEntity<ApiResponse<Page<CityMasterDto>>> getAllCities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all cities, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CityMasterDto> cities = masterDataService.getAllCities(pageable);
        return ResponseEntity.ok(ApiResponse.success("Cities fetched successfully", cities));
    }

    @GetMapping("/cities/{id}")
    public ResponseEntity<ApiResponse<CityMasterDto>> getCityById(@PathVariable Long id) {
        log.info("Fetching city by id: {}", id);
        CityMasterDto city = masterDataService.getCityById(id);
        return ResponseEntity.ok(ApiResponse.success("City fetched successfully", city));
    }

    @PostMapping("/cities")
    public ResponseEntity<ApiResponse<CityMasterDto>> createCity(@RequestBody CityMasterDto dto) {
        log.info("Creating city: {}", dto.getName());
        CityMasterDto city = masterDataService.createCity(dto);
        return ResponseEntity.ok(ApiResponse.success("City created successfully", city));
    }

    @PutMapping("/cities/{id}")
    public ResponseEntity<ApiResponse<CityMasterDto>> updateCity(@PathVariable Long id, @RequestBody CityMasterDto dto) {
        log.info("Updating city id: {}", id);
        CityMasterDto city = masterDataService.updateCity(id, dto);
        return ResponseEntity.ok(ApiResponse.success("City updated successfully", city));
    }

    @DeleteMapping("/cities/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCity(@PathVariable Long id) {
        log.info("Deleting city id: {}", id);
        masterDataService.deleteCity(id);
        return ResponseEntity.ok(ApiResponse.success("City deleted successfully", "Deleted"));
    }

    @GetMapping("/cities/active")
    public ResponseEntity<ApiResponse<List<CityMasterDto>>> getAllActiveCities() {
        log.info("Fetching all active cities");
        List<CityMasterDto> cities = masterDataService.getAllActiveCities();
        return ResponseEntity.ok(ApiResponse.success("Active cities fetched successfully", cities));
    }

    // ========== Zone Master ==========
    @GetMapping("/zones")
    public ResponseEntity<ApiResponse<Page<ZoneMasterDto>>> getAllZones(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all zones, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ZoneMasterDto> zones = masterDataService.getAllZones(pageable);
        return ResponseEntity.ok(ApiResponse.success("Zones fetched successfully", zones));
    }

    @GetMapping("/zones/{id}")
    public ResponseEntity<ApiResponse<ZoneMasterDto>> getZoneById(@PathVariable Long id) {
        log.info("Fetching zone by id: {}", id);
        ZoneMasterDto zone = masterDataService.getZoneById(id);
        return ResponseEntity.ok(ApiResponse.success("Zone fetched successfully", zone));
    }

    @PostMapping("/zones")
    public ResponseEntity<ApiResponse<ZoneMasterDto>> createZone(@RequestBody ZoneMasterDto dto) {
        log.info("Creating zone: {}", dto.getName());
        ZoneMasterDto zone = masterDataService.createZone(dto);
        return ResponseEntity.ok(ApiResponse.success("Zone created successfully", zone));
    }

    @PutMapping("/zones/{id}")
    public ResponseEntity<ApiResponse<ZoneMasterDto>> updateZone(@PathVariable Long id, @RequestBody ZoneMasterDto dto) {
        log.info("Updating zone id: {}", id);
        ZoneMasterDto zone = masterDataService.updateZone(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Zone updated successfully", zone));
    }

    @DeleteMapping("/zones/{id}")
    public ResponseEntity<ApiResponse<String>> deleteZone(@PathVariable Long id) {
        log.info("Deleting zone id: {}", id);
        masterDataService.deleteZone(id);
        return ResponseEntity.ok(ApiResponse.success("Zone deleted successfully", "Deleted"));
    }

    @GetMapping("/zones/city/{cityId}")
    public ResponseEntity<ApiResponse<List<ZoneMasterDto>>> getZonesByCity(@PathVariable Long cityId) {
        log.info("Fetching zones for city id: {}", cityId);
        List<ZoneMasterDto> zones = masterDataService.getZonesByCity(cityId);
        return ResponseEntity.ok(ApiResponse.success("Zones fetched successfully", zones));
    }

    // ========== POD Master ==========
    @GetMapping("/pods")
    public ResponseEntity<ApiResponse<Page<PodMasterDto>>> getAllPods(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all PODs, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PodMasterDto> pods = masterDataService.getAllPods(pageable);
        return ResponseEntity.ok(ApiResponse.success("PODs fetched successfully", pods));
    }

    @GetMapping("/pods/{id}")
    public ResponseEntity<ApiResponse<PodMasterDto>> getPodById(@PathVariable Long id) {
        log.info("Fetching POD by id: {}", id);
        PodMasterDto pod = masterDataService.getPodById(id);
        return ResponseEntity.ok(ApiResponse.success("POD fetched successfully", pod));
    }

    @PostMapping("/pods")
    public ResponseEntity<ApiResponse<PodMasterDto>> createPod(@RequestBody PodMasterDto dto) {
        log.info("Creating POD: {}", dto.getName());
        PodMasterDto pod = masterDataService.createPod(dto);
        return ResponseEntity.ok(ApiResponse.success("POD created successfully", pod));
    }

    @PutMapping("/pods/{id}")
    public ResponseEntity<ApiResponse<PodMasterDto>> updatePod(@PathVariable Long id, @RequestBody PodMasterDto dto) {
        log.info("Updating POD id: {}", id);
        PodMasterDto pod = masterDataService.updatePod(id, dto);
        return ResponseEntity.ok(ApiResponse.success("POD updated successfully", pod));
    }

    @DeleteMapping("/pods/{id}")
    public ResponseEntity<ApiResponse<String>> deletePod(@PathVariable Long id) {
        log.info("Deleting POD id: {}", id);
        masterDataService.deletePod(id);
        return ResponseEntity.ok(ApiResponse.success("POD deleted successfully", "Deleted"));
    }

    @GetMapping("/pods/city/{cityId}")
    public ResponseEntity<ApiResponse<List<PodMasterDto>>> getPodsByCity(@PathVariable Long cityId) {
        log.info("Fetching PODs for city id: {}", cityId);
        List<PodMasterDto> pods = masterDataService.getPodsByCity(cityId);
        return ResponseEntity.ok(ApiResponse.success("PODs fetched successfully", pods));
    }

    @GetMapping("/pods/zone/{zoneId}")
    public ResponseEntity<ApiResponse<List<PodMasterDto>>> getPodsByZone(@PathVariable Long zoneId) {
        log.info("Fetching PODs for zone id: {}", zoneId);
        List<PodMasterDto> pods = masterDataService.getPodsByZone(zoneId);
        return ResponseEntity.ok(ApiResponse.success("PODs fetched successfully", pods));
    }

    // ========== Service Category Master ==========
    @GetMapping("/service-categories")
    public ResponseEntity<ApiResponse<Page<ServiceCategoryMasterDto>>> getAllServiceCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Long parentId) {
        log.info("Fetching service categories, page: {}, size: {}, parentId: {}", page, size, parentId);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ServiceCategoryMasterDto> categories = masterDataService.getAllServiceCategories(pageable, parentId);
        return ResponseEntity.ok(ApiResponse.success("Service categories fetched successfully", categories));
    }

    @GetMapping("/service-categories/{id}")
    public ResponseEntity<ApiResponse<ServiceCategoryMasterDto>> getServiceCategoryById(@PathVariable Long id) {
        log.info("Fetching service category by id: {}", id);
        ServiceCategoryMasterDto category = masterDataService.getServiceCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success("Service category fetched successfully", category));
    }

    @PostMapping("/service-categories")
    public ResponseEntity<ApiResponse<ServiceCategoryMasterDto>> createServiceCategory(@RequestBody ServiceCategoryMasterDto dto) {
        log.info("Creating service category: {}", dto.getName());
        ServiceCategoryMasterDto category = masterDataService.createServiceCategory(dto);
        return ResponseEntity.ok(ApiResponse.success("Service category created successfully", category));
    }

    @PutMapping("/service-categories/{id}")
    public ResponseEntity<ApiResponse<ServiceCategoryMasterDto>> updateServiceCategory(@PathVariable Long id, @RequestBody ServiceCategoryMasterDto dto) {
        log.info("Updating service category id: {}", id);
        ServiceCategoryMasterDto category = masterDataService.updateServiceCategory(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Service category updated successfully", category));
    }

    @DeleteMapping("/service-categories/{id}")
    public ResponseEntity<ApiResponse<String>> deleteServiceCategory(@PathVariable Long id) {
        log.info("Deleting service category id: {}", id);
        masterDataService.deleteServiceCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Service category deleted successfully", "Deleted"));
    }

    // ========== Service SubCategory Master ==========
//    @GetMapping("/service-subcategories")
//    public ResponseEntity<ApiResponse<Page<ServiceSubCategoryMasterDto>>> getAllServiceSubCategories(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size,
//            @RequestParam(required = false) String sortBy,
//            @RequestParam(required = false) String sortDir) {
//        log.info("Fetching all service subcategories, page: {}, size: {}", page, size);
//        Sort sort = Sort.unsorted();
//        if (sortBy != null && !sortBy.isEmpty()) {
//            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
//            sort = Sort.by(direction, sortBy);
//        }
//        Pageable pageable = PageRequest.of(page, size, sort);
//        Page<ServiceSubCategoryMasterDto> subCategories = masterDataService.getAllServiceSubCategories(pageable);
//        return ResponseEntity.ok(ApiResponse.success("Service subcategories fetched successfully", subCategories));
//    }
//
//    @GetMapping("/service-subcategories/{id}")
//    public ResponseEntity<ApiResponse<ServiceSubCategoryMasterDto>> getServiceSubCategoryById(@PathVariable Long id) {
//        log.info("Fetching service subcategory by id: {}", id);
//        ServiceSubCategoryMasterDto subCategory = masterDataService.getServiceSubCategoryById(id);
//        return ResponseEntity.ok(ApiResponse.success("Service subcategory fetched successfully", subCategory));
//    }
//
//    @PostMapping("/service-subcategories")
//    public ResponseEntity<ApiResponse<ServiceSubCategoryMasterDto>> createServiceSubCategory(@RequestBody ServiceSubCategoryMasterDto dto) {
//        log.info("Creating service subcategory: {}", dto.getName());
//        ServiceSubCategoryMasterDto subCategory = masterDataService.createServiceSubCategory(dto);
//        return ResponseEntity.ok(ApiResponse.success("Service subcategory created successfully", subCategory));
//    }
//
//    @PutMapping("/service-subcategories/{id}")
//    public ResponseEntity<ApiResponse<ServiceSubCategoryMasterDto>> updateServiceSubCategory(@PathVariable Long id, @RequestBody ServiceSubCategoryMasterDto dto) {
//        log.info("Updating service subcategory id: {}", id);
//        ServiceSubCategoryMasterDto subCategory = masterDataService.updateServiceSubCategory(id, dto);
//        return ResponseEntity.ok(ApiResponse.success("Service subcategory updated successfully", subCategory));
//    }
//
//    @DeleteMapping("/service-subcategories/{id}")
//    public ResponseEntity<ApiResponse<String>> deleteServiceSubCategory(@PathVariable Long id) {
//        log.info("Deleting service subcategory id: {}", id);
//        masterDataService.deleteServiceSubCategory(id);
//        return ResponseEntity.ok(ApiResponse.success("Service subcategory deleted successfully", "Deleted"));
//    }

    // ========== Matching Rule Master ==========
    @GetMapping("/matching-rules")
    public ResponseEntity<ApiResponse<Page<MatchingRuleMasterDto>>> getAllMatchingRules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all matching rules, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MatchingRuleMasterDto> rules = masterDataService.getAllMatchingRules(pageable);
        return ResponseEntity.ok(ApiResponse.success("Matching rules fetched successfully", rules));
    }

    @GetMapping("/matching-rules/{id}")
    public ResponseEntity<ApiResponse<MatchingRuleMasterDto>> getMatchingRuleById(@PathVariable Long id) {
        log.info("Fetching matching rule by id: {}", id);
        MatchingRuleMasterDto rule = masterDataService.getMatchingRuleById(id);
        return ResponseEntity.ok(ApiResponse.success("Matching rule fetched successfully", rule));
    }

    @PostMapping("/matching-rules")
    public ResponseEntity<ApiResponse<MatchingRuleMasterDto>> createMatchingRule(@RequestBody MatchingRuleMasterDto dto) {
        log.info("Creating matching rule: {}", dto.getRuleName());
        MatchingRuleMasterDto rule = masterDataService.createMatchingRule(dto);
        return ResponseEntity.ok(ApiResponse.success("Matching rule created successfully", rule));
    }

    @PutMapping("/matching-rules/{id}")
    public ResponseEntity<ApiResponse<MatchingRuleMasterDto>> updateMatchingRule(@PathVariable Long id, @RequestBody MatchingRuleMasterDto dto) {
        log.info("Updating matching rule id: {}", id);
        MatchingRuleMasterDto rule = masterDataService.updateMatchingRule(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Matching rule updated successfully", rule));
    }

    @DeleteMapping("/matching-rules/{id}")
    public ResponseEntity<ApiResponse<String>> deleteMatchingRule(@PathVariable Long id) {
        log.info("Deleting matching rule id: {}", id);
        masterDataService.deleteMatchingRule(id);
        return ResponseEntity.ok(ApiResponse.success("Matching rule deleted successfully", "Deleted"));
    }

    // ========== Service Skill Master ==========
    @GetMapping("/service-skills")
    public ResponseEntity<ApiResponse<Page<ServiceSkillMasterDto>>> getAllServiceSkills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Long serviceCategoryId) {
        log.info("Fetching all service skills, page: {}, size: {}, serviceCategoryId: {}", page, size, serviceCategoryId);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ServiceSkillMasterDto> skills = masterDataService.getAllServiceSkills(pageable, serviceCategoryId);
        return ResponseEntity.ok(ApiResponse.success("Service skills fetched successfully", skills));
    }

    @GetMapping("/service-skills/{id}")
    public ResponseEntity<ApiResponse<ServiceSkillMasterDto>> getServiceSkillById(@PathVariable Long id) {
        log.info("Fetching service skill by id: {}", id);
        ServiceSkillMasterDto skill = masterDataService.getServiceSkillById(id);
        return ResponseEntity.ok(ApiResponse.success("Service skill fetched successfully", skill));
    }

    @PostMapping("/service-skills")
    public ResponseEntity<ApiResponse<ServiceSkillMasterDto>> createServiceSkill(@RequestBody ServiceSkillMasterDto dto) {
        log.info("Creating service skill: {}", dto.getName());
        ServiceSkillMasterDto skill = masterDataService.createServiceSkill(dto);
        return ResponseEntity.ok(ApiResponse.success("Service skill created successfully", skill));
    }

    @PutMapping("/service-skills/{id}")
    public ResponseEntity<ApiResponse<ServiceSkillMasterDto>> updateServiceSkill(@PathVariable Long id, @RequestBody ServiceSkillMasterDto dto) {
        log.info("Updating service skill id: {}", id);
        ServiceSkillMasterDto skill = masterDataService.updateServiceSkill(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Service skill updated successfully", skill));
    }

    @DeleteMapping("/service-skills/{id}")
    public ResponseEntity<ApiResponse<String>> deleteServiceSkill(@PathVariable Long id) {
        log.info("Deleting service skill id: {}", id);
        masterDataService.deleteServiceSkill(id);
        return ResponseEntity.ok(ApiResponse.success("Service skill deleted successfully", "Deleted"));
    }

    // ========== Service Category - Skill Mapping ==========
    @GetMapping("/category-skill-mappings")
    public ResponseEntity<ApiResponse<List<ServiceCategorySkillMapDto>>> getCategorySkillMappings(
            @RequestParam Long categoryId) {
        log.info("Fetching category-skill mappings for categoryId: {}", categoryId);
        List<ServiceCategorySkillMapDto> mappings = masterDataService.getCategorySkillMappings(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category-skill mappings fetched successfully", mappings));
    }

    @PostMapping("/category-skill-mappings")
    public ResponseEntity<ApiResponse<ServiceCategorySkillMapDto>> createCategorySkillMapping(
            @RequestParam Long categoryId,
            @RequestParam Long skillId) {
        log.info("Creating category-skill mapping: categoryId={}, skillId={}", categoryId, skillId);
        ServiceCategorySkillMapDto mapping = masterDataService.createCategorySkillMapping(categoryId, skillId);
        return ResponseEntity.ok(ApiResponse.success("Category-skill mapping created successfully", mapping));
    }

    @DeleteMapping("/category-skill-mappings/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCategorySkillMapping(@PathVariable Long id) {
        log.info("Deleting category-skill mapping id: {}", id);
        masterDataService.deleteCategorySkillMapping(id);
        return ResponseEntity.ok(ApiResponse.success("Category-skill mapping deleted successfully", "Deleted"));
    }

    @PutMapping("/category-skill-mappings/bulk")
    public ResponseEntity<ApiResponse<String>> bulkUpdateCategorySkillMappings(
            @RequestParam Long categoryId,
            @RequestBody List<Long> skillIds) {
        log.info("Bulk updating category-skill mappings for categoryId: {}, skillIds: {}", categoryId, skillIds);
        masterDataService.bulkUpdateCategorySkillMappings(categoryId, skillIds);
        return ResponseEntity.ok(ApiResponse.success("Category-skill mappings updated successfully", "Updated"));
    }

    // ========== Country Master ==========
    @GetMapping("/countries")
    public ResponseEntity<ApiResponse<Page<CountryMasterDto>>> getAllCountries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all countries, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CountryMasterDto> countries = masterDataService.getAllCountries(pageable);
        return ResponseEntity.ok(ApiResponse.success("Countries fetched successfully", countries));
    }

    @GetMapping("/countries/{id}")
    public ResponseEntity<ApiResponse<CountryMasterDto>> getCountryById(@PathVariable Long id) {
        log.info("Fetching country by id: {}", id);
        CountryMasterDto country = masterDataService.getCountryById(id);
        return ResponseEntity.ok(ApiResponse.success("Country fetched successfully", country));
    }

    @PostMapping("/countries")
    public ResponseEntity<ApiResponse<CountryMasterDto>> createCountry(@RequestBody CountryMasterDto dto) {
        log.info("Creating country: {}", dto.getName());
        CountryMasterDto country = masterDataService.createCountry(dto);
        return ResponseEntity.ok(ApiResponse.success("Country created successfully", country));
    }

    @PutMapping("/countries/{id}")
    public ResponseEntity<ApiResponse<CountryMasterDto>> updateCountry(@PathVariable Long id, @RequestBody CountryMasterDto dto) {
        log.info("Updating country id: {}", id);
        CountryMasterDto country = masterDataService.updateCountry(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Country updated successfully", country));
    }

    @DeleteMapping("/countries/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCountry(@PathVariable Long id) {
        log.info("Deleting country id: {}", id);
        masterDataService.deleteCountry(id);
        return ResponseEntity.ok(ApiResponse.success("Country deleted successfully", "Deleted"));
    }

    @GetMapping("/countries/active")
    public ResponseEntity<ApiResponse<List<CountryMasterDto>>> getAllActiveCountries() {
        log.info("Fetching all active countries");
        List<CountryMasterDto> countries = masterDataService.getAllActiveCountries();
        return ResponseEntity.ok(ApiResponse.success("Active countries fetched successfully", countries));
    }

    // ========== State Master ==========
    @GetMapping("/states")
    public ResponseEntity<ApiResponse<Page<StateMasterDto>>> getAllStates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all states, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<StateMasterDto> states = masterDataService.getAllStates(pageable);
        return ResponseEntity.ok(ApiResponse.success("States fetched successfully", states));
    }

    @GetMapping("/states/{id}")
    public ResponseEntity<ApiResponse<StateMasterDto>> getStateById(@PathVariable Long id) {
        log.info("Fetching state by id: {}", id);
        StateMasterDto state = masterDataService.getStateById(id);
        return ResponseEntity.ok(ApiResponse.success("State fetched successfully", state));
    }

    @PostMapping("/states")
    public ResponseEntity<ApiResponse<StateMasterDto>> createState(@RequestBody StateMasterDto dto) {
        log.info("Creating state: {}", dto.getName());
        StateMasterDto state = masterDataService.createState(dto);
        return ResponseEntity.ok(ApiResponse.success("State created successfully", state));
    }

    @PutMapping("/states/{id}")
    public ResponseEntity<ApiResponse<StateMasterDto>> updateState(@PathVariable Long id, @RequestBody StateMasterDto dto) {
        log.info("Updating state id: {}", id);
        StateMasterDto state = masterDataService.updateState(id, dto);
        return ResponseEntity.ok(ApiResponse.success("State updated successfully", state));
    }

    @DeleteMapping("/states/{id}")
    public ResponseEntity<ApiResponse<String>> deleteState(@PathVariable Long id) {
        log.info("Deleting state id: {}", id);
        masterDataService.deleteState(id);
        return ResponseEntity.ok(ApiResponse.success("State deleted successfully", "Deleted"));
    }

    @GetMapping("/states/country/{countryId}")
    public ResponseEntity<ApiResponse<List<StateMasterDto>>> getStatesByCountry(@PathVariable Long countryId) {
        log.info("Fetching states for country id: {}", countryId);
        List<StateMasterDto> states = masterDataService.getStatesByCountry(countryId);
        return ResponseEntity.ok(ApiResponse.success("States fetched successfully", states));
    }

    // ========== User Role Master ==========
    @GetMapping("/user-roles")
    public ResponseEntity<ApiResponse<Page<UserRoleMasterDto>>> getAllUserRoles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        log.info("Fetching all user roles, page: {}, size: {}", page, size);
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserRoleMasterDto> roles = masterDataService.getAllUserRoles(pageable);
        return ResponseEntity.ok(ApiResponse.success("User roles fetched successfully", roles));
    }

    @GetMapping("/user-roles/{id}")
    public ResponseEntity<ApiResponse<UserRoleMasterDto>> getUserRoleById(@PathVariable Long id) {
        log.info("Fetching user role by id: {}", id);
        UserRoleMasterDto role = masterDataService.getUserRoleById(id);
        return ResponseEntity.ok(ApiResponse.success("User role fetched successfully", role));
    }

    @PostMapping("/user-roles")
    public ResponseEntity<ApiResponse<UserRoleMasterDto>> createUserRole(@RequestBody UserRoleMasterDto dto) {
        log.info("Creating user role: {}", dto.getName());
        UserRoleMasterDto role = masterDataService.createUserRole(dto);
        return ResponseEntity.ok(ApiResponse.success("User role created successfully", role));
    }

    @PutMapping("/user-roles/{id}")
    public ResponseEntity<ApiResponse<UserRoleMasterDto>> updateUserRole(@PathVariable Long id, @RequestBody UserRoleMasterDto dto) {
        log.info("Updating user role id: {}", id);
        UserRoleMasterDto role = masterDataService.updateUserRole(id, dto);
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", role));
    }

    @DeleteMapping("/user-roles/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUserRole(@PathVariable Long id) {
        log.info("Deleting user role id: {}", id);
        try {
            masterDataService.deleteUserRole(id);
            return ResponseEntity.ok(ApiResponse.success("User role deleted successfully", "Deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
