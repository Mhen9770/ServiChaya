package com.servichaya.admin.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.matching.dto.ProviderMatchDto;
import com.servichaya.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Legacy Admin Job Assignment Controller.
 *
 * NOTE:
 * The endpoints from this controller have been consolidated into {@link AdminJobController}
 * to avoid duplication. This class is now kept only as a placeholder for backward
 * compatibility and should not expose any request mappings.
 *
 * If you need admin job assignment APIs, use {@link AdminJobController}.
 */
@RestController
@RequestMapping("/admin/jobs-legacy-assignment")
@RequiredArgsConstructor
@Slf4j
public class JobAssignmentController {

    private final MatchingService matchingService;

    // Intentionally no request-mapped methods here.
    // All active admin job assignment endpoints live in AdminJobController.
}
