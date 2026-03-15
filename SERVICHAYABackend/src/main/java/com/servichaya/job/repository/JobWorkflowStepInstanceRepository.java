package com.servichaya.job.repository;

import com.servichaya.job.entity.JobWorkflowInstance;
import com.servichaya.job.entity.JobWorkflowStepInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobWorkflowStepInstanceRepository extends JpaRepository<JobWorkflowStepInstance, Long> {

    List<JobWorkflowStepInstance> findByWorkflowInstanceOrderByStepOrderAsc(JobWorkflowInstance instance);
}

