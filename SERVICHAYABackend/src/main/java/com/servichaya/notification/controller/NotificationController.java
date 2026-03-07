package com.servichaya.notification.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.notification.dto.NotificationDto;
import com.servichaya.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getNotifications(
            @RequestParam Long userId,
            @RequestParam String userType,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Request to fetch notifications for userId: {}, userType: {}", userId, userType);
        Page<NotificationDto> notifications = notificationService.getUserNotifications(userId, userType, pageable);
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestParam Long userId,
            @RequestParam String userType) {
        log.info("Request to fetch unread count for userId: {}, userType: {}", userId, userType);
        Long count = notificationService.getUnreadCount(userId, userType);
        return ResponseEntity.ok(ApiResponse.success("Unread count fetched", count));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @PathVariable Long notificationId,
            @RequestParam Long userId) {
        log.info("Request to mark notification {} as read for userId: {}", notificationId, userId);
        notificationService.markAsRead(notificationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", "Read"));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(
            @RequestParam Long userId,
            @RequestParam String userType) {
        log.info("Request to mark all notifications as read for userId: {}, userType: {}", userId, userType);
        notificationService.markAllAsRead(userId, userType);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", "Read all"));
    }
}
