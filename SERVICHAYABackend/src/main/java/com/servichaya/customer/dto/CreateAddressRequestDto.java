package com.servichaya.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAddressRequestDto {
    private String addressLabel;
    private String addressLine1;
    private String addressLine2;
    private String landmark;
    private String pincode;
    private Long cityId;
    private Long zoneId;
    private Long podId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Boolean isPrimary;
}
