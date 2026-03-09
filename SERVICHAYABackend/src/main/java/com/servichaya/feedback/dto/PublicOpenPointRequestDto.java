package com.servichaya.feedback.dto;

import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicOpenPointRequestDto {

    private OpenPointType type;
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

    private List<String> attachmentUrls; // For simple JSON-based create without multipart
}

