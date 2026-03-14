package com.servichaya.job.service;

import com.servichaya.job.dto.ConversationDto;
import com.servichaya.job.entity.JobConversation;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.entity.JobMessage;
import com.servichaya.job.repository.JobConversationRepository;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.job.repository.JobMessageRepository;
import com.servichaya.matching.entity.JobProviderMatch;
import com.servichaya.matching.repository.JobProviderMatchRepository;
import com.servichaya.notification.service.NotificationService;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.user.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Job Messaging Service
 * Handles chat/messaging between customers and providers for jobs
 * Blocks contact details sharing in messages
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobMessagingService {

    private final JobMessageRepository messageRepository;
    private final JobConversationRepository conversationRepository;
    private final JobMasterRepository jobRepository;
    private final NotificationService notificationService;
    private final ServiceProviderProfileRepository providerRepository;
    private final JobProviderMatchRepository matchRepository;
    private final UserAccountRepository userAccountRepository;

    // Patterns to detect contact details
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "\\b(\\+?91[-\\s]?)?[6-9]\\d{9}\\b|\\b\\d{3}[-\\s]?\\d{3}[-\\s]?\\d{4}\\b"
    );
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
    );
    private static final Pattern URL_PATTERN = Pattern.compile(
            "\\b(https?://|www\\.)[\\w.-]+\\.[A-Za-z]{2,}(/\\S*)?\\b"
    );

    /**
     * Send a message in job chat
     */
    @Transactional
    public JobMessage sendMessage(Long jobId, Long senderId, String senderType, 
                                  String message, String attachmentUrl, String attachmentType) {
        log.info("Sending message for jobId: {}, senderId: {}, senderType: {}", jobId, senderId, senderType);

        // Validate job exists
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        // Validate sender type
        if (!"CUSTOMER".equals(senderType) && !"PROVIDER".equals(senderType)) {
            throw new RuntimeException("Invalid sender type: " + senderType);
        }

        // Validate sender authorization
        if ("CUSTOMER".equals(senderType) && !job.getCustomerId().equals(senderId)) {
            throw new RuntimeException("Unauthorized: Customer ID mismatch");
        }
        if ("PROVIDER".equals(senderType)) {
            // Check if provider is assigned OR matched to this job
            ServiceProviderProfile provider = providerRepository.findByUserId(senderId)
                    .orElseThrow(() -> new RuntimeException("Provider profile not found for userId: " + senderId));
            
            Long providerProfileId = provider.getId();
            boolean isAssigned = job.getProviderId() != null && job.getProviderId().equals(providerProfileId);
            boolean isMatched = matchRepository.findByJobIdAndProviderId(jobId, providerProfileId).isPresent();
            
            if (!isAssigned && !isMatched) {
                throw new RuntimeException("Unauthorized: Provider is not assigned or matched to this job");
            }
            
            log.info("Provider {} messaging for job {} (assigned: {}, matched: {})", 
                    senderId, jobId, isAssigned, isMatched);
        }

        // Validate and sanitize message
        ValidationResult validation = validateMessage(message);
        if (!validation.isValid()) {
            throw new RuntimeException("Message contains blocked content: " + validation.getReason());
        }

        // Get or create conversation
        Long customerId = job.getCustomerId();
        Long serviceProviderId = null;
        Long recipientUserId = null;
        
        if ("CUSTOMER".equals(senderType)) {
            // Customer sending - need to determine provider
            if (job.getProviderId() != null) {
                serviceProviderId = job.getProviderId();
                ServiceProviderProfile provider = providerRepository.findById(serviceProviderId)
                        .orElseThrow(() -> new RuntimeException("Provider not found"));
                recipientUserId = provider.getUserId();
            } else {
                // Get first matched provider
                List<JobProviderMatch> matches = matchRepository.findByJobIdOrderByMatchScoreDesc(jobId);
                if (!matches.isEmpty()) {
                    serviceProviderId = matches.get(0).getProviderId();
                    ServiceProviderProfile provider = providerRepository.findById(serviceProviderId)
                            .orElseThrow(() -> new RuntimeException("Provider not found"));
                    recipientUserId = provider.getUserId();
                } else {
                    throw new RuntimeException("No provider available for this job");
                }
            }
        } else {
            // Provider sending
            ServiceProviderProfile provider = providerRepository.findByUserId(senderId)
                    .orElseThrow(() -> new RuntimeException("Provider profile not found"));
            serviceProviderId = provider.getId();
            recipientUserId = customerId;
        }

        // Get or create conversation
        JobConversation conversation = conversationRepository
                .findByJobIdAndCustomerIdAndServiceProviderId(jobId, customerId, serviceProviderId)
                .orElse(null);

        if (conversation == null) {
            // Create new conversation
            conversation = JobConversation.builder()
                    .jobId(jobId)
                    .customerId(customerId)
                    .serviceProviderId(serviceProviderId)
                    .unreadCountCustomer(0L)
                    .unreadCountServiceProvider(0L)
                    .build();
            conversation = conversationRepository.save(conversation);
            log.info("Created new conversation: conversationId={}", conversation.getId());
        }

        // Update conversation metadata
        String lastMessagePreview = message.length() > 200 ? message.substring(0, 197) + "..." : message;
        conversation.setLastMessage(lastMessagePreview);
        conversation.setLastMessageAt(java.time.LocalDateTime.now());
        conversation.setLastMessageSenderId(senderId);
        conversation.setLastMessageSenderType(senderType);

        // Increment unread count for recipient
        if ("CUSTOMER".equals(senderType)) {
            conversationRepository.incrementProviderUnreadCount(conversation.getId());
            conversation.setUnreadCountServiceProvider(conversation.getUnreadCountServiceProvider() + 1);
        } else {
            conversationRepository.incrementCustomerUnreadCount(conversation.getId());
            conversation.setUnreadCountCustomer(conversation.getUnreadCountCustomer() + 1);
        }
        conversation = conversationRepository.save(conversation);

        // Create message with conversation reference
        JobMessage jobMessage = JobMessage.builder()
                .conversationId(conversation.getId())
                .jobId(jobId)
                .senderId(senderId)
                .senderType(senderType)
                .message(message)
                .attachmentUrl(attachmentUrl)
                .attachmentType(attachmentType)
                .status("SENT")
                .isFlagged(false)
                .build();

        jobMessage = messageRepository.save(jobMessage);
        log.info("Message sent successfully: messageId={}, conversationId={}", jobMessage.getId(), conversation.getId());

        // Send push notification to recipient
        try {
            sendMessageNotification(job, senderId, senderType, message, jobMessage.getId(), recipientUserId);
        } catch (Exception e) {
            log.error("Failed to send message notification: {}", e.getMessage());
            // Don't fail message sending if notification fails
        }

        return jobMessage;
    }

    /**
     * Send push notification to the recipient when a new message is received
     */
    private void sendMessageNotification(JobMaster job, Long senderId, String senderType, 
                                        String message, Long messageId, Long recipientUserId) {
        try {
            if (recipientUserId == null) {
                log.warn("Recipient user ID is null, skipping notification");
                return;
            }

            String recipientType = "CUSTOMER".equals(senderType) ? "PROVIDER" : "CUSTOMER";
            String senderName = "Someone";

            if ("CUSTOMER".equals(senderType)) {
                senderName = "Customer";
            } else {
                // Get provider name
                ServiceProviderProfile providerProfile = providerRepository.findByUserId(senderId)
                        .orElse(null);
                if (providerProfile != null) {
                    if ("INDIVIDUAL".equals(providerProfile.getProviderType())) {
                        senderName = providerProfile.getProviderCode() != null 
                                ? "Provider " + providerProfile.getProviderCode() 
                                : "Provider";
                    } else {
                        senderName = providerProfile.getBusinessName() != null 
                                ? providerProfile.getBusinessName() 
                                : "Provider";
                    }
                }
            }

            // Truncate message for notification (max 100 chars)
            String notificationMessage = message.length() > 100 
                    ? message.substring(0, 97) + "..." 
                    : message;

            String title = "New message from " + senderName;
            String actionUrl = "/customer/jobs/" + job.getId() + "/select-provider";
            if ("PROVIDER".equals(recipientType)) {
                actionUrl = "/provider/jobs/" + job.getId();
            }

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("jobId", job.getId());
            metadata.put("jobCode", job.getJobCode());
            metadata.put("messageId", messageId);
            metadata.put("senderId", senderId);
            metadata.put("senderType", senderType);

            notificationService.createNotification(
                    recipientUserId,
                    recipientType,
                    "NEW_MESSAGE",
                    title,
                    notificationMessage,
                    "JOB_MESSAGE",
                    job.getId(),
                    actionUrl,
                    metadata
            );

            log.info("Message notification sent to {} (userId: {})", recipientType, recipientUserId);
        } catch (Exception e) {
            log.error("Error sending message notification", e);
        }
    }

    /**
     * Get messages for a job (paginated)
     */
    @Transactional(readOnly = true)
    public Page<JobMessage> getMessages(Long jobId, int page, int size) {
        log.info("Fetching messages for jobId: {}, page: {}, size: {}", jobId, page, size);

        // Validate job exists
        jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findMessagesByJobId(jobId, pageable);
    }

    /**
     * Get messages between customer and a specific provider
     * @param jobId Job ID
     * @param customerId Customer user ID
     * @param providerId Provider profile ID (not user ID)
     */
    @Transactional(readOnly = true)
    public List<JobMessage> getMessagesBetweenCustomerAndProvider(Long jobId, Long customerId, Long providerId) {
        log.info("Fetching messages between customer {} and provider {} for job {}", customerId, providerId, jobId);

        // providerId is provider profile ID, need to get user ID
        ServiceProviderProfile provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider profile not found: " + providerId));
        
        Long providerUserId = provider.getUserId();
        
        return messageRepository.findMessagesBetweenCustomerAndProvider(jobId, customerId, providerUserId);
    }

    /**
     * Mark messages as read
     */
    @Transactional
    public void markMessagesAsRead(Long jobId, Long userId) {
        log.info("Marking messages as read for jobId: {}, userId: {}", jobId, userId);

        // Get unread messages
        Page<JobMessage> messages = messageRepository.findMessagesByJobId(jobId, Pageable.unpaged());
        
        messages.getContent().stream()
                .filter(m -> !m.getSenderId().equals(userId) && !"READ".equals(m.getStatus()))
                .forEach(m -> {
                    m.setStatus("READ");
                    messageRepository.save(m);
                });
    }

    /**
     * Get conversations for a customer (optimized - uses native SQL with conversation table)
     * Returns list of conversations without loading all messages
     */
    @Transactional(readOnly = true)
    public List<ConversationDto> getCustomerConversations(Long customerId) {
        log.info("Fetching conversations for customerId: {}", customerId);

        // Use native SQL query for optimal performance
        List<com.servichaya.job.dto.ConversationProjection> projections = 
                conversationRepository.findCustomerConversationsNative(customerId);

        return projections.stream()
                .map(proj -> ConversationDto.builder()
                        .conversationId(proj.getConversationId())
                        .jobId(proj.getJobId())
                        .jobTitle(proj.getJobTitle())
                        .jobCode(proj.getJobCode())
                        .customerId(proj.getCustomerId())
                        .customerName(proj.getCustomerName())
                        .providerId(proj.getProviderId())
                        .providerName(proj.getProviderName())
                        .lastMessage(proj.getLastMessage())
                        .lastMessageTime(proj.getLastMessageTime())
                        .unreadCount(proj.getUnreadCount())
                        .jobStatus(proj.getJobStatus())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get conversations for a provider (optimized - uses native SQL with conversation table)
     * Returns list of conversations without loading all messages
     */
    @Transactional(readOnly = true)
    public List<ConversationDto> getProviderConversations(Long providerUserId) {
        log.info("Fetching conversations for provider userId: {}", providerUserId);

        // Get provider profile
        ServiceProviderProfile provider = providerRepository.findByUserId(providerUserId)
                .orElseThrow(() -> new RuntimeException("Provider not found: " + providerUserId));
        Long providerProfileId = provider.getId();

        // Use native SQL query for optimal performance
        List<com.servichaya.job.dto.ConversationProjection> projections = 
                conversationRepository.findProviderConversationsNative(providerProfileId);

        return projections.stream()
                .map(proj -> ConversationDto.builder()
                        .conversationId(proj.getConversationId())
                        .jobId(proj.getJobId())
                        .jobTitle(proj.getJobTitle())
                        .jobCode(proj.getJobCode())
                        .customerId(proj.getCustomerId())
                        .customerName(proj.getCustomerName())
                        .providerId(proj.getProviderId())
                        .providerName(proj.getProviderName())
                        .lastMessage(proj.getLastMessage())
                        .lastMessageTime(proj.getLastMessageTime())
                        .unreadCount(proj.getUnreadCount())
                        .jobStatus(proj.getJobStatus())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get conversation ID for a job and provider
     * Used by provider job detail page to load messages
     */
    @Transactional(readOnly = true)
    public Optional<Long> getConversationIdForJobAndProvider(Long jobId, Long providerProfileId) {
        log.info("Getting conversation ID for jobId: {}, providerProfileId: {}", jobId, providerProfileId);
        
        return conversationRepository.findByJobIdAndServiceProviderId(jobId, providerProfileId)
                .map(JobConversation::getId);
    }

    /**
     * Get paginated messages for a conversation
     * @param conversationId Conversation ID
     * @param page Page number (0-indexed)
     * @param size Page size (default 10)
     * @return Page of messages (ordered DESC - newest first, frontend should reverse to show oldest first)
     */
    @Transactional(readOnly = true)
    public Page<JobMessage> getConversationMessages(Long conversationId, int page, int size) {
        log.info("Fetching messages for conversation: conversationId={}, page={}, size={}", 
                conversationId, page, size);

        // Verify conversation exists
        JobConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);
    }

    /**
     * Get conversation by job, customer, and provider
     */
    @Transactional(readOnly = true)
    public Optional<JobConversation> getConversation(Long jobId, Long customerId, Long serviceProviderId) {
        return conversationRepository.findByJobIdAndCustomerIdAndServiceProviderId(
                jobId, customerId, serviceProviderId);
    }

    /**
     * Mark messages as read for a conversation
     */
    @Transactional
    public void markConversationAsRead(Long conversationId, String userType) {
        log.info("Marking conversation as read: conversationId={}, userType={}", conversationId, userType);

        JobConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        if ("CUSTOMER".equals(userType)) {
            conversationRepository.resetCustomerUnreadCount(conversationId);
            conversation.setUnreadCountCustomer(0L);
        } else if ("PROVIDER".equals(userType)) {
            conversationRepository.resetProviderUnreadCount(conversationId);
            conversation.setUnreadCountServiceProvider(0L);
        }

        conversationRepository.save(conversation);
    }

    /**
     * Helper to get provider name
     */
    private String getProviderName(ServiceProviderProfile provider) {
        if ("INDIVIDUAL".equals(provider.getProviderType())) {
            return provider.getProviderCode() != null ? "Provider " + provider.getProviderCode() : "Provider";
        } else {
            return provider.getBusinessName() != null ? provider.getBusinessName() : "Provider";
        }
    }

    /**
     * Validate message content - blocks contact details
     */
    private ValidationResult validateMessage(String message) {
        if (message == null || message.trim().isEmpty()) {
            return ValidationResult.invalid("Message cannot be empty");
        }

        // Check for phone numbers
        if (PHONE_PATTERN.matcher(message).find()) {
            return ValidationResult.invalid("Phone numbers are not allowed in messages");
        }

        // Check for email addresses
        if (EMAIL_PATTERN.matcher(message).find()) {
            return ValidationResult.invalid("Email addresses are not allowed in messages");
        }

        // Check for URLs (except attachment URLs which are handled separately)
        if (URL_PATTERN.matcher(message).find()) {
            return ValidationResult.invalid("URLs are not allowed in messages (use attachments instead)");
        }

        return ValidationResult.valid();
    }

    /**
     * Validation result helper
     */
    private static class ValidationResult {
        private final boolean valid;
        private final String reason;

        private ValidationResult(boolean valid, String reason) {
            this.valid = valid;
            this.reason = reason;
        }

        static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        static ValidationResult invalid(String reason) {
            return new ValidationResult(false, reason);
        }

        boolean isValid() {
            return valid;
        }

        String getReason() {
            return reason;
        }
    }
}
