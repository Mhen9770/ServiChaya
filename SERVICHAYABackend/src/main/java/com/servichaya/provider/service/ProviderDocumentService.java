package com.servichaya.provider.service;

import com.servichaya.provider.dto.OnboardingStep2Dto;
import com.servichaya.provider.entity.ProviderDocument;
import com.servichaya.provider.repository.ProviderDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProviderDocumentService {

    private final ProviderDocumentRepository documentRepository;

    public void saveDocuments(Long providerId, List<OnboardingStep2Dto.DocumentUpload> documents) {
        log.info("Saving documents for providerId: {}, documentsCount: {}", providerId, 
                documents != null ? documents.size() : 0);
        
        try {
            // Delete existing documents for this provider
            documentRepository.deleteByProviderId(providerId);
            log.debug("Deleted existing documents for providerId: {}", providerId);
            
            // Save new documents
            List<ProviderDocument> documentEntities = documents.stream()
                    .map(doc -> {
                        log.debug("Creating document entity for providerId: {}, type: {}", providerId, doc.getDocumentType());
                        return ProviderDocument.builder()
                                .providerId(providerId)
                                .documentType(doc.getDocumentType())
                                .documentNumber(doc.getDocumentNumber())
                                .documentUrl(doc.getDocumentUrl())
                                .verificationStatus("PENDING")
                                .build();
                    })
                    .collect(Collectors.toList());
            
            List<ProviderDocument> savedDocuments = documentRepository.saveAll(documentEntities);
            log.info("Successfully saved {} documents for providerId: {}", savedDocuments.size(), providerId);
        } catch (Exception e) {
            log.error("Error saving documents for providerId: {}", providerId, e);
            throw e;
        }
    }

    public List<ProviderDocument> getDocuments(Long providerId) {
        log.info("Fetching documents for providerId: {}", providerId);
        return documentRepository.findByProviderId(providerId);
    }
}
