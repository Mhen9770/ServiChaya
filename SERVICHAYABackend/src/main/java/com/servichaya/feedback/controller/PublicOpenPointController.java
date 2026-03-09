package com.servichaya.feedback.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.feedback.dto.PublicOpenPointRequestDto;
import com.servichaya.feedback.dto.PublicOpenPointResponseDto;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointType;
import com.servichaya.feedback.service.PublicOpenPointService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/public/open-points")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class PublicOpenPointController {

    private final PublicOpenPointService openPointService;

    @PostMapping
    public ResponseEntity<ApiResponse<PublicOpenPointResponseDto>> create(@RequestBody PublicOpenPointRequestDto request) {
        log.info("Received public open point: type={}, title={}", request.getType(), request.getTitle());

        if (request.getType() == null) {
            request.setType(OpenPointType.OTHER);
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Title is required"));
        }

        if (request.getDescription() == null || request.getDescription().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Description is required"));
        }

        PublicOpenPointResponseDto response = openPointService.createFromPublic(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Upload one or more files for feedback. Returns list of file URLs that can be
     * passed as attachmentUrls when creating an open point.
     */
    @PostMapping("/files")
    public ResponseEntity<ApiResponse<List<String>>> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        log.info("Received {} feedback attachment file(s)", files != null ? files.length : 0);
        try {
            List<String> urls = openPointService.uploadFiles(files);
            return ResponseEntity.ok(ApiResponse.success(urls));
        } catch (IOException e) {
            log.error("Error uploading feedback files", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Could not upload files. Please try again."));
        }
    }

    /**
     * Serve uploaded feedback documents from configured documentsPath + /Feedback/docs/.
     */
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        Resource resource = openPointService.loadFileAsResource(filename);
        String encodedName = URLEncoder.encode(filename, StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedName + "\"")
                .body(resource);
    }
}

