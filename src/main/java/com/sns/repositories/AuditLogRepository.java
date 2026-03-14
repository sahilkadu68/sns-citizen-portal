package com.sns.repositories;

import com.sns.models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByComplaintIdOrderByTimestampDesc(Long complaintId);
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    List<AuditLog> findByPerformedByOrderByTimestampDesc(String email);
}
