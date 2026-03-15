package com.servichaya.service.repository;

import com.servichaya.service.entity.ServiceSkillMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceSkillMasterRepository extends JpaRepository<ServiceSkillMaster, Long> {

    Optional<ServiceSkillMaster> findByCode(String code);

    @Query("SELECT s FROM ServiceSkillMaster s WHERE s.isActive = true ORDER BY s.name ASC")
    List<ServiceSkillMaster> findAllActive();

    List<ServiceSkillMaster> findByIdInAndIsActiveTrue(List<Long> ids);
}
