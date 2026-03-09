package com.servichaya.feedback.repository;

import com.servichaya.feedback.entity.OpenPointAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpenPointAttachmentRepository extends JpaRepository<OpenPointAttachment, Long> {

    List<OpenPointAttachment> findByOpenPointIdOrderByDisplayOrderAsc(Long openPointId);

    List<OpenPointAttachment> findByOpenPointIdInOrderByOpenPointIdAscDisplayOrderAsc(Iterable<Long> openPointIds);
}

