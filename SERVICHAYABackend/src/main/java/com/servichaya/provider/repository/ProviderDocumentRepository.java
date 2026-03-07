package com.servichaya.provider.repository;

import com.servichaya.provider.entity.ProviderDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderDocumentRepository extends JpaRepository<ProviderDocument, Long> {

    List<ProviderDocument> findByProviderId(Long providerId);

    @Modifying
    @Query("DELETE FROM ProviderDocument d WHERE d.providerId = :providerId")
    void deleteByProviderId(@Param("providerId") Long providerId);
}
