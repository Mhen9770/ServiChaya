package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Defines which workflow template should be used for which services.
 * Assignment can be at category or subcategory level with priority.
 */
@Entity
@Table(name = "job_workflow_assignment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobWorkflowAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_template_id", nullable = false)
    private JobWorkflowTemplate workflowTemplate;

    @Column(name = "service_type_id")
    private Long serviceTypeId; // reserved for future use

    @Column(name = "service_category_id")
    private Long serviceCategoryId;

    @Column(name = "service_subcategory_id")
    private Long serviceSubCategoryId;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}

