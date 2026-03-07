package com.servichaya.job.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentDto {
    private String attachmentType;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private Integer displayOrder;
}
