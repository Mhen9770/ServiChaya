package com.servichaya.provider.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.provider.dto.ProviderCustomerDto;
import com.servichaya.provider.service.ProviderCustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/provider/customers")
@RequiredArgsConstructor
@Slf4j
public class ProviderCustomerController {

    private final ProviderCustomerService providerCustomerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProviderCustomerDto>>> getProviderCustomers(
            @RequestParam Long providerId
    ) {
        log.info("Request to fetch customers for providerId: {}", providerId);
        List<ProviderCustomerDto> customers = providerCustomerService.getCustomersForProvider(providerId);
        return ResponseEntity.ok(ApiResponse.success("Provider customers fetched", customers));
    }
}

