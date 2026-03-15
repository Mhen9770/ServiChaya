package com.servichaya.service.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Mapping between service categories (including sub-categories) and service skills.
 * This allows us to restrict skills shown on Create Job / Provider onboarding
 * based on the selected category in the unified category hierarchy.
 */
@Entity
@Table(
        name = "service_category_skill_map",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"service_category_id", "service_skill_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCategorySkillMap extends BaseEntity {

    @Column(name = "service_category_id", nullable = false)
    private Long serviceCategoryId;

    @Column(name = "service_skill_id", nullable = false)
    private Long serviceSkillId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_category_id", insertable = false, updatable = false)
    private ServiceCategoryMaster category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_skill_id", insertable = false, updatable = false)
    private ServiceSkillMaster skill;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}

