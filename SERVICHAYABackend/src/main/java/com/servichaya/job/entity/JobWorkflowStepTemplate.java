package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Template for a single step in a workflow.
 * Steps are executed in order for each job that uses this workflow.
 */
@Entity
@Table(name = "job_workflow_step_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobWorkflowStepTemplate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_template_id", nullable = false)
    private JobWorkflowTemplate workflowTemplate;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "step_code", nullable = false, length = 100)
    private String stepCode; // e.g. BOOK, MATCHED, VISIT_IN_PROGRESS, WORK_ASSIGNED

    @Column(name = "step_type", nullable = false, length = 50)
    private String stepType; // STATUS_CHANGE, PAYMENT, VISIT, NOTIFICATION, CUSTOM

    @Column(name = "status_value", length = 50)
    private String statusValue; // Maps into JobMaster.status when this step is active

    @Column(name = "payment_type", length = 50)
    private String paymentType; // PARTIAL, FULL, POST_WORK (for payment steps)

    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private Boolean isMandatory = true;

    @Column(name = "auto_advance", nullable = false)
    @Builder.Default
    private Boolean autoAdvance = false;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson; // Flexible JSON for additional rules/config
}

