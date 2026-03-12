package com.servichaya.notification.repository;

import com.servichaya.notification.entity.OneSignalPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OneSignalPlayerRepository extends JpaRepository<OneSignalPlayer, Long> {
    Optional<OneSignalPlayer> findByPlayerId(String playerId);
    List<OneSignalPlayer> findByUserIdAndIsActiveTrue(Long userId);
    void deleteByPlayerId(String playerId);
}
