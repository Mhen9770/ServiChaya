package com.servichaya.location.repository;

import com.servichaya.location.entity.StateMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StateMasterRepository extends JpaRepository<StateMaster, Long> {
    Optional<StateMaster> findByCode(String code);
    
    @Query("SELECT s FROM StateMaster s JOIN FETCH s.country WHERE s.isActive = true ORDER BY s.name ASC")
    List<StateMaster> findAllActive();
    
    @Query(value = "SELECT DISTINCT s FROM StateMaster s JOIN FETCH s.country",
           countQuery = "SELECT COUNT(DISTINCT s) FROM StateMaster s")
    Page<StateMaster> findAllWithRelations(Pageable pageable);
    
    @Query("SELECT DISTINCT s FROM StateMaster s JOIN FETCH s.country WHERE s.id = :id")
    Optional<StateMaster> findByIdWithRelations(@Param("id") Long id);
}
