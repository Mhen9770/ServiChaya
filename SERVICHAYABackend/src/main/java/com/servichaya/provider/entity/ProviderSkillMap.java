package com.servichaya.provider.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "provider_skill_map")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderSkillMap extends BaseEntity {

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "certification_name", length = 255)
    private String certificationName;

    @Column(name = "certification_document_url", length = 500)
    private String certificationDocumentUrl;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;
}
