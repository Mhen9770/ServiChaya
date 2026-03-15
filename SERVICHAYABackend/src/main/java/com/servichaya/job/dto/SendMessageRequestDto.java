package com.servichaya.job.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending a message in job chat
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequestDto {
    
    @NotBlank(message = "Message cannot be empty")
    @Size(min = 1, max = 5000, message = "Message must be between 1 and 5000 characters")
    private String message;
    
    private String attachmentUrl;
    
    private String attachmentType; // IMAGE, PDF, DOCUMENT, OTHER
}
