package com.servichaya.job.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for submitting/updating a provider bid
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitBidRequestDto {
    
    @NotNull(message = "Bid amount is required")
    @DecimalMin(value = "0.0", message = "Bid amount must be >= 0")
    private BigDecimal bidAmount;
    
    @DecimalMin(value = "0.0", message = "Proposed price must be >= 0")
    private BigDecimal proposedPrice;
    
    private String notes;
}
