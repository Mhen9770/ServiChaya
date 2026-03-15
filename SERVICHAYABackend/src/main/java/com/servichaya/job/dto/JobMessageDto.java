package com.servichaya.job.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for job message response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobMessageDto {
    private Long id;
    private Long jobId;
    private Long senderId;
    private String senderType; // CUSTOMER or PROVIDER
    private String senderName; // Provider name or "You" for customer
    private String message;
    private String attachmentUrl;
    private String attachmentType;
    private String status; // SENT, DELIVERED, READ
    private Boolean isFlagged;
    private String flagReason;
    private LocalDateTime createdAt;
}
