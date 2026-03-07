package com.servichaya.location.repository;

import com.servichaya.location.entity.CountryMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountryMasterRepository extends JpaRepository<CountryMaster, Long> {
    Optional<CountryMaster> findByCode(String code);
    Optional<CountryMaster> findByCountryCode(String countryCode);
    
    @Query("SELECT c FROM CountryMaster c WHERE c.isActive = true ORDER BY c.name ASC")
    List<CountryMaster> findAllActive();
}
