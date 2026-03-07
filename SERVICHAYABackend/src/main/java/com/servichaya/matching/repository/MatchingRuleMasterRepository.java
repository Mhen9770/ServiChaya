package com.servichaya.matching.repository;

import com.servichaya.matching.entity.MatchingRuleMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchingRuleMasterRepository extends JpaRepository<MatchingRuleMaster, Long> {

    List<MatchingRuleMaster> findByIsActiveTrueOrderByPriorityOrderAsc();

    MatchingRuleMaster findByRuleCode(String ruleCode);
}
