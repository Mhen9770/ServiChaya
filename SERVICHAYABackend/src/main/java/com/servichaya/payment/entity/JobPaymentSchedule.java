package com.servichaya.payment.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_payment_schedule", indexes = {
    @Index(name = "idx_job_id", columnList = "job_id"),
    @Index(name = "idx_payment_type", columnList = "payment_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPaymentSchedule extends BaseEntity {

    @Column(name = "job_id", nullable = false, unique = true)
    private Long jobId;

    @Column(name = "payment_type", length = 50, nullable = false)
    private String paymentType; // PARTIAL, FULL, POST_WORK

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "estimated_hours", precision = 5, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "upfront_percentage", precision = 5, scale = 2)
    private BigDecimal upfrontPercentage;

    @Column(name = "upfront_amount", precision = 10, scale = 2)
    private BigDecimal upfrontAmount;

    @Column(name = "final_amount", precision = 10, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "upfront_paid")
    @Builder.Default
    private Boolean upfrontPaid = false;

    @Column(name = "final_paid")
    @Builder.Default
    private Boolean finalPaid = false;

    @Column(name = "upfront_payment_date")
    private LocalDateTime upfrontPaymentDate;

    @Column(name = "final_payment_date")
    private LocalDateTime finalPaymentDate;

    @Column(name = "razorpay_order_id", length = 255)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 255)
    private String razorpayPaymentId;

    @Column(name = "payment_status", length = 50)
    @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING, PARTIAL, COMPLETED, FAILED, REFUNDED
}
