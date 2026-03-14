package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Job Conversation Entity
 * Stores conversation metadata between customer and provider for a job
 * Separates conversation metadata from messages for better performance
 */
@Entity
@Table(name = "job_conversation",
       indexes = {
           @Index(name = "idx_job_conversation_job", columnList = "job_id"),
           @Index(name = "idx_job_conversation_customer", columnList = "customer_id"),
           @Index(name = "idx_job_conversation_provider", columnList = "service_provider_id"),
           @Index(name = "idx_job_conversation_unique", columnList = "job_id, customer_id, service_provider_id", unique = true)
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobConversation extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "service_provider_id", nullable = false)
    private Long serviceProviderId;

    /**
     * Unread message count for customer
     */
    @Column(name = "unread_count_customer", nullable = false)
    @Builder.Default
    private Long unreadCountCustomer = 0L;

    /**
     * Unread message count for service provider
     */
    @Column(name = "unread_count_service_provider", nullable = false)
    @Builder.Default
    private Long unreadCountServiceProvider = 0L;

    /**
     * Last message content (preview)
     */
    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;

    /**
     * Timestamp of last message
     */
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    /**
     * ID of the last message sender (customerId or providerUserId)
     */
    @Column(name = "last_message_sender_id")
    private Long lastMessageSenderId;

    /**
     * Type of last message sender: CUSTOMER or PROVIDER
     */
    @Column(name = "last_message_sender_type", length = 50)
    private String lastMessageSenderType;

    /**
     * Whether customer has muted this conversation
     */
    @Column(name = "customer_muted")
    @Builder.Default
    private Boolean customerMuted = false;

    /**
     * Whether provider has muted this conversation
     */
    @Column(name = "provider_muted")
    @Builder.Default
    private Boolean providerMuted = false;
}
