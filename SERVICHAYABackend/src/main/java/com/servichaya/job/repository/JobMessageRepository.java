package com.servichaya.job.repository;

import com.servichaya.job.dto.ConversationProjection;
import com.servichaya.job.entity.JobMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobMessageRepository extends JpaRepository<JobMessage, Long> {

    /**
     * Find all messages for a job, ordered by creation time
     */
    @Query("SELECT m FROM JobMessage m WHERE m.jobId = :jobId ORDER BY m.createdAt ASC")
    Page<JobMessage> findMessagesByJobId(@Param("jobId") Long jobId, Pageable pageable);

    /**
     * Find messages between customer and a specific provider for a job
     */
    @Query("SELECT m FROM JobMessage m WHERE m.jobId = :jobId AND " +
           "((m.senderId = :customerId AND m.senderType = 'CUSTOMER') OR " +
           "(m.senderId = :providerId AND m.senderType = 'PROVIDER')) " +
           "ORDER BY m.createdAt ASC")
    List<JobMessage> findMessagesBetweenCustomerAndProvider(
            @Param("jobId") Long jobId,
            @Param("customerId") Long customerId,
            @Param("providerId") Long providerId);

    /**
     * Count unread messages for a user
     */
    @Query("SELECT COUNT(m) FROM JobMessage m WHERE m.jobId = :jobId AND " +
           "m.senderId != :userId AND m.status != 'READ'")
    long countUnreadMessages(@Param("jobId") Long jobId, @Param("userId") Long userId);

    /**
     * Find latest message for each provider in a job
     */
    @Query("SELECT m FROM JobMessage m WHERE m.jobId = :jobId AND m.senderType = 'PROVIDER' " +
           "AND m.id IN (SELECT MAX(m2.id) FROM JobMessage m2 WHERE m2.jobId = :jobId GROUP BY m2.senderId)")
    List<JobMessage> findLatestProviderMessages(@Param("jobId") Long jobId);

    /**
     * Find distinct conversations for a customer (grouped by jobId and providerId)
     */
    @Query("SELECT DISTINCT m.jobId, m.senderId FROM JobMessage m " +
           "WHERE m.jobId IN (SELECT j.id FROM JobMaster j WHERE j.customerId = :customerId) " +
           "AND m.senderType = 'PROVIDER'")
    List<Object[]> findCustomerConversations(@Param("customerId") Long customerId);

    /**
     * Find distinct conversations for a provider (grouped by jobId and customerId)
     */
    @Query("SELECT DISTINCT m.jobId, m.senderId FROM JobMessage m " +
           "WHERE m.jobId IN (SELECT j.id FROM JobMaster j WHERE j.providerId = :providerId OR j.id IN " +
           "(SELECT jpm.jobId FROM JobProviderMatch jpm WHERE jpm.providerId = :providerId)) " +
           "AND m.senderType = 'CUSTOMER'")
    List<Object[]> findProviderConversations(@Param("providerId") Long providerId);

    /**
     * Get last N messages for a conversation (jobId, customerId, providerUserId)
     */
    @Query(value = "SELECT m FROM JobMessage m WHERE m.jobId = :jobId AND " +
           "((m.senderId = :customerId AND m.senderType = 'CUSTOMER') OR " +
           "(m.senderId = :providerUserId AND m.senderType = 'PROVIDER')) " +
           "ORDER BY m.createdAt DESC")
    Page<JobMessage> findLastMessagesForConversation(
            @Param("jobId") Long jobId,
            @Param("customerId") Long customerId,
            @Param("providerUserId") Long providerUserId,
            Pageable pageable);

    /**
     * Count unread messages for a conversation
     */
    @Query("SELECT COUNT(m) FROM JobMessage m WHERE m.jobId = :jobId AND " +
           "((m.senderId = :customerId AND m.senderType = 'CUSTOMER') OR " +
           "(m.senderId = :providerUserId AND m.senderType = 'PROVIDER')) " +
           "AND m.senderId != :userId AND m.status != 'READ'")
    long countUnreadMessagesForConversation(
            @Param("jobId") Long jobId,
            @Param("customerId") Long customerId,
            @Param("providerUserId") Long providerUserId,
            @Param("userId") Long userId);

    /**
     * Get paginated messages for a conversation by conversationId
     * Ordered by createdAt DESC (newest first) for pagination
     * Frontend should reverse to show oldest first
     */
    @Query("SELECT m FROM JobMessage m WHERE m.conversationId = :conversationId ORDER BY m.createdAt DESC")
    Page<JobMessage> findByConversationIdOrderByCreatedAtDesc(
            @Param("conversationId") Long conversationId,
            Pageable pageable);
}
