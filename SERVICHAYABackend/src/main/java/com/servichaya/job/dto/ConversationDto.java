package com.servichaya.job.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for conversation list
 * A conversation is identified by (jobId, customerId, providerId)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {
    private Long conversationId; // Unique ID: jobId_customerId_providerId hash or composite key
    private Long jobId;
    private String jobTitle;
    private String jobCode;
    private Long customerId;
    private String customerName;
    private Long providerId;
    private String providerName;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;
    private String jobStatus;
}
