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
    private ComplaintRepository complaintRepository;

    @Autowired
    private AuditService auditService;

    // Export complaints as CSV
    @GetMapping("/export")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD')")
    public ResponseEntity<byte[]> exportComplaints(@RequestParam(defaultValue = "csv") String format) {
        List<Complaint> complaints = complaintRepository.findAll();

        if ("csv".equalsIgnoreCase(format)) {
            StringBuilder csv = new StringBuilder();
            csv.append("Complaint Number,Title,Category,Department,Zone,Status,Priority,Submitted At,Assigned To,Rating\n");
            for (Complaint c : complaints) {
                csv.append(escapeCsv(c.getComplaintNumber())).append(",");
                csv.append(escapeCsv(c.getTitle())).append(",");
                csv.append(escapeCsv(c.getCategory() != null ? c.getCategory().getName() : "")).append(",");
                csv.append(escapeCsv(c.getDepartment() != null ? c.getDepartment().getName() : "")).append(",");
                csv.append(escapeCsv(c.getZone() != null ? c.getZone().getName() : "")).append(",");
                csv.append(c.getStatus()).append(",");
                csv.append(c.getPriority()).append(",");
                csv.append(c.getSubmittedAt()).append(",");
                csv.append(escapeCsv(c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : "Unassigned")).append(",");
                csv.append(c.getCitizenRating() != null ? c.getCitizenRating() : "").append("\n");
            }
            
            byte[] bytes = csv.toString().getBytes();
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sns_complaints_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
        }

        // Plain text report format for "pdf" (real PDF needs a library)
        StringBuilder report = new StringBuilder();
        report.append("SMART NAGRIK SEVA — COMPLAINTS REPORT\n");
        report.append("═══════════════════════════════════════\n\n");
        report.append("Total Complaints: ").append(complaints.size()).append("\n");
        report.append("Resolved: ").append(complaints.stream().filter(c -> c.getStatus() == Complaint.Status.RESOLVED || c.getStatus() == Complaint.Status.CLOSED).count()).append("\n");
        report.append("Pending: ").append(complaints.stream().filter(c -> c.getStatus() == Complaint.Status.PENDING).count()).append("\n\n");
        
        for (Complaint c : complaints) {
            report.append("──────────────────────────────\n");
            report.append("ID: ").append(c.getComplaintNumber()).append("\n");
            report.append("Title: ").append(c.getTitle()).append("\n");
            report.append("Status: ").append(c.getStatus()).append(" | Priority: ").append(c.getPriority()).append("\n");
            report.append("Submitted: ").append(c.getSubmittedAt()).append("\n");
            if (c.getCitizenRating() != null) report.append("Rating: ").append(c.getCitizenRating()).append("/5\n");
            report.append("\n");
        }

        byte[] bytes = report.toString().getBytes();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sns_complaints_report.txt")
            .contentType(MediaType.TEXT_PLAIN)
            .body(bytes);
    }

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

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
