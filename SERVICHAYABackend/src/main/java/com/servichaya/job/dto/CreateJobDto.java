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
public class CreateJobDto {
    private Long serviceCategoryId;
    private Long serviceSkillId;
    private String title;
    private String description;
    private LocalDateTime preferredTime;
    private Boolean isEmergency;
    private BigDecimal estimatedBudget;
    private Long cityId;
    private Long zoneId;
    private Long podId;
    private String addressLine1;
    private String addressLine2;
    private String pincode;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String specialInstructions;
    private List<AttachmentDto> attachments;
}
