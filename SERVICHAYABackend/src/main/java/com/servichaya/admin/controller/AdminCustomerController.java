package com.servichaya.admin.controller;

import com.servichaya.admin.dto.CustomerDto;
import com.servichaya.admin.service.AdminCustomerService;
import com.servichaya.auth.service.JwtService;
import com.servichaya.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/customers")
@RequiredArgsConstructor
@Slf4j
public class AdminCustomerController {

    private final AdminCustomerService customerService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerDto>>> getCustomers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest request) {
        log.info("Fetching customers with status: {}, page: {}, size: {}", status, pageable.getPageNumber(), pageable.getPageSize());
        
        extractAdminIdFromToken(request); // Verify admin
        
        Page<CustomerDto> customers = customerService.getCustomers(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Customers fetched successfully", customers));
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(
            @PathVariable Long customerId,
            HttpServletRequest request) {
        log.info("Fetching customer by id: {}", customerId);
        
        extractAdminIdFromToken(request); // Verify admin
        
        CustomerDto customer = customerService.getCustomerById(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer fetched successfully", customer));
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(
            @PathVariable Long customerId,
            @RequestBody CustomerDto dto,
            HttpServletRequest request) {
        log.info("Updating customer id: {}", customerId);
        
        extractAdminIdFromToken(request); // Verify admin
        
        CustomerDto updated = customerService.updateCustomer(customerId, dto);
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", updated));
    }

    @PostMapping("/{customerId}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateCustomer(
            @PathVariable Long customerId,
            HttpServletRequest request) {
        log.info("Deactivating customer id: {}", customerId);
        
        extractAdminIdFromToken(request); // Verify admin
        
        customerService.deactivateCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer deactivated successfully", "Deactivated"));
    }

    @PostMapping("/{customerId}/activate")
    public ResponseEntity<ApiResponse<String>> activateCustomer(
            @PathVariable Long customerId,
            HttpServletRequest request) {
        log.info("Activating customer id: {}", customerId);
        
        extractAdminIdFromToken(request); // Verify admin
        
        customerService.activateCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer activated successfully", "Activated"));
    }

    private Long extractAdminIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("Authorization header missing or invalid");
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }
        
        String token = authHeader.substring(7);
        try {
            Long userId = jwtService.extractUserId(token);
            String role = jwtService.extractRole(token);
            
            if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
                throw new RuntimeException("Unauthorized: Admin access required");
            }
            
            return userId;
        } catch (Exception e) {
            log.error("Error extracting admin userId from token", e);
            throw new RuntimeException("Unauthorized: Invalid token", e);
        }
    }
}
