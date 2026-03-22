package com.sns.controllers;

import com.sns.models.AuditLog;
import com.sns.models.Complaint;
import com.sns.repositories.ComplaintRepository;
import com.sns.services.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private AuditService auditService;

    // Audit logs
    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(auditService.getRecentLogs());
    }

    @GetMapping("/audit-logs/complaint/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD')")
    public ResponseEntity<?> getAuditLogsByComplaint(@PathVariable Long id) {
        return ResponseEntity.ok(auditService.getLogsByComplaint(id));
    }
}
