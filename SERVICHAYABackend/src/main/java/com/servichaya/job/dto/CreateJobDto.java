package com.servichaya.job.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateJobDto {
    @NotNull(message = "Service category is required")
    private Long serviceCategoryId;
    
    private Long serviceSubCategoryId;
    private Long serviceSkillId;
    
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;
    
    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @NotNull(message = "Preferred time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
    private LocalDateTime preferredTime;
    
    private Boolean isEmergency;
    private BigDecimal estimatedBudget;
    
    @NotNull(message = "City is required")
    private Long cityId;
    
    private Long zoneId;
    private Long podId;
    
    @NotBlank(message = "Address line 1 is required")
    @Size(max = 500, message = "Address line 1 must not exceed 500 characters")
    private String addressLine1;
    
    @Size(max = 500, message = "Address line 2 must not exceed 500 characters")
    private String addressLine2;
    
    @Size(max = 10, message = "Pincode must not exceed 10 characters")
    private String pincode;
    
    private BigDecimal latitude;
    private BigDecimal longitude;
    
    @Size(max = 1000, message = "Special instructions must not exceed 1000 characters")
    private String specialInstructions;
    private List<AttachmentDto> attachments;
}
