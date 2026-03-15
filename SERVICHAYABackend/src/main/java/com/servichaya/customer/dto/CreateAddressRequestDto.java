package com.servichaya.customer.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 100, message = "Address label must not exceed 100 characters")
    private String addressLabel;
    
    @NotBlank(message = "Address line 1 is required")
    @Size(max = 255, message = "Address line 1 must not exceed 255 characters")
    private String addressLine1;
    
    @Size(max = 255, message = "Address line 2 must not exceed 255 characters")
    private String addressLine2;
    
    @Size(max = 255, message = "Landmark must not exceed 255 characters")
    private String landmark;
    
    @Size(max = 10, message = "Pincode must not exceed 10 characters")
    private String pincode;
    
    @NotNull(message = "City is required")
    private Long cityId;
    
    private Long zoneId;
    private Long podId;
    
    private BigDecimal latitude;
    private BigDecimal longitude;
    
    private Boolean isPrimary;
}
