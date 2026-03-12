package com.servichaya.job.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Job State Machine - Validates and manages job status transitions
 * 
 * Valid transitions:
 * PENDING -> MATCHING -> MATCHED -> ACCEPTED -> IN_PROGRESS -> PAYMENT_PENDING -> COMPLETED
 * PENDING -> CANCELLED
 * MATCHING -> CANCELLED
 * MATCHED -> CANCELLED
 * ACCEPTED -> CANCELLED
 * IN_PROGRESS -> CANCELLED
 * PAYMENT_PENDING -> COMPLETED
 * 
 * Invalid transitions are blocked to maintain data integrity
 */
@Component
@Slf4j
public class JobStateMachine {

    // Define valid state transitions
    private static final Map<String, Set<String>> VALID_TRANSITIONS = new HashMap<>();
    
    static {
        VALID_TRANSITIONS.put("PENDING", Set.of("MATCHING", "CANCELLED", "CANCELLATION_PAYMENT_PENDING"));
        VALID_TRANSITIONS.put("MATCHING", Set.of("MATCHED", "CANCELLED", "PENDING", "CANCELLATION_PAYMENT_PENDING")); // Can go back to PENDING if no providers found
        VALID_TRANSITIONS.put("MATCHED", Set.of("PENDING_FOR_PAYMENT", "ACCEPTED", "CANCELLED", "MATCHING", "CANCELLATION_PAYMENT_PENDING")); // Can go to PENDING_FOR_PAYMENT if payment required, or ACCEPTED if POST_WORK
        VALID_TRANSITIONS.put("PENDING_FOR_PAYMENT", Set.of("ACCEPTED", "CANCELLED", "CANCELLATION_PAYMENT_PENDING")); // After payment, move to ACCEPTED
        VALID_TRANSITIONS.put("ACCEPTED", Set.of("IN_PROGRESS", "CANCELLED", "CANCELLATION_PAYMENT_PENDING"));
        VALID_TRANSITIONS.put("IN_PROGRESS", Set.of("PAYMENT_PENDING", "CANCELLED", "CANCELLATION_PAYMENT_PENDING"));
        VALID_TRANSITIONS.put("PAYMENT_PENDING", Set.of("COMPLETED", "CANCELLED", "CANCELLATION_PAYMENT_PENDING"));
        VALID_TRANSITIONS.put("CANCELLATION_PAYMENT_PENDING", Set.of("CANCELLED")); // After cancellation fee payment, move to CANCELLED
        VALID_TRANSITIONS.put("COMPLETED", Set.of()); // Terminal state
        VALID_TRANSITIONS.put("CANCELLED", Set.of()); // Terminal state
    }

    /**
     * Validate if transition from currentStatus to newStatus is allowed
     */
    public boolean isValidTransition(String currentStatus, String newStatus) {
        if (currentStatus == null || newStatus == null) {
            log.warn("Null status provided: currentStatus={}, newStatus={}", currentStatus, newStatus);
            return false;
        }
        
        if (currentStatus.equals(newStatus)) {
            return true; // Same state is always valid (idempotent)
        }
        
        Set<String> allowedTransitions = VALID_TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null) {
            log.warn("Unknown current status: {}", currentStatus);
            return false;
        }
        
        boolean isValid = allowedTransitions.contains(newStatus);
        if (!isValid) {
            log.warn("Invalid transition: {} -> {}. Allowed transitions from {}: {}", 
                    currentStatus, newStatus, currentStatus, allowedTransitions);
        }
        
        return isValid;
    }

    /**
     * Get all valid next states for a given current state
     */
    public Set<String> getValidNextStates(String currentStatus) {
        return VALID_TRANSITIONS.getOrDefault(currentStatus, Collections.emptySet());
    }

    /**
     * Check if status is a terminal state (cannot transition from)
     */
    public boolean isTerminalState(String status) {
        return "COMPLETED".equals(status) || "CANCELLED".equals(status);
    }

    /**
     * Check if status allows job modification
     */
    public boolean allowsModification(String status) {
        return "PENDING".equals(status) || "MATCHING".equals(status);
    }

    /**
     * Check if status allows cancellation
     */
    public boolean allowsCancellation(String status) {
        return !isTerminalState(status) && !"COMPLETED".equals(status);
    }

    /**
     * Validate transition and throw exception if invalid
     */
    public void validateTransition(String currentStatus, String newStatus) {
        if (!isValidTransition(currentStatus, newStatus)) {
            throw new RuntimeException(
                String.format("Invalid job status transition: %s -> %s. Valid next states: %s", 
                    currentStatus, newStatus, getValidNextStates(currentStatus))
            );
        }
    }
}
