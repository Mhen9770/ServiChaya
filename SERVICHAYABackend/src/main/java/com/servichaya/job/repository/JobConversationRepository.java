package com.servichaya.job.repository;

import com.servichaya.job.dto.ConversationProjection;
import com.servichaya.job.entity.JobConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobConversationRepository extends JpaRepository<JobConversation, Long> {

    /**
     * Find conversation by job, customer, and provider
     */
    Optional<JobConversation> findByJobIdAndCustomerIdAndServiceProviderId(
            Long jobId, Long customerId, Long serviceProviderId);

    /**
     * Find all conversations for a customer
     */
    @Query("SELECT c FROM JobConversation c WHERE c.customerId = :customerId " +
           "AND (c.isDeleted IS NULL OR c.isDeleted = false) " +
           "ORDER BY c.lastMessageAt DESC")
    List<JobConversation> findByCustomerId(@Param("customerId") Long customerId);

    /**
     * Find all conversations for a provider
     */
    @Query("SELECT c FROM JobConversation c WHERE c.serviceProviderId = :serviceProviderId " +
           "AND (c.isDeleted IS NULL OR c.isDeleted = false) " +
           "ORDER BY c.lastMessageAt DESC")
    List<JobConversation> findByServiceProviderId(@Param("serviceProviderId") Long serviceProviderId);

    /**
     * Find conversations for a specific job
     */
    @Query("SELECT c FROM JobConversation c WHERE c.jobId = :jobId " +
           "AND (c.isDeleted IS NULL OR c.isDeleted = false)")
    List<JobConversation> findByJobId(@Param("jobId") Long jobId);

    /**
     * Find conversation by job and provider (for provider to get their conversation)
     */
    @Query("SELECT c FROM JobConversation c WHERE c.jobId = :jobId " +
           "AND c.serviceProviderId = :serviceProviderId " +
           "AND (c.isDeleted IS NULL OR c.isDeleted = false)")
    Optional<JobConversation> findByJobIdAndServiceProviderId(
            @Param("jobId") Long jobId, 
            @Param("serviceProviderId") Long serviceProviderId);

    /**
     * Increment unread count for customer
     */
    @Modifying
    @Query("UPDATE JobConversation c SET c.unreadCountCustomer = c.unreadCountCustomer + 1 " +
           "WHERE c.id = :conversationId")
    void incrementCustomerUnreadCount(@Param("conversationId") Long conversationId);

    /**
     * Increment unread count for provider
     */
    @Modifying
    @Query("UPDATE JobConversation c SET c.unreadCountServiceProvider = c.unreadCountServiceProvider + 1 " +
           "WHERE c.id = :conversationId")
    void incrementProviderUnreadCount(@Param("conversationId") Long conversationId);

    /**
     * Reset unread count for customer
     */
    @Modifying
    @Query("UPDATE JobConversation c SET c.unreadCountCustomer = 0 " +
           "WHERE c.id = :conversationId")
    void resetCustomerUnreadCount(@Param("conversationId") Long conversationId);

    /**
     * Reset unread count for provider
     */
    @Modifying
    @Query("UPDATE JobConversation c SET c.unreadCountServiceProvider = 0 " +
           "WHERE c.id = :conversationId")
    void resetProviderUnreadCount(@Param("conversationId") Long conversationId);

    /**
     * Get conversations for a customer using native SQL (optimized - uses conversation table)
     * Returns distinct conversations with latest message info and unread count
     */
    @Query(value = """
        SELECT 
            jc.id AS conversationId,
            jc.job_id AS jobId,
            jm.title AS jobTitle,
            jm.job_code AS jobCode,
            jc.customer_id AS customerId,
            COALESCE(ua.full_name, 
                TRIM(CONCAT(COALESCE(ua.first_name, ''), ' ', COALESCE(ua.last_name, '')))) AS customerName,
            jc.service_provider_id AS providerId,
            CASE 
                WHEN spp.provider_type = 'INDIVIDUAL' THEN 
                    CONCAT('Provider ', COALESCE(spp.provider_code, ''))
                ELSE 
                    COALESCE(spp.business_name, 'Provider')
            END AS providerName,
            jc.last_message AS lastMessage,
            jc.last_message_at AS lastMessageTime,
            COALESCE(jc.unread_count_customer, 0) AS unreadCount,
            jm.status AS jobStatus
        FROM job_conversation jc
        INNER JOIN job_master jm ON jm.id = jc.job_id
        INNER JOIN user_account ua ON ua.id = jc.customer_id
        INNER JOIN service_provider_profile spp ON spp.id = jc.service_provider_id
        WHERE jc.customer_id = :customerId
          AND COALESCE(jc.is_deleted, FALSE) = FALSE
          AND COALESCE(jm.is_deleted, FALSE) = FALSE
          AND COALESCE(spp.is_deleted, FALSE) = FALSE
        ORDER BY jc.last_message_at DESC
        """, nativeQuery = true)
    List<ConversationProjection> findCustomerConversationsNative(@Param("customerId") Long customerId);

    /**
     * Get conversations for a provider using native SQL (optimized - uses conversation table)
     * Returns distinct conversations with latest message info and unread count
     */
    @Query(value = """
        SELECT 
            jc.id AS conversationId,
            jc.job_id AS jobId,
            jm.title AS jobTitle,
            jm.job_code AS jobCode,
            jc.customer_id AS customerId,
            COALESCE(ua.full_name, 
                TRIM(CONCAT(COALESCE(ua.first_name, ''), ' ', COALESCE(ua.last_name, '')))) AS customerName,
            jc.service_provider_id AS providerId,
            CASE 
                WHEN spp.provider_type = 'INDIVIDUAL' THEN 
                    CONCAT('Provider ', COALESCE(spp.provider_code, ''))
                ELSE 
                    COALESCE(spp.business_name, 'Provider')
            END AS providerName,
            jc.last_message AS lastMessage,
            jc.last_message_at AS lastMessageTime,
            COALESCE(jc.unread_count_service_provider, 0) AS unreadCount,
            jm.status AS jobStatus
        FROM job_conversation jc
        INNER JOIN job_master jm ON jm.id = jc.job_id
        INNER JOIN user_account ua ON ua.id = jc.customer_id
        INNER JOIN service_provider_profile spp ON spp.id = jc.service_provider_id
        WHERE jc.service_provider_id = :serviceProviderId
          AND COALESCE(jc.is_deleted, FALSE) = FALSE
          AND COALESCE(jm.is_deleted, FALSE) = FALSE
          AND COALESCE(spp.is_deleted, FALSE) = FALSE
        ORDER BY jc.last_message_at DESC
        """, nativeQuery = true)
    List<ConversationProjection> findProviderConversationsNative(@Param("serviceProviderId") Long serviceProviderId);
}
