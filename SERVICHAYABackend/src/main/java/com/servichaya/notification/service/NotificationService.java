package com.servichaya.notification.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servichaya.notification.dto.NotificationDto;
import com.servichaya.notification.entity.Notification;
import com.servichaya.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final OneSignalService oneSignalService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public NotificationDto createNotification(Long userId, String userType, String notificationType,
                                              String title, String message, String relatedEntityType,
                                              Long relatedEntityId, String actionUrl, Map<String, Object> metadata) {
        log.info("Creating notification for userId: {}, userType: {}, type: {}", userId, userType, notificationType);

        String metadataJson = null;
        if (metadata != null && !metadata.isEmpty()) {
            try {
                metadataJson = objectMapper.writeValueAsString(metadata);
            } catch (Exception e) {
                log.error("Error serializing notification metadata", e);
            }
        }

        Notification notification = Notification.builder()
                .userId(userId)
                .userType(userType)
                .notificationType(notificationType)
                .title(title)
                .message(message)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .actionUrl(actionUrl)
                .metadata(metadataJson)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification created with id: {}", notification.getId());

        // Send browser push notification via OneSignal
        try {
            oneSignalService.sendNotificationToUser(userId, title, message, actionUrl);
        } catch (Exception e) {
            log.error("Failed to send OneSignal notification for userId: {}", userId, e);
            // Don't fail the notification creation if push fails
        }

        return mapToDto(notification);
    }

    public Page<NotificationDto> getUserNotifications(Long userId, String userType, Pageable pageable) {
        log.info("Fetching notifications for userId: {}, userType: {}", userId, userType);
        return notificationRepository.findByUserIdAndUserType(userId, userType, pageable)
                .map(this::mapToDto);
    }

    public Long getUnreadCount(Long userId, String userType) {
        log.info("Fetching unread count for userId: {}, userType: {}", userId, userType);
        return notificationRepository.countUnreadByUserIdAndUserType(userId, userType);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        log.info("Marking notification {} as read for userId: {}", notificationId, userId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> {
                    log.error("Notification not found with id: {}", notificationId);
                    return new RuntimeException("Notification not found");
                });

        if (!notification.getUserId().equals(userId)) {
            log.error("User {} attempted to mark notification {} belonging to user {}", 
                    userId, notificationId, notification.getUserId());
            throw new RuntimeException("Unauthorized");
        }

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
        log.info("Notification {} marked as read", notificationId);
    }

    @Transactional
    public void markAllAsRead(Long userId, String userType) {
        log.info("Marking all notifications as read for userId: {}, userType: {}", userId, userType);
        List<Notification> unreadNotifications = notificationRepository.findUnreadByUserIdAndUserType(userId, userType);
        LocalDateTime now = LocalDateTime.now();
        unreadNotifications.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(now);
        });
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read", unreadNotifications.size());
    }

    private NotificationDto mapToDto(Notification notification) {
        Map<String, Object> metadata = new HashMap<>();
        if (notification.getMetadata() != null) {
            try {
                metadata = objectMapper.readValue(notification.getMetadata(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.error("Error deserializing notification metadata", e);
            }
        }

        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .userType(notification.getUserType())
                .notificationType(notification.getNotificationType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .actionUrl(notification.getActionUrl())
                .metadata(metadata)
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
