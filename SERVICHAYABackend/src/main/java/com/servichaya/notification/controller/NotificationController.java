package com.servichaya.notification.controller;

import com.servichaya.common.response.ApiResponse;
import com.servichaya.notification.dto.NotificationDto;
import com.servichaya.notification.service.NotificationService;
import com.servichaya.notification.service.OneSignalService;
import lombok.Data;
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
    private final OneSignalService oneSignalService;

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

    @PostMapping("/onesignal/register")
    public ResponseEntity<ApiResponse<String>> registerOneSignalPlayer(
            @RequestBody OneSignalRegisterRequest request) {
        log.info("Registering OneSignal player for userId: {}, playerId: {}", request.getUserId(), request.getPlayerId());
        oneSignalService.registerPlayer(
                request.getUserId(),
                request.getPlayerId(),
                request.getDeviceType(),
                request.getBrowser()
        );
        return ResponseEntity.ok(ApiResponse.success("OneSignal player registered", "Registered"));
    }

    @PostMapping("/onesignal/unregister")
    public ResponseEntity<ApiResponse<String>> unregisterOneSignalPlayer(
            @RequestParam String playerId) {
        log.info("Unregistering OneSignal player: {}", playerId);
        oneSignalService.unregisterPlayer(playerId);
        return ResponseEntity.ok(ApiResponse.success("OneSignal player unregistered", "Unregistered"));
    }

    @Data
    static class OneSignalRegisterRequest {
        private Long userId;
        private String playerId;
        private String deviceType;
        private String browser;
    }
}
