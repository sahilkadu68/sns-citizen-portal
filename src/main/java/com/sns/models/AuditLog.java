package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g. STATUS_CHANGE, ASSIGNMENT, ESCALATION, FEEDBACK, LOGIN

    @Column(nullable = false)
    private String performedBy; // email of the user who performed the action

    private Long complaintId;
    private String complaintNumber;

    @Column(length = 500)
    private String oldValue;
    
    @Column(length = 500)
    private String newValue;

    @Column(length = 500)
    private String details;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
