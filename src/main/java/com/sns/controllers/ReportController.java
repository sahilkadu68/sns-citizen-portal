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

    @Autowired
    private ComplaintRepository complaintRepository;

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

    // CSV Export
    @GetMapping("/export")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD')")
    public ResponseEntity<byte[]> exportCsv() {
        List<Complaint> complaints = complaintRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Complaint Number,Title,Status,Priority,Category,Zone,Address,Submitted At,SLA Deadline,Resolved At,Escalation Level\n");
        for (Complaint c : complaints) {
            csv.append(c.getComplaintId()).append(",");
            csv.append(quote(c.getComplaintNumber())).append(",");
            csv.append(quote(c.getTitle())).append(",");
            csv.append(c.getStatus()).append(",");
            csv.append(c.getPriority()).append(",");
            csv.append(c.getCategory() != null ? quote(c.getCategory().getName()) : "").append(",");
            csv.append(c.getZone() != null ? quote(c.getZone().getName()) : "").append(",");
            csv.append(quote(c.getAddress())).append(",");
            csv.append(c.getSubmittedAt()).append(",");
            csv.append(c.getSlaDeadline() != null ? c.getSlaDeadline() : "").append(",");
            csv.append(c.getResolvedAt() != null ? c.getResolvedAt() : "").append(",");
            csv.append(c.getEscalationLevel() != null ? c.getEscalationLevel() : 0);
            csv.append("\n");
        }
        byte[] bytes = csv.toString().getBytes();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=complaints_report.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(bytes);
    }

    private String quote(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
