package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Job Message Entity
 * Stores chat messages between customer and providers for a job
 */
@Entity
@Table(name = "job_message",
       indexes = {
           @Index(name = "idx_job_messages", columnList = "job_id, created_at"),
           @Index(name = "idx_sender_messages", columnList = "sender_id, sender_type"),
           @Index(name = "idx_conversation_messages", columnList = "conversation_id, created_at")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobMessage extends BaseEntity {

    /**
     * Reference to job conversation (for better query performance)
     */
    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    /**
     * Sender ID (customerId or providerId)
     */
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    /**
     * Sender type: CUSTOMER or PROVIDER
     */
    @Column(name = "sender_type", length = 50, nullable = false)
    private String senderType;

    /**
     * Message content
     * Validated to block contact details
     */
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    /**
     * Attachment URL (if any)
     * Allowed: images, PDFs, documents
     */
    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    /**
     * Attachment type: IMAGE, PDF, DOCUMENT, OTHER
     */
    @Column(name = "attachment_type", length = 50)
    private String attachmentType;

    /**
     * Message status: SENT, DELIVERED, READ
     */
    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "SENT";

    /**
     * Whether message was flagged for containing contact details
     */
    @Column(name = "is_flagged")
    @Builder.Default
    private Boolean isFlagged = false;

    /**
     * Flag reason if message was blocked
     */
    @Column(name = "flag_reason", length = 255)
    private String flagReason;
}
