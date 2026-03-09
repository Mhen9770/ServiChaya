package com.servichaya.provider.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.provider.service.ProviderDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/provider/documents")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class ProviderDocumentController {

    private final ProviderDocumentService documentService;

    /**
     * Upload provider documents (Aadhaar, PAN, etc.). Returns list of URLs that
     * can be saved as documentUrl in onboarding DTO.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<List<String>>> uploadDocuments(@RequestParam("files") MultipartFile[] files) {
        log.info("Received {} provider document file(s)", files != null ? files.length : 0);
        try {
            List<String> urls = documentService.uploadDocuments(files);
            return ResponseEntity.ok(ApiResponse.success(urls));
        } catch (IOException e) {
            log.error("Error uploading provider documents", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Could not upload documents. Please try again."));
        }
    }

    /**
     * Serve provider documents from configured provider.documents-path.
     */
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> getDocument(@PathVariable String filename) {
        Resource resource = documentService.loadDocument(filename);
        String encodedName = URLEncoder.encode(filename, StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedName + "\"")
                .body(resource);
    }
}

