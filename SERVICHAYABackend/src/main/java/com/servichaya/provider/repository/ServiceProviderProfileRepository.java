package com.servichaya.provider.repository;

import com.servichaya.provider.entity.ServiceProviderProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceProviderProfileRepository extends JpaRepository<ServiceProviderProfile, Long> {
    @Query("select s from ServiceProviderProfile s where :status is null or profileStatus = :status")
    Page<ServiceProviderProfile> findAllByStatus(String status, Pageable pageable);

    Optional<ServiceProviderProfile> findByUserId(Long userId);

    Optional<ServiceProviderProfile> findByProviderCode(String providerCode);

    @Query("SELECT COUNT(p) FROM ServiceProviderProfile p WHERE p.profileStatus = :status AND (p.isDeleted IS NULL OR p.isDeleted = false)")
    long countByProfileStatus(@Param("status") String status);

}
