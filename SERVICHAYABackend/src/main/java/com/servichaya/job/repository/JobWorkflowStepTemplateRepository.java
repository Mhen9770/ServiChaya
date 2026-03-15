package com.servichaya.job.repository;

import com.servichaya.job.entity.JobWorkflowStepTemplate;
import com.servichaya.job.entity.JobWorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobWorkflowStepTemplateRepository extends JpaRepository<JobWorkflowStepTemplate, Long> {

    List<JobWorkflowStepTemplate> findByWorkflowTemplateOrderByStepOrderAsc(JobWorkflowTemplate template);
}

