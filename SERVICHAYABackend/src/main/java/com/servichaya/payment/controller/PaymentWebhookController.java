package com.servichaya.payment.controller;

import com.servichaya.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * RazorPay Webhook Controller
 * Handles payment webhook callbacks from RazorPay
 */
@RestController
@RequestMapping("/payments/webhook")
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookController {

    private final PaymentService paymentService;

    /**
     * RazorPay webhook endpoint
     * Handles payment.success, payment.failed, order.paid events
     */
    @PostMapping("/razorpay")
    public ResponseEntity<String> handleRazorPayWebhook(
            @RequestBody Map<String, Object> webhookPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        
        log.info("Received RazorPay webhook: {}", webhookPayload);
        
        try {
            String event = (String) webhookPayload.get("event");
            Map<String, Object> payload = (Map<String, Object>) webhookPayload.get("payload");
            
            if (payload == null) {
                log.error("Invalid webhook payload structure");
                return ResponseEntity.badRequest().body("Invalid payload");
            }
            
            Map<String, Object> paymentEntity = (Map<String, Object>) payload.get("payment");
            Map<String, Object> orderEntity = (Map<String, Object>) payload.get("order");
            
            if (paymentEntity == null || orderEntity == null) {
                log.error("Missing payment or order entity in webhook");
                return ResponseEntity.badRequest().body("Missing payment/order entity");
            }
            
            String razorpayPaymentId = (String) paymentEntity.get("id");
            String razorpayOrderId = (String) orderEntity.get("id");
            String orderId = (String) orderEntity.get("id");
            
            // Extract jobId from order notes or metadata
            Map<String, Object> notes = (Map<String, Object>) orderEntity.get("notes");
            Long jobId = null;
            String transactionCode = null;
            
            if (notes != null) {
                Object jobIdObj = notes.get("jobId");
                Object transactionCodeObj = notes.get("transactionCode");
                
                if (jobIdObj != null) {
                    jobId = Long.valueOf(jobIdObj.toString());
                }
                if (transactionCodeObj != null) {
                    transactionCode = transactionCodeObj.toString();
                }
            }
            
            if (jobId == null || transactionCode == null) {
                log.error("Missing jobId or transactionCode in webhook notes");
                return ResponseEntity.badRequest().body("Missing jobId or transactionCode");
            }
            
            // Handle different webhook events
            if ("payment.captured".equals(event) || "payment.success".equals(event)) {
                log.info("Payment successful for jobId: {}, transactionCode: {}", jobId, transactionCode);
                
                // Verify signature if in production
                // TODO: Add signature verification
                
                // Confirm payment
                paymentService.confirmPayment(
                    jobId,
                    transactionCode,
                    razorpayPaymentId,
                    razorpayOrderId,
                    signature,
                    "FINAL"
                );
                
                log.info("Payment confirmed successfully for jobId: {}", jobId);
                return ResponseEntity.ok("OK");
                
            } else if ("payment.failed".equals(event)) {
                log.warn("Payment failed for jobId: {}, transactionCode: {}", jobId, transactionCode);
                
                // Mark payment as failed
                try {
                    paymentService.markPaymentFailed(jobId, transactionCode);
                } catch (Exception e) {
                    log.error("Error marking payment as failed", e);
                }
                
                return ResponseEntity.ok("OK");
                
            } else {
                log.info("Unhandled webhook event: {}", event);
                return ResponseEntity.ok("OK");
            }
            
        } catch (Exception e) {
            log.error("Error processing RazorPay webhook", e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    /**
     * Webhook verification endpoint (for RazorPay webhook setup)
     */
    @GetMapping("/razorpay")
    public ResponseEntity<String> verifyWebhook() {
        return ResponseEntity.ok("Webhook endpoint is active");
    }
}
