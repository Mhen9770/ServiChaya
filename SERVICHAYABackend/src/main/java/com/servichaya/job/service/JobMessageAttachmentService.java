package com.servichaya.job.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Service for handling file uploads for job messages
 */
@Service
@Slf4j
public class JobMessageAttachmentService {

    @Value("${job.messages.attachments-path:/app/data/job-messages/attachments}")
    private String attachmentsPath;

    public String getAttachmentsPath() {
        return attachmentsPath;
    }

    /**
     * Upload a file and return its URL
     */
    public String uploadFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or null");
        }

        // Validate file size (max 10MB)
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 10MB");
        }

        // Validate file type
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("File name is null");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isAllowedFileType(contentType)) {
            throw new IllegalArgumentException("File type not allowed. Allowed types: images, PDF, documents");
        }

        // Create directory if it doesn't exist
        Path baseDir = Paths.get(attachmentsPath).toAbsolutePath().normalize();
        if (!Files.exists(baseDir)) {
            Files.createDirectories(baseDir);
            log.info("Created attachments directory: {}", baseDir);
        }

        // Generate unique filename
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex != -1) {
            extension = originalFilename.substring(dotIndex);
        }
        String storedName = UUID.randomUUID().toString() + extension;
        Path target = baseDir.resolve(storedName);

        // Save file
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        log.info("File uploaded successfully: {} -> {}", originalFilename, storedName);

        // Return URL path (will be served by controller)
        return "/jobs/messages/attachments/" + storedName;
    }

    /**
     * Get file type category from content type
     */
    public String getAttachmentType(String contentType) {
        if (contentType == null) {
            return "OTHER";
        }

        if (contentType.startsWith("image/")) {
            return "IMAGE";
        } else if (contentType.equals("application/pdf")) {
            return "PDF";
        } else if (contentType.contains("document") || 
                   contentType.contains("word") || 
                   contentType.contains("excel") ||
                   contentType.contains("spreadsheet") ||
                   contentType.contains("text")) {
            return "DOCUMENT";
        } else {
            return "OTHER";
        }
    }

    /**
     * Check if file type is allowed
     */
    private boolean isAllowedFileType(String contentType) {
        // Allow images
        if (contentType.startsWith("image/")) {
            return true;
        }
        
        // Allow PDF
        if (contentType.equals("application/pdf")) {
            return true;
        }
        
        // Allow common document types
        if (contentType.contains("document") || 
            contentType.contains("word") || 
            contentType.contains("excel") ||
            contentType.contains("spreadsheet") ||
            contentType.contains("text") ||
            contentType.equals("application/msword") ||
            contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
            contentType.equals("application/vnd.ms-excel") ||
            contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            return true;
        }
        
        return false;
    }
}
