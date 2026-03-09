package com.servichaya.payment.service;

import com.servichaya.common.service.ConfigService;
import com.servichaya.payment.repository.ProviderEarningsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayoutService {

    private final ProviderEarningsRepository earningsRepository;
    private final ConfigService configService;

    /**
     * Validate payout request - checks minimum withdrawal amount from business rules
     */
    public void validatePayoutRequest(Long providerId, BigDecimal amount) {
        log.info("Validating payout request for providerId: {}, amount: {}", providerId, amount);

        // Get minimum withdrawal from business rules
        BigDecimal minWithdrawal = configService.getMinWithdrawalAmount();
        if (amount.compareTo(minWithdrawal) < 0) {
            throw new RuntimeException(
                String.format("Minimum withdrawal amount is ₹%s. You requested ₹%s", 
                    minWithdrawal, amount));
        }

        // Get maximum withdrawal from business rules
        BigDecimal maxWithdrawal = configService.getMaxWithdrawalAmount();
        if (maxWithdrawal != null && amount.compareTo(maxWithdrawal) > 0) {
            throw new RuntimeException(
                String.format("Maximum withdrawal amount is ₹%s per transaction. You requested ₹%s", 
                    maxWithdrawal, amount));
        }

        // Check available balance
        BigDecimal availableBalance = getAvailableBalance(providerId);
        if (amount.compareTo(availableBalance) > 0) {
            throw new RuntimeException(
                String.format("Insufficient balance. Available: ₹%s, Requested: ₹%s", 
                    availableBalance, amount));
        }

        log.info("Payout request validated successfully");
    }

    /**
     * Get available balance for withdrawal (paid earnings only)
     */
    public BigDecimal getAvailableBalance(Long providerId) {
        BigDecimal totalEarnings = earningsRepository.getTotalEarningsByProviderId(providerId);
        BigDecimal pendingEarnings = earningsRepository.getPendingEarningsByProviderId(providerId);
        
        if (totalEarnings == null) totalEarnings = BigDecimal.ZERO;
        if (pendingEarnings == null) pendingEarnings = BigDecimal.ZERO;
        
        return totalEarnings.subtract(pendingEarnings);
    }

    /**
     * Get minimum withdrawal amount (for UI display)
     */
    public BigDecimal getMinimumWithdrawalAmount() {
        return configService.getMinWithdrawalAmount();
    }

    /**
     * Get maximum withdrawal amount (for UI display)
     */
    public BigDecimal getMaximumWithdrawalAmount() {
        return configService.getMaxWithdrawalAmount();
    }
}
