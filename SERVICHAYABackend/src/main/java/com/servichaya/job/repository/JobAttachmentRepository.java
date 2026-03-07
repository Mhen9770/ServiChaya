package com.servichaya.job.repository;

import com.servichaya.job.entity.JobAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobAttachmentRepository extends JpaRepository<JobAttachment, Long> {
    List<JobAttachment> findByJobIdOrderByDisplayOrderAsc(Long jobId);
}
