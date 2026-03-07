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
public class AddressDto {
    private Long id;
    private String addressLabel;
    private String addressLine1;
    private String addressLine2;
    private String landmark;
    private String pincode;
    private Long cityId;
    private String cityName; // For display
    private Long zoneId;
    private String zoneName; // For display
    private Long podId;
    private String podName; // For display
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Boolean isPrimary;
    private Boolean isDefault; // Alias for isPrimary for frontend compatibility
}
