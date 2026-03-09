package com.servichaya.config.repository;

import com.servichaya.config.entity.BusinessRuleMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessRuleMasterRepository extends JpaRepository<BusinessRuleMaster, Long> {

    Optional<BusinessRuleMaster> findByRuleCode(String ruleCode);

    @Query("SELECT b FROM BusinessRuleMaster b WHERE b.isActive = true AND b.ruleCode = :ruleCode")
    Optional<BusinessRuleMaster> findActiveByRuleCode(@Param("ruleCode") String ruleCode);

    @Query("SELECT b FROM BusinessRuleMaster b WHERE b.isActive = true")
    List<BusinessRuleMaster> findAllActive();

    @Query("SELECT b FROM BusinessRuleMaster b WHERE b.isActive = true AND b.appliesTo IN :appliesTo")
    List<BusinessRuleMaster> findActiveByAppliesTo(@Param("appliesTo") List<String> appliesTo);
}
