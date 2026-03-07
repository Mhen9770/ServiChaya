package com.servichaya.preauth.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.preauth.dto.PlatformStatsDto;
import com.servichaya.preauth.service.PublicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Slf4j
public class PublicController {

    private final PublicService publicService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PlatformStatsDto>> getPlatformStats() {
        log.info("Fetching public platform statistics");
        PlatformStatsDto stats = publicService.getPlatformStats();
        return ResponseEntity.ok(ApiResponse.success("Platform stats fetched successfully", stats));
    }
}
