package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * High-level reusable workflow definition for jobs.
 * Example: SIMPLE_SERVICE, VISIT_THEN_WORK, EMPLOYMENT_FLOW, etc.
 */
@Entity
@Table(name = "job_workflow_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobWorkflowTemplate extends BaseEntity {

    @Column(name = "workflow_code", nullable = false, unique = true, length = 100)
    private String workflowCode;

    @Column(name = "workflow_name", nullable = false, length = 255)
    private String workflowName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}

