package com.servichaya.feedback.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.feedback.dto.PublicOpenPointResponseDto;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointPriority;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointStatus;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointType;
import com.servichaya.feedback.service.PublicOpenPointService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/open-points")
@RequiredArgsConstructor
@Slf4j
public class AdminOpenPointController {

    private final PublicOpenPointService openPointService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PublicOpenPointResponseDto>>> list(
            @RequestParam(required = false) OpenPointStatus status,
            @RequestParam(required = false) OpenPointType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PublicOpenPointResponseDto> result = openPointService.getForAdmin(status, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicOpenPointResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(openPointService.getByIdForAdmin(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicOpenPointResponseDto>> update(
            @PathVariable Long id,
            @RequestParam(required = false) OpenPointStatus status,
            @RequestParam(required = false) OpenPointPriority priority,
            @RequestParam(required = false) String internalNotes
    ) {
        PublicOpenPointResponseDto updated = openPointService.updateStatusAndPriority(id, status, priority, internalNotes);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }
}

