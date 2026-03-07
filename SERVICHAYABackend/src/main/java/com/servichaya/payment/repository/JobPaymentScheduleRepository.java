package com.servichaya.payment.repository;

import com.servichaya.payment.entity.JobPaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobPaymentScheduleRepository extends JpaRepository<JobPaymentSchedule, Long> {

    Optional<JobPaymentSchedule> findByJobId(Long jobId);
}
