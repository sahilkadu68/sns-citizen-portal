
package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long complaintId;

    @Column(unique = true, length = 50)
    private String complaintNumber; // Formatted like SNS-YYYYMMDD-XXXX

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private String address;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Priority priority = Priority.MEDIUM;

    @Column(nullable = false, updatable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    private LocalDateTime assignedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime escalatedAt;
    private LocalDateTime slaDeadline;

    // 0 = Officer, 1 = Dept Head, 2 = Admin
    @Column(nullable = false)
    private Integer escalationLevel = 0;

    private String resolutionNotes;

    @Column(columnDefinition = "LONGTEXT")
    private String resolutionProof;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private Administrator assignedTo;

    // F1: Citizen Feedback & Rating
    private Integer citizenRating; // 1-5 stars
    @Column(columnDefinition = "TEXT")
    private String citizenFeedback;

    // F9: Duplicate Complaint Detection
    @Column(nullable = false)
    private Integer duplicateCount = 0;
    private Long parentComplaintId; // links duplicate to original

    public enum Status {
        PENDING, RESOLVED, CLOSED, REJECTED
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
