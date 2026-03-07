package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStep2Dto {
    private List<DocumentUpload> documents;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentUpload {
        private String documentType; // AADHAAR, PAN, ADDRESS_PROOF, CERTIFICATION, PROFILE_PHOTO
        private String documentNumber; // For AADHAAR, PAN
        private String documentUrl; // Uploaded file URL
    }
}
