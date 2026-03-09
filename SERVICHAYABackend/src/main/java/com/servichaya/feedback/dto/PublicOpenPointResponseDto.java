package com.servichaya.feedback.dto;

import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointPriority;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointStatus;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicOpenPointResponseDto {

    private Long id;
    private OpenPointType type;
    private OpenPointStatus status;
    private OpenPointPriority priority;
    private String title;
    private String description;
    private String impactArea;
    private String url;
    private String environment;
    private String clientInfo;

    private String reporterName;
    private String reporterEmail;
    private String reporterMobile;
    private String reporterRole;

    private LocalDateTime createdAt;

    private List<SimpleAttachmentDto> attachments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimpleAttachmentDto {
        private Long id;
        private String fileName;
        private String fileUrl;
        private String attachmentType;
        private Long fileSize;
    }
}

