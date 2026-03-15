package com.servichaya.job.controller;

import com.servichaya.auth.service.JwtService;
import com.servichaya.common.response.ApiResponse;
import com.servichaya.job.dto.ConversationDto;
import com.servichaya.job.dto.JobMessageDto;
import com.servichaya.job.dto.SendMessageRequestDto;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.entity.JobMessage;
import com.servichaya.job.service.JobMessagingService;
import com.servichaya.job.service.JobMessageAttachmentService;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.provider.entity.ServiceProviderProfile;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Job Messaging Controller
 * Handles chat/messaging between customers and providers for jobs
 */
@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobMessagingController {

    private final JobMessagingService messagingService;
    private final JobMessageAttachmentService attachmentService;
    private final JwtService jwtService;
    private final ServiceProviderProfileRepository providerRepository;
    private final JobMasterRepository jobRepository;

    /**
     * Upload file attachment for job message
     */
    @PostMapping("/{jobId}/messages/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAttachment(
            @PathVariable Long jobId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        log.info("Uploading attachment for jobId: {}", jobId);

        try {
            String fileUrl = attachmentService.uploadFile(file);
            String attachmentType = attachmentService.getAttachmentType(file.getContentType());

            Map<String, String> response = new java.util.HashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("attachmentType", attachmentType);
            response.put("fileName", file.getOriginalFilename());

            return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
        } catch (IllegalArgumentException e) {
            log.error("Invalid file: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to upload file. Please try again."));
        }
    }

    /**
     * Serve attachment file
     */
    @GetMapping("/messages/attachments/{filename}")
    public ResponseEntity<Resource> getAttachment(@PathVariable String filename) {
        log.info("Serving attachment: {}", filename);

        try {
            Path filePath = Paths.get(attachmentService.getAttachmentsPath())
                    .resolve(filename)
                    .normalize();

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = "application/octet-stream";
                try {
                    contentType = java.nio.file.Files.probeContentType(filePath);
                    if (contentType == null) {
                        contentType = "application/octet-stream";
                    }
                } catch (IOException e) {
                    log.warn("Could not determine content type for {}", filename);
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            log.error("Error serving attachment: {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Send a message in job chat
     */
    @PostMapping("/{jobId}/messages")
    public ResponseEntity<ApiResponse<JobMessageDto>> sendMessage(
            @PathVariable Long jobId,
            @Valid @RequestBody SendMessageRequestDto requestDto,
            HttpServletRequest request) {
        log.info("Sending message for jobId: {}", jobId);

        Long senderId = extractUserIdFromToken(request);
        String senderType = determineSenderType(jobId, senderId);

        try {
            JobMessage message = messagingService.sendMessage(
                    jobId,
                    senderId,
                    senderType,
                    requestDto.getMessage(),
                    requestDto.getAttachmentUrl(),
                    requestDto.getAttachmentType()
            );

            JobMessageDto dto = convertToDto(message, senderId);
            return ResponseEntity.ok(ApiResponse.success("Message sent successfully", dto));
        } catch (RuntimeException e) {
            log.error("Error sending message: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get messages for a job (paginated)
     */
    @GetMapping("/{jobId}/messages")
    public ResponseEntity<ApiResponse<Page<JobMessageDto>>> getMessages(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        log.info("Fetching messages for jobId: {}, page: {}, size: {}", jobId, page, size);

        Long userId = extractUserIdFromToken(request);

        Page<JobMessage> messages = messagingService.getMessages(jobId, page, size);
        Page<JobMessageDto> dtos = messages.map(msg -> convertToDto(msg, userId));

        return ResponseEntity.ok(ApiResponse.success("Messages fetched successfully", dtos));
    }

    /**
     * Get messages between customer and a specific provider
     * @param providerId Provider profile ID (not user ID)
     * @deprecated Use /conversations/{conversationId}/messages instead
     */
    @Deprecated
    @GetMapping("/{jobId}/messages/with/{providerId}")
    public ResponseEntity<ApiResponse<List<JobMessageDto>>> getMessagesWithProvider(
            @PathVariable Long jobId,
            @PathVariable Long providerId,
            HttpServletRequest request) {
        log.info("Fetching messages between customer and provider {} for job {}", providerId, jobId);

        Long userId = extractUserIdFromToken(request);
        
        // Try to get conversation ID first
        Optional<Long> conversationIdOpt = messagingService.getConversationIdForJobAndProvider(jobId, providerId);
        
        if (conversationIdOpt.isPresent()) {
            // Use new conversation-based endpoint
            Long conversationId = conversationIdOpt.get();
            Page<JobMessage> messagesPage = messagingService.getConversationMessages(conversationId, 0, 100);
            List<JobMessageDto> dtos = messagesPage.getContent().stream()
                    .map(msg -> convertToDto(msg, userId))
                    .collect(Collectors.toList());
            Collections.reverse(dtos); // Reverse to show oldest first
            
            return ResponseEntity.ok(ApiResponse.success("Messages fetched successfully", dtos));
        }
        
        // Fallback to old method if conversation doesn't exist yet
        String userType = determineSenderType(jobId, userId);
        Long customerId = null;
        
        if ("CUSTOMER".equals(userType)) {
            customerId = userId;
        } else {
            // Provider requesting - get customer ID from job
            JobMaster job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found"));
            customerId = job.getCustomerId();
        }

        List<JobMessage> messages = messagingService.getMessagesBetweenCustomerAndProvider(
                jobId, customerId, providerId);
        List<JobMessageDto> dtos = messages.stream()
                .map(msg -> convertToDto(msg, userId))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Messages fetched successfully", dtos));
    }

    /**
     * Get conversation ID for a job and provider
     * Used by provider job detail page to get conversationId
     */
    @GetMapping("/{jobId}/conversation")
    public ResponseEntity<ApiResponse<Long>> getConversationId(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Getting conversation ID for jobId: {}", jobId);

        Long userId = extractUserIdFromToken(request);
        
        // Get provider profile
        ServiceProviderProfile provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        Long providerProfileId = provider.getId();

        Optional<Long> conversationId = messagingService.getConversationIdForJobAndProvider(jobId, providerProfileId);
        
        if (conversationId.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("Conversation ID fetched successfully", conversationId.get()));
        } else {
            return ResponseEntity.ok(ApiResponse.success("No conversation found", null));
        }
    }

    /**
     * Mark messages as read
     */
    @PutMapping("/{jobId}/messages/read")
    public ResponseEntity<ApiResponse<String>> markMessagesAsRead(
            @PathVariable Long jobId,
            HttpServletRequest request) {
        log.info("Marking messages as read for jobId: {}", jobId);

        Long userId = extractUserIdFromToken(request);
        messagingService.markMessagesAsRead(jobId, userId);

        return ResponseEntity.ok(ApiResponse.success("Messages marked as read", "Success"));
    }

    /**
     * Convert JobMessage entity to DTO
     */
    private JobMessageDto convertToDto(JobMessage message, Long currentUserId) {
        String senderName = "You";
        if (!message.getSenderId().equals(currentUserId)) {
            if ("PROVIDER".equals(message.getSenderType())) {
                final String[] providerName = new String[1];
                providerName[0] = "Provider";
                providerRepository.findById(message.getSenderId())
                        .ifPresent(provider -> {
                            if ("INDIVIDUAL".equals(provider.getProviderType())) {
                                providerName[0] = provider.getProviderCode() != null 
                                        ? "Provider " + provider.getProviderCode() 
                                        : "Provider";
                            } else {
                                providerName[0] = provider.getBusinessName() != null 
                                        ? provider.getBusinessName() 
                                        : "Provider";
                            }
                        });
                senderName = providerName[0];
            } else {
                senderName = "Customer";
            }
        }

        return JobMessageDto.builder()
                .id(message.getId())
                .jobId(message.getJobId())
                .senderId(message.getSenderId())
                .senderType(message.getSenderType())
                .senderName(senderName)
                .message(message.getMessage())
                .attachmentUrl(message.getAttachmentUrl())
                .attachmentType(message.getAttachmentType())
                .status(message.getStatus())
                .isFlagged(message.getIsFlagged())
                .flagReason(message.getFlagReason())
                .createdAt(message.getCreatedAt())
                .build();
    }

    /**
     * Determine sender type (CUSTOMER or PROVIDER) based on job ownership
     */
    private String determineSenderType(Long jobId, Long userId) {
        // This is a simplified check - in production, verify against job.customerId and provider profile
        // For now, we'll check if userId matches a provider profile
        if (providerRepository.findByUserId(userId).isPresent()) {
            return "PROVIDER";
        }
        return "CUSTOMER";
    }

    /**
     * Get conversations list for current user (customer or provider)
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getConversations(HttpServletRequest request) {
        log.info("Fetching conversations for user");

        Long userId = extractUserIdFromToken(request);
        String userType = determineSenderType(null, userId); // Simplified check

        List<ConversationDto> conversations;
        if ("PROVIDER".equals(userType)) {
            conversations = messagingService.getProviderConversations(userId);
        } else {
            conversations = messagingService.getCustomerConversations(userId);
        }

        return ResponseEntity.ok(ApiResponse.success("Conversations fetched successfully", conversations));
    }

    /**
     * Get paginated messages for a specific conversation
     * Conversation is identified by conversationId
     * Supports pagination for scrolling up to load older messages
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<Page<JobMessageDto>>> getConversationMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        log.info("Fetching messages for conversation: conversationId={}, page={}, size={}", 
                conversationId, page, size);

        Long userId = extractUserIdFromToken(request);
        
        // Get paginated messages (ordered DESC - newest first)
        Page<JobMessage> messagesPage = messagingService.getConversationMessages(
                conversationId, page, size);
        
        // Convert to DTOs and reverse order for frontend (oldest first)
        List<JobMessageDto> dtos = messagesPage.getContent().stream()
                .map(msg -> convertToDto(msg, userId))
                .collect(Collectors.toList());
        Collections.reverse(dtos); // Reverse to show oldest first
        
        // Create new Page with reversed content
        Page<JobMessageDto> reversedPage = new org.springframework.data.domain.PageImpl<>(
                dtos, 
                messagesPage.getPageable(), 
                messagesPage.getTotalElements());

        // Mark conversation as read
        try {
            String userType = determineSenderType(null, userId);
            messagingService.markConversationAsRead(conversationId, userType);
        } catch (Exception e) {
            log.warn("Failed to mark conversation as read: {}", e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success("Messages fetched successfully", reversedPage));
    }

    private Long extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized: Missing or invalid token");
        }

        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}
