package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderCustomerDto {

    private Long customerId;
    private String name;
    private String mobileNumber;
    private String email;

    private Long totalJobsTogether;
    private Long completedJobsTogether;
    private Double totalEarningsFromCustomer;

    private Boolean primaryForThisProvider;
    private String source; // REFERRAL_CODE, SERVICE_HISTORY, etc.
}

