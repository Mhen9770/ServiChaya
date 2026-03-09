package com.servichaya.feedback.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "open_point_attachment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenPointAttachment extends BaseEntity {

    @Column(name = "open_point_id", nullable = false)
    private Long openPointId;

    @Column(name = "attachment_type", length = 50)
    private String attachmentType; // IMAGE, DOCUMENT, VIDEO

    @Column(name = "file_url", length = 1000, nullable = false)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
}

