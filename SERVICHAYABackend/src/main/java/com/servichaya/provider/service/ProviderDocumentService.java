package com.servichaya.provider.service;

import com.servichaya.provider.dto.OnboardingStep2Dto;
import com.servichaya.provider.entity.ProviderDocument;
import com.servichaya.provider.repository.ProviderDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProviderDocumentService {

    private final ProviderDocumentRepository documentRepository;

    @Value("${provider.documents-path:/app/data/documents/Providers/docs}")
    private String providerDocumentsPath;

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

    /**
     * Store uploaded provider documents on server and return their public URLs.
     * Files are stored under configured provider.documents-path.
     */
    public List<String> uploadDocuments(MultipartFile[] files) throws IOException {
        if (files == null || files.length == 0) {
            return List.of();
        }

        Path baseDir = Paths.get(providerDocumentsPath).toAbsolutePath().normalize();
        if (!Files.exists(baseDir)) {
            Files.createDirectories(baseDir);
        }

        return Arrays.stream(files)
                .filter(f -> f != null && !f.isEmpty())
                .map(file -> {
                    String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
                    String ext = "";
                    int idx = original.lastIndexOf('.');
                    if (idx != -1) {
                        ext = original.substring(idx);
                    }
                    String storedName = UUID.randomUUID() + ext;
                    Path target = baseDir.resolve(storedName);
                    try {
                        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                        // Path will be served by controller at /provider/documents/files/{filename}
                        return "/provider/documents/files/" + storedName;
                    } catch (IOException e) {
                        log.error("Failed to store provider document {}", original, e);
                        throw new RuntimeException("Could not store file " + original, e);
                    }
                })
                .collect(Collectors.toList());
    }

    public Resource loadDocument(String filename) {
        try {
            Path baseDir = Paths.get(providerDocumentsPath).toAbsolutePath().normalize();
            Path filePath = baseDir.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("File not found: " + filename);
        } catch (MalformedURLException e) {
            throw new RuntimeException("File not found: " + filename, e);
        }
    }
}
