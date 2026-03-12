package com.servichaya.payment.service;

import com.servichaya.common.service.ConfigService;
import com.servichaya.job.entity.JobMaster;
import com.servichaya.job.repository.JobMasterRepository;
import com.servichaya.job.service.JobStateMachine;
import com.servichaya.job.service.JobStatusService;
import com.servichaya.payment.entity.*;
import com.servichaya.payment.repository.*;
import com.servichaya.payment.service.EarningCalculationService.EarningResult;
import com.servichaya.notification.service.NotificationService;
import com.servichaya.provider.repository.ServiceProviderProfileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class PaymentService {

    private final JobPaymentScheduleRepository paymentScheduleRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ProviderEarningsRepository earningsRepository;
    private final ProviderCommissionOverrideRepository commissionOverrideRepository;
    private final ProviderPaymentPreferenceRepository paymentPreferenceRepository;
    private final JobMasterRepository jobRepository;
    private final ServiceProviderProfileRepository providerRepository;
    private final CommissionService commissionService;
    private final EarningCalculationService earningCalculationService;
    private final NotificationService notificationService;
    private final PaymentGatewayService paymentGatewayService;
    private final ConfigService configService;
    private final JobStateMachine stateMachine;
    private final JobStatusService jobStatusService;

    public PaymentService(
            JobPaymentScheduleRepository paymentScheduleRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            ProviderEarningsRepository earningsRepository,
            ProviderCommissionOverrideRepository commissionOverrideRepository,
            ProviderPaymentPreferenceRepository paymentPreferenceRepository,
            JobMasterRepository jobRepository,
            ServiceProviderProfileRepository providerRepository,
            CommissionService commissionService,
            EarningCalculationService earningCalculationService,
            NotificationService notificationService,
            PaymentGatewayService paymentGatewayService,
            ConfigService configService,
            JobStateMachine stateMachine,
            @Lazy JobStatusService jobStatusService) {
        this.paymentScheduleRepository = paymentScheduleRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.earningsRepository = earningsRepository;
        this.commissionOverrideRepository = commissionOverrideRepository;
        this.paymentPreferenceRepository = paymentPreferenceRepository;
        this.jobRepository = jobRepository;
        this.providerRepository = providerRepository;
        this.commissionService = commissionService;
        this.earningCalculationService = earningCalculationService;
        this.notificationService = notificationService;
        this.paymentGatewayService = paymentGatewayService;
        this.configService = configService;
        this.stateMachine = stateMachine;
        this.jobStatusService = jobStatusService;
    }

    @Transactional
    public JobPaymentSchedule createPaymentSchedule(Long jobId, String paymentType, 
                                                    BigDecimal totalAmount, BigDecimal hourlyRate, 
                                                    BigDecimal estimatedHours, BigDecimal upfrontPercentage) {
        log.info("Creating payment schedule for jobId: {}, paymentType: {}, totalAmount: {}", 
                jobId, paymentType, totalAmount);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        JobPaymentSchedule schedule = JobPaymentSchedule.builder()
                .jobId(jobId)
                .paymentType(paymentType)
                .totalAmount(totalAmount)
                .hourlyRate(hourlyRate)
                .estimatedHours(estimatedHours)
                .upfrontPercentage(upfrontPercentage)
                .build();

        if ("PARTIAL".equals(paymentType)) {
            BigDecimal upfront = totalAmount.multiply(upfrontPercentage)
                    .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
            schedule.setUpfrontAmount(upfront);
            schedule.setFinalAmount(totalAmount.subtract(upfront));
        } else if ("FULL".equals(paymentType)) {
            schedule.setUpfrontAmount(totalAmount);
            schedule.setFinalAmount(BigDecimal.ZERO);
        } else {
            schedule.setUpfrontAmount(BigDecimal.ZERO);
            schedule.setFinalAmount(totalAmount);
        }

        schedule.setPaymentStatus("PENDING");
        return paymentScheduleRepository.save(schedule);
    }

    @Transactional
    public JobPaymentSchedule createCancellationFeePaymentSchedule(Long jobId, BigDecimal cancellationFee) {
        log.info("Creating cancellation fee payment schedule for jobId: {}, fee: {}", jobId, cancellationFee);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.error("Job not found with id: {}", jobId);
                    return new RuntimeException("Job not found");
                });

        // Check if cancellation fee schedule already exists
        Optional<JobPaymentSchedule> existingSchedule = paymentScheduleRepository.findByJobId(jobId);
        if (existingSchedule.isPresent()) {
            JobPaymentSchedule schedule = existingSchedule.get();
            // Update existing schedule for cancellation fee
            schedule.setPaymentType("CANCELLATION_FEE");
            schedule.setTotalAmount(cancellationFee);
            schedule.setUpfrontAmount(cancellationFee);
            schedule.setFinalAmount(BigDecimal.ZERO);
            schedule.setUpfrontPaid(false);
            schedule.setFinalPaid(false);
            schedule.setPaymentStatus("PENDING");
            return paymentScheduleRepository.save(schedule);
        }

        // Create new schedule for cancellation fee
        JobPaymentSchedule schedule = JobPaymentSchedule.builder()
                .jobId(jobId)
                .paymentType("CANCELLATION_FEE")
                .totalAmount(cancellationFee)
                .upfrontAmount(cancellationFee)
                .finalAmount(BigDecimal.ZERO)
                .paymentStatus("PENDING")
                .build();

        return paymentScheduleRepository.save(schedule);
    }

    @Transactional
    public PaymentTransaction processPayment(Long jobId, Long userId, BigDecimal amount, 
                                              String paymentMethod, String razorpayOrderId, 
                                              String razorpayPaymentId, String razorpaySignature) {
        log.info("Processing payment for jobId: {}, userId: {}, amount: {}", jobId, userId, amount);

        JobPaymentSchedule schedule = paymentScheduleRepository.findByJobId(jobId)
                .orElseThrow(() -> {
                    log.error("Payment schedule not found for jobId: {}", jobId);
                    return new RuntimeException("Payment schedule not found");
                });

        String transactionCode = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionCode(transactionCode)
                .jobId(jobId)
                .userId(userId)
                .transactionType("PAYMENT")
                .amount(amount)
                .paymentMethod(paymentMethod)
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(razorpayPaymentId)
                .razorpaySignature(razorpaySignature)
                .status("SUCCESS")
                .completedAt(LocalDateTime.now())
                .build();

        transaction = paymentTransactionRepository.save(transaction);

        if (schedule.getUpfrontAmount().compareTo(BigDecimal.ZERO) > 0 && !schedule.getUpfrontPaid()) {
            schedule.setUpfrontPaid(true);
            schedule.setUpfrontPaymentDate(LocalDateTime.now());
            if (schedule.getFinalAmount().compareTo(BigDecimal.ZERO) == 0) {
                schedule.setPaymentStatus("COMPLETED");
            } else {
                schedule.setPaymentStatus("PARTIAL");
            }
        } else if (schedule.getFinalAmount().compareTo(BigDecimal.ZERO) > 0 && !schedule.getFinalPaid()) {
            schedule.setFinalPaid(true);
            schedule.setFinalPaymentDate(LocalDateTime.now());
            schedule.setPaymentStatus("COMPLETED");
        }

        paymentScheduleRepository.save(schedule);
        log.info("Payment processed successfully. TransactionCode: {}", transactionCode);

        // Business Logic: Check if this is a cancellation fee payment
        try {
            JobMaster job = jobRepository.findById(jobId).orElse(null);
            if (job != null && "CANCELLATION_PAYMENT_PENDING".equals(job.getStatus()) && 
                "CANCELLATION_FEE".equals(schedule.getPaymentType())) {
                // This is cancellation fee payment - complete the cancellation
                log.info("Cancellation fee payment received for job {}. Completing cancellation.", jobId);
                jobStatusService.completeCancellation(jobId);
            }
        } catch (Exception e) {
            log.error("Failed to complete cancellation after fee payment: {}", e.getMessage());
        }

        // Business Logic: If final payment completed, trigger earnings calculation
        if (schedule.getPaymentStatus().equals("COMPLETED") && schedule.getFinalPaid()) {
            try {
                JobMaster job = jobRepository.findById(jobId)
                        .orElseThrow(() -> new RuntimeException("Job not found"));
                
                if (job.getProviderId() != null && job.getFinalPrice() != null) {
                    // Only calculate if not already calculated
                    if (!earningsRepository.findByJobId(jobId).isPresent()) {
                        calculateAndCreateEarnings(jobId, job.getProviderId(), job.getFinalPrice());
                        log.info("Earnings calculated after final payment");
                    }
                }
            } catch (Exception e) {
                log.warn("Could not calculate earnings after payment: {}", e.getMessage());
            }
        }

        // Business Logic: Send notification
        try {
            JobMaster job = jobRepository.findById(jobId).orElse(null);
            if (job != null) {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("amount", amount.toString());
                metadata.put("transactionCode", transactionCode);
                
                notificationService.createNotification(
                        userId, "CUSTOMER", "PAYMENT_SUCCESS",
                        "Payment Successful",
                        String.format("Payment of ₹%s processed successfully for job: %s", amount, job.getTitle()),
                        "PAYMENT", jobId,
                        String.format("/customer/jobs/%d", jobId),
                        metadata);
            }
        } catch (Exception e) {
            log.warn("Could not send payment notification: {}", e.getMessage());
        }

        return transaction;
    }

    @Transactional
    public ProviderEarnings calculateAndCreateEarnings(Long jobId, Long providerId, BigDecimal jobAmount) {
        log.info("Calculating earnings for jobId: {}, providerId: {}, jobAmount: {}", 
                jobId, providerId, jobAmount);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        // Use new EarningCalculationService that supports COMMISSION/LEAD/HYBRID models
        EarningResult earningResult = earningCalculationService.calculatePlatformEarnings(job, providerId);
        
        BigDecimal platformEarning = earningResult.getTotalEarning();
        BigDecimal netEarnings = jobAmount.subtract(platformEarning);

        // Calculate commission percentage for storage (for backward compatibility)
        BigDecimal commissionPercentage = null;
        if (earningResult.getCommissionEarning() != null && 
            earningResult.getCommissionEarning().compareTo(BigDecimal.ZERO) > 0) {
            commissionPercentage = earningResult.getCommissionEarning()
                    .multiply(new BigDecimal(100))
                    .divide(jobAmount, 2, RoundingMode.HALF_UP);
        }

        ProviderEarnings earnings = ProviderEarnings.builder()
                .providerId(providerId)
                .jobId(jobId)
                .jobAmount(jobAmount)
                .commissionPercentage(commissionPercentage)
                .commissionAmount(platformEarning) // Total platform earning (commission + lead)
                .netEarnings(netEarnings)
                .payoutStatus("PENDING")
                .build();

        earnings = earningsRepository.save(earnings);
        log.info("Earnings created. Model: {}, Commission: {}, Lead: {}, Total Platform: {}, Net Provider: {}", 
                earningResult.getEarningModel(), 
                earningResult.getCommissionEarning(),
                earningResult.getLeadEarning(),
                platformEarning, 
                netEarnings);

        return earnings;
    }

    public ProviderPaymentPreference getProviderPaymentPreference(Long providerId, Long serviceCategoryId) {
        log.info("Getting payment preference for providerId: {}, serviceCategoryId: {}", 
                providerId, serviceCategoryId);

        if (serviceCategoryId != null) {
            return paymentPreferenceRepository.findByProviderIdAndServiceCategoryId(providerId, serviceCategoryId)
                    .orElseGet(() -> paymentPreferenceRepository.findDefaultByProviderId(providerId)
                            .orElse(null));
        }

        return paymentPreferenceRepository.findDefaultByProviderId(providerId).orElse(null);
    }

    public JobPaymentSchedule getPaymentSchedule(Long jobId) {
        log.info("Getting payment schedule for jobId: {}", jobId);
        return paymentScheduleRepository.findByJobId(jobId)
                .orElse(null); // Return null to allow checking existence
    }

    public Optional<JobPaymentSchedule> getPaymentScheduleOptional(Long jobId) {
        log.info("Getting payment schedule (optional) for jobId: {}", jobId);
        return paymentScheduleRepository.findByJobId(jobId);
    }

    @Transactional
    public JobPaymentSchedule updatePaymentSchedule(JobPaymentSchedule schedule) {
        log.info("Updating payment schedule for jobId: {}", schedule.getJobId());
        return paymentScheduleRepository.save(schedule);
    }

    @Transactional
    public PaymentTransaction processCashPayment(Long jobId, Long userId, BigDecimal amount) {
        log.info("Processing cash payment for jobId: {}, userId: {}, amount: {}", jobId, userId, amount);

        // Get or create payment schedule
        JobPaymentSchedule schedule = paymentScheduleRepository.findByJobId(jobId).orElse(null);
        if (schedule == null) {
            log.info("No payment schedule found, creating one for cash payment");
            schedule = createPaymentSchedule(jobId, "POST_WORK", amount, null, null, null);
        }

        String transactionCode = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionCode(transactionCode)
                .jobId(jobId)
                .userId(userId)
                .transactionType("PAYMENT")
                .amount(amount)
                .paymentMethod("CASH")
                .paymentChannel("CASH")
                .status("SUCCESS")
                .completedAt(LocalDateTime.now())
                .build();

        transaction = paymentTransactionRepository.save(transaction);

        // Update payment schedule
        schedule.setFinalPaid(true);
        schedule.setFinalPaymentDate(LocalDateTime.now());
        schedule.setPaymentStatus("COMPLETED");
        paymentScheduleRepository.save(schedule);

        log.info("Cash payment processed successfully. TransactionCode: {}", transactionCode);
        return transaction;
    }

    public JobMaster getJobById(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    public PaymentTransaction getPendingTransactionByJobId(Long jobId) {
        return paymentTransactionRepository.findByJobId(jobId, 
                org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent()
                .stream()
                .filter(t -> "PENDING".equals(t.getStatus()))
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public void markTestPaymentFailed(Long jobId, String transactionCode) {
        if (!configService.isTestPaymentModeEnabled()) {
            throw new RuntimeException("Test payment mode is not enabled");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByTransactionCode(transactionCode)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionCode));

        if (!transaction.getJobId().equals(jobId)) {
            throw new RuntimeException("Transaction does not belong to this job");
        }

        transaction.setStatus("FAILED");
        transaction.setCompletedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        log.info("Test payment marked as FAILED for jobId: {}, transactionCode: {}", jobId, transactionCode);
    }

    @Transactional
    public String createPaymentLink(Long jobId, Long userId, BigDecimal amount) {
        log.info("Creating payment link for jobId: {}, userId: {}, amount: {}", jobId, userId, amount);

        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        // Ensure payment schedule exists
        JobPaymentSchedule schedule = paymentScheduleRepository.findByJobId(jobId).orElse(null);
        if (schedule == null) {
            log.info("No payment schedule found, creating one for online payment");
            schedule = createPaymentSchedule(jobId, "POST_WORK", amount, null, null, null);
        } else {
            // Update schedule with final amount if different
            if (schedule.getTotalAmount() == null || schedule.getTotalAmount().compareTo(amount) != 0) {
                schedule.setTotalAmount(amount);
                schedule.setFinalAmount(amount);
                schedule = paymentScheduleRepository.save(schedule);
            }
        }

        // Create payment transaction with PENDING status
        String transactionCode = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // Determine payment type from schedule
        String paymentTypeForTransaction = "FINAL"; // Default
        if (schedule != null) {
            if (schedule.getUpfrontAmount().compareTo(amount) == 0 && !schedule.getUpfrontPaid()) {
                paymentTypeForTransaction = "UPFRONT";
            } else if (schedule.getFinalAmount().compareTo(amount) == 0 && !schedule.getFinalPaid()) {
                paymentTypeForTransaction = "FINAL";
            }
        }
        
        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionCode(transactionCode)
                .jobId(jobId)
                .userId(userId)
                .transactionType("PAYMENT")
                .amount(amount)
                .paymentChannel("ONLINE")
                .status("PENDING")
                .build();

        transaction = paymentTransactionRepository.save(transaction);

        // If test payment mode is enabled, return a fake link that frontend can use for sandbox flow
        if (configService.isTestPaymentModeEnabled()) {
            String testLink = String.format(
                    "/test-payment?jobId=%d&transactionCode=%s&amount=%s",
                    jobId, transactionCode, amount.toPlainString());
            log.info("TEST_PAYMENT_MODE enabled. Returning sandbox payment link: {}", testLink);
            return testLink;
        }

        // Generate real gateway payment link
        try {
            // Create Razorpay order
            Map<String, Object> orderData = paymentGatewayService.createOrder(
                    amount, "INR", transactionCode);
            String orderId = (String) orderData.get("id");
            
            // Update transaction with order ID
            transaction.setRazorpayOrderId(orderId);
            paymentTransactionRepository.save(transaction);
            
            // Generate payment link
            // TODO: Get customer details from user account
            String paymentLink = paymentGatewayService.generatePaymentLink(
                    orderId, amount, "Customer", null, null);
            
            log.info("Payment link created for transaction: {}, orderId: {}", transactionCode, orderId);
            return paymentLink;
        } catch (Exception e) {
            log.error("Failed to create payment link: {}", e.getMessage());
            throw new RuntimeException("Failed to create payment link: " + e.getMessage());
        }
    }

    @Transactional
    public void confirmPayment(Long jobId, String transactionCode, String razorpayPaymentId, 
                               String razorpayOrderId, String razorpaySignature, String paymentType) {
        log.info("Confirming payment for jobId: {}, transactionCode: {}, paymentType: {}", 
                jobId, transactionCode, paymentType);

        PaymentTransaction transaction = paymentTransactionRepository.findByTransactionCode(transactionCode)
                .orElseThrow(() -> {
                    log.error("Transaction not found: {}", transactionCode);
                    return new RuntimeException("Transaction not found");
                });

        if (!transaction.getJobId().equals(jobId)) {
            throw new RuntimeException("Transaction does not belong to this job");
        }

        // Verify payment with gateway unless we're in test mode
        if (!configService.isTestPaymentModeEnabled()) {
            if (razorpayPaymentId != null && razorpayOrderId != null && razorpaySignature != null) {
                boolean isValid = paymentGatewayService.verifyPaymentSignature(
                        razorpayOrderId, razorpayPaymentId, razorpaySignature);
                if (!isValid) {
                    log.error("Invalid payment signature for transaction: {}", transactionCode);
                    throw new RuntimeException("Invalid payment signature");
                }
            }
        } else {
            log.info("TEST_PAYMENT_MODE enabled. Skipping gateway signature verification for transaction: {}", transactionCode);
        }
        
        transaction.setStatus("SUCCESS");
        transaction.setRazorpayPaymentId(razorpayPaymentId);
        transaction.setRazorpayOrderId(razorpayOrderId);
        transaction.setRazorpaySignature(razorpaySignature);
        transaction.setCompletedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        // Update payment schedule (ensure it exists)
        JobPaymentSchedule schedule = paymentScheduleRepository.findByJobId(jobId).orElse(null);
        if (schedule == null) {
            log.warn("Payment schedule not found for jobId: {}, creating one", jobId);
            JobMaster job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found"));
            schedule = createPaymentSchedule(jobId, "POST_WORK", transaction.getAmount(), null, null, null);
        }
        
        // Determine if this is upfront or final payment
        boolean isUpfrontPayment = "upfront".equalsIgnoreCase(paymentType) || 
            (paymentType == null && schedule.getUpfrontAmount().compareTo(transaction.getAmount()) == 0 && !schedule.getUpfrontPaid());
        
        // Get job for notifications
        JobMaster job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        if (isUpfrontPayment) {
            // Update upfront payment
            schedule.setUpfrontPaid(true);
            schedule.setUpfrontPaymentDate(LocalDateTime.now());
            if (schedule.getFinalAmount().compareTo(BigDecimal.ZERO) == 0) {
                schedule.setPaymentStatus("COMPLETED");
            } else {
                schedule.setPaymentStatus("PARTIAL");
            }
            log.info("Upfront payment confirmed for jobId: {}", jobId);
            
            // Update job status from PENDING_FOR_PAYMENT to ACCEPTED after upfront payment
            if ("PENDING_FOR_PAYMENT".equals(job.getStatus())) {
                try {
                    stateMachine.validateTransition("PENDING_FOR_PAYMENT", "ACCEPTED");
                    job.setStatus("ACCEPTED");
                    jobRepository.save(job);
                    log.info("Job {} status updated from PENDING_FOR_PAYMENT to ACCEPTED after upfront payment", jobId);
                } catch (Exception e) {
                    log.error("Failed to update job status to ACCEPTED: {}", e.getMessage());
                    // Continue with notifications even if status update fails
                }
            }
            
            // Notify customer - upfront payment successful
            try {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("amount", transaction.getAmount().toString());
                metadata.put("transactionCode", transactionCode);
                metadata.put("paymentType", "UPFRONT");
                metadata.put("remainingAmount", schedule.getFinalAmount().toString());
                
                notificationService.createNotification(
                        job.getCustomerId(), "CUSTOMER", "PAYMENT_UPFRONT_SUCCESS",
                        "Upfront Payment Successful",
                        String.format("Upfront payment of ₹%s processed successfully for job: %s. Job is now ACCEPTED and provider can start work. Remaining ₹%s will be due after completion.", 
                                transaction.getAmount(), job.getTitle(), schedule.getFinalAmount()),
                        "PAYMENT", jobId,
                        String.format("/customer/jobs/%d", jobId),
                        metadata);
            } catch (Exception e) {
                log.warn("Could not send upfront payment notification to customer: {}", e.getMessage());
            }
            
            // Notify provider - customer paid upfront
            if (job.getProviderId() != null) {
                try {
                    com.servichaya.provider.entity.ServiceProviderProfile provider = 
                        providerRepository.findById(job.getProviderId()).orElse(null);
                    if (provider != null && provider.getUserId() != null) {
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("amount", transaction.getAmount().toString());
                        metadata.put("jobCode", job.getJobCode());
                        metadata.put("paymentType", "UPFRONT");
                        
                        notificationService.createNotification(
                                provider.getUserId(), "PROVIDER", "CUSTOMER_PAYMENT_RECEIVED",
                                "Customer Paid Upfront - Job Ready",
                                String.format("Customer has paid upfront amount of ₹%s for job: %s. Job is now ACCEPTED. You can now start the work.", 
                                        transaction.getAmount(), job.getTitle()),
                                "PAYMENT", jobId,
                                String.format("/provider/jobs/%d", jobId),
                                metadata);
                    }
                } catch (Exception e) {
                    log.warn("Could not send upfront payment notification to provider: {}", e.getMessage());
                }
            }
        } else {
            // Update final payment
            schedule.setFinalPaid(true);
            schedule.setFinalPaymentDate(LocalDateTime.now());
            schedule.setPaymentStatus("COMPLETED");
            log.info("Final payment confirmed for jobId: {}", jobId);
            
            // Update job status to COMPLETED
            if ("PAYMENT_PENDING".equals(job.getStatus())) {
                job.setStatus("COMPLETED");
                jobRepository.save(job);

                // Calculate earnings
                if (job.getProviderId() != null && job.getFinalPrice() != null) {
                    try {
                        if (!earningsRepository.findByJobId(jobId).isPresent()) {
                            calculateAndCreateEarnings(jobId, job.getProviderId(), job.getFinalPrice());
                            log.info("Earnings calculated after payment confirmation");
                        }
                    } catch (Exception e) {
                        log.warn("Could not calculate earnings: {}", e.getMessage());
                    }
                }
            }

            // Notify customer - final payment successful
            try {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("amount", transaction.getAmount().toString());
                metadata.put("transactionCode", transactionCode);
                metadata.put("paymentType", "FINAL");
                
                notificationService.createNotification(
                        job.getCustomerId(), "CUSTOMER", "PAYMENT_SUCCESS",
                        "Payment Successful",
                        String.format("Payment of ₹%s processed successfully for job: %s. Job is now completed!", 
                                transaction.getAmount(), job.getTitle()),
                        "PAYMENT", jobId,
                        String.format("/customer/jobs/%d", jobId),
                        metadata);
            } catch (Exception e) {
                log.warn("Could not send final payment notification to customer: {}", e.getMessage());
            }
            
            // Notify provider - final payment received, earnings available
            if (job.getProviderId() != null) {
                try {
                    com.servichaya.provider.entity.ServiceProviderProfile provider = 
                        providerRepository.findById(job.getProviderId()).orElse(null);
                    if (provider != null && provider.getUserId() != null) {
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("amount", transaction.getAmount().toString());
                        metadata.put("jobCode", job.getJobCode());
                        metadata.put("paymentType", "FINAL");
                        
                        notificationService.createNotification(
                                provider.getUserId(), "PROVIDER", "PAYMENT_RECEIVED_EARNINGS_AVAILABLE",
                                "Payment Received - Earnings Available",
                                String.format("Final payment of ₹%s received for job: %s. Your earnings are now available for withdrawal.", 
                                        transaction.getAmount(), job.getTitle()),
                                "PAYMENT", jobId,
                                String.format("/provider/jobs/%d", jobId),
                                metadata);
                    }
                } catch (Exception e) {
                    log.warn("Could not send final payment notification to provider: {}", e.getMessage());
                }
            }
        }
        
        if (razorpayPaymentId != null) {
            schedule.setRazorpayPaymentId(razorpayPaymentId);
        }
        if (razorpayOrderId != null) {
            schedule.setRazorpayOrderId(razorpayOrderId);
        }
        paymentScheduleRepository.save(schedule);

        log.info("Payment confirmed successfully for jobId: {}, paymentType: {}", jobId, isUpfrontPayment ? "UPFRONT" : "FINAL");
    }
}
