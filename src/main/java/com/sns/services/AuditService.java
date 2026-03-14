package com.sns.services;

import com.sns.models.AuditLog;
import com.sns.repositories.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Async
    public void log(String action, String performedBy, Long complaintId, String complaintNumber, String oldValue, String newValue, String details) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setPerformedBy(performedBy);
        log.setComplaintId(complaintId);
        log.setComplaintNumber(complaintNumber);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    public List<AuditLog> getLogsByComplaint(Long complaintId) {
        return auditLogRepository.findByComplaintIdOrderByTimestampDesc(complaintId);
    }
}
