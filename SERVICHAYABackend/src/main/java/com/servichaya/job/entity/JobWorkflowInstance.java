package com.servichaya.job.entity;

import com.servichaya.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Runtime workflow instance attached to a specific job.
 */
@Entity
@Table(name = "job_workflow_instance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobWorkflowInstance extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_template_id", nullable = false)
    private JobWorkflowTemplate workflowTemplate;

    @Column(name = "current_step_order")
    private Integer currentStepOrder;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;
}

