package com.servichaya.job.dto;

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
public class JobDto {
    private Long id;
    private String jobCode;
    private Long customerId;
    private Long serviceCategoryId;
    private Long serviceSubCategoryId;
    private Long serviceSkillId;
    private String title;
    private String description;
    private LocalDateTime preferredTime;
    private Boolean isEmergency;
    private BigDecimal estimatedBudget;
    private BigDecimal finalPrice;
    private String status;
    private Long podId;
    private Long zoneId;
    private Long cityId;
    private String addressLine1;
    private String addressLine2;
    private String pincode;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Long providerId;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String specialInstructions;
    private List<AttachmentDto> attachments;
    private LocalDateTime createdAt;
}
