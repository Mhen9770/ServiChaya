package com.servichaya.provider.repository;

import com.servichaya.provider.entity.ProviderCustomerLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderCustomerLinkRepository extends JpaRepository<ProviderCustomerLink, Long> {

    Optional<ProviderCustomerLink> findByProviderIdAndCustomerIdAndCategoryId(Long providerId, Long customerId, Long categoryId);

    List<ProviderCustomerLink> findByCustomerIdAndCategoryIdAndIsPrimaryTrue(Long customerId, Long categoryId);

    List<ProviderCustomerLink> findByProviderId(Long providerId);
}

