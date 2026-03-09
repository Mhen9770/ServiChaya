package com.servichaya.feedback.repository;

import com.servichaya.feedback.entity.PublicOpenPoint;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointStatus;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PublicOpenPointRepository extends JpaRepository<PublicOpenPoint, Long> {

    Page<PublicOpenPoint> findByStatus(OpenPointStatus status, Pageable pageable);

    Page<PublicOpenPoint> findByType(OpenPointType type, Pageable pageable);

    Page<PublicOpenPoint> findByStatusAndType(OpenPointStatus status, OpenPointType type, Pageable pageable);
}

