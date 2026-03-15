package com.servichaya.job.repository;

import com.servichaya.job.entity.JobWorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobWorkflowTemplateRepository extends JpaRepository<JobWorkflowTemplate, Long> {

    Optional<JobWorkflowTemplate> findByWorkflowCodeAndIsActiveTrue(String workflowCode);
}

