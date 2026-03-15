package com.servichaya.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servichaya.notification.entity.OneSignalPlayer;
import com.servichaya.notification.repository.OneSignalPlayerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OneSignalService {

    private final OneSignalPlayerRepository playerRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OneSignalService(OneSignalPlayerRepository playerRepository, RestTemplate restTemplate) {
        this.playerRepository = playerRepository;
        this.restTemplate = restTemplate;
    }

    @Value("${onesignal.app.id:07f9fc72-b60b-419a-87ca-13a87bb97c72}")
    private String oneSignalAppId;

    @Value("${onesignal.rest.api.key:os_v2_app_a747y4vwbnazvb6kcouhxol4ol73iqszmqnejaffquhqctpsa5g4ddij6c2kspiq5t4uzqukx2vskdxufg5ixihlotga6bpib2dvvoy}")
    private String oneSignalRestApiKey;

    @Value("${onesignal.base.url:https://onesignal.com/api/v1}")
    private String oneSignalBaseUrl;

    /**
     * Send browser push notification to a specific user
     */
    public void sendNotificationToUser(Long userId, String title, String message, String actionUrl) {
        log.info("Sending OneSignal notification to userId: {}, title: {}", userId, title);
        
        if (oneSignalRestApiKey == null || oneSignalRestApiKey.isEmpty()) {
            log.warn("OneSignal REST API key not configured. Skipping push notification.");
            return;
        }

        List<OneSignalPlayer> players = playerRepository.findByUserIdAndIsActiveTrue(userId);
        if (players.isEmpty()) {
            log.info("No active OneSignal players found for userId: {}", userId);
            return;
        }

        List<String> playerIds = players.stream()
                .map(OneSignalPlayer::getPlayerId)
                .collect(Collectors.toList());

        sendNotificationToPlayers(playerIds, title, message, actionUrl);
    }

    /**
     * Send browser push notification to multiple player IDs
     */
    public void sendNotificationToPlayers(List<String> playerIds, String title, String message, String actionUrl) {
        if (playerIds == null || playerIds.isEmpty()) {
            log.warn("No player IDs provided for OneSignal notification");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("app_id", oneSignalAppId);
            payload.put("include_player_ids", playerIds);
            
            Map<String, Object> contents = new HashMap<>();
            contents.put("en", message);
            payload.put("contents", contents);
            
            Map<String, Object> headings = new HashMap<>();
            headings.put("en", title);
            payload.put("headings", headings);
            
            if (actionUrl != null && !actionUrl.isEmpty()) {
                Map<String, Object> data = new HashMap<>();
                data.put("actionUrl", actionUrl);
                payload.put("data", data);
                
                // Add URL for web push
                payload.put("url", actionUrl);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + oneSignalRestApiKey);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            
            String url = oneSignalBaseUrl + "/notifications";
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("OneSignal notification sent successfully to {} players", playerIds.size());
            } else {
                log.error("Failed to send OneSignal notification. Status: {}, Response: {}", 
                        response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Error sending OneSignal notification", e);
        }
    }

    /**
     * Register or update a OneSignal player ID for a user
     */
    public void registerPlayer(Long userId, String playerId, String deviceType, String browser) {
        log.info("Registering OneSignal player for userId: {}, playerId: {}", userId, playerId);
        
        OneSignalPlayer existing = playerRepository.findByPlayerId(playerId)
                .orElse(null);

        if (existing != null) {
            // Update existing player
            existing.setUserId(userId);
            existing.setDeviceType(deviceType);
            existing.setBrowser(browser);
            existing.setIsActive(true);
            playerRepository.save(existing);
            log.info("Updated existing OneSignal player for userId: {}", userId);
        } else {
            // Create new player
            OneSignalPlayer player = OneSignalPlayer.builder()
                    .userId(userId)
                    .playerId(playerId)
                    .deviceType(deviceType != null ? deviceType : "WEB")
                    .browser(browser)
                    .isActive(true)
                    .build();
            playerRepository.save(player);
            log.info("Registered new OneSignal player for userId: {}", userId);
        }
    }

    /**
     * Unregister a OneSignal player ID
     */
    public void unregisterPlayer(String playerId) {
        log.info("Unregistering OneSignal player: {}", playerId);
        playerRepository.deleteByPlayerId(playerId);
    }
}
