package com.servichaya.job.dto;

import java.time.LocalDateTime;

/**
 * Projection interface for native SQL conversation query results
 */
public interface ConversationProjection {
    Long getConversationId(); // Added for provider conversations
    Long getJobId();
    String getJobTitle();
    String getJobCode();
    Long getCustomerId();
    String getCustomerName();
    Long getProviderId();
    String getProviderName();
    String getLastMessage();
    LocalDateTime getLastMessageTime();
    Long getUnreadCount();
    String getJobStatus();
}
