package com.servichaya.notification.repository;

import com.servichaya.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.userType = :userType ORDER BY n.createdAt DESC")
    Page<Notification> findByUserIdAndUserType(@Param("userId") Long userId, @Param("userType") String userType, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.userType = :userType AND n.isRead = false")
    Long countUnreadByUserIdAndUserType(@Param("userId") Long userId, @Param("userType") String userType);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.userType = :userType AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUserIdAndUserType(@Param("userId") Long userId, @Param("userType") String userType);
}
