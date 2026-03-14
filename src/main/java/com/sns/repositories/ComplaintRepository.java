package com.sns.repositories;

import com.sns.models.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserEmail(String email);

    List<Complaint> findByDepartmentId(Long departmentId);
    
    // For Officers
    List<Complaint> findByDepartmentIdAndEscalationLevel(Long departmentId, Integer escalationLevel);
    
    // For specific Officer assignment
    List<Complaint> findByAssignedTo(com.sns.models.Administrator assignedTo);
    
    // For Dept Heads
    List<Complaint> findByDepartmentIdAndEscalationLevelGreaterThanEqual(Long departmentId, Integer escalationLevel);
    // Find complaints that are overdue but not yet resolved/closed/escalated
    List<Complaint> findByStatusInAndSlaDeadlineBefore(List<Complaint.Status> statuses, java.time.LocalDateTime now);

    // Analytics Queries
    long countByStatus(com.sns.models.Complaint.Status status);
    
    long countByAssignedToAndStatusIn(com.sns.models.Administrator assignedTo, List<com.sns.models.Complaint.Status> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(c.zone.name, 'Unassigned'), COUNT(c) FROM Complaint c GROUP BY c.zone.name")
    List<Object[]> countComplaintsByZone();

    @org.springframework.data.jpa.repository.Query("SELECT c.category.name, COUNT(c) FROM Complaint c GROUP BY c.category.name")
    List<Object[]> countComplaintsByCategory();

    @org.springframework.data.jpa.repository.Query("SELECT DATE(c.submittedAt) as date, COUNT(c) FROM Complaint c GROUP BY DATE(c.submittedAt) ORDER BY date DESC")
    List<Object[]> countComplaintsByDate();
    
    @org.springframework.data.jpa.repository.Query("SELECT DATE(c.resolvedAt) as date, COUNT(c) FROM Complaint c WHERE c.status = 'RESOLVED' GROUP BY DATE(c.resolvedAt) ORDER BY date DESC")
    List<Object[]> countResolvedByDate();

    // F9: Duplicate detection — find pending complaints in same category from last 30 days
    List<Complaint> findByCategoryAndStatusAndSubmittedAtAfter(
        com.sns.models.Category category, Complaint.Status status, java.time.LocalDateTime after);

    // F9: Find all complaints linked as duplicates of a parent
    List<Complaint> findByParentComplaintId(Long parentComplaintId);
}