package com.servichaya.job.repository;

import com.servichaya.job.entity.JobWorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobWorkflowInstanceRepository extends JpaRepository<JobWorkflowInstance, Long> {

    Optional<JobWorkflowInstance> findByJobId(Long jobId);
}

