package com.servichaya.provider.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "provider_document")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderDocument extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "document_type", length = 50, nullable = false)
    private String documentType; // AADHAAR, PAN, ADDRESS_PROOF, CERTIFICATION, PROFILE_PHOTO

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "document_url", length = 500, nullable = false)
    private String documentUrl;

    @Column(name = "verification_status", length = 50)
    @Builder.Default
    private String verificationStatus = "PENDING"; // PENDING, VERIFIED, REJECTED

    @Column(name = "verified_by")
    private Long verifiedBy;

    @Column(name = "verified_at")
    private java.time.LocalDateTime verifiedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
}
