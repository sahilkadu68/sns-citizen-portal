package com.sns.services;

import com.sns.models.Complaint;
import com.sns.repositories.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class EscalationScheduler {

    @Autowired
    private ComplaintRepository complaintRepository;

    // Run every minute for testing/demo purposes.
    // In production, might be "@Scheduled(cron = "0 0 * * * *")" (hourly)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkAndEscalateComplaints() {
        LocalDateTime now = LocalDateTime.now();

        // Find all complaints that are not resolved, closed, or rejected
        List<Complaint.Status> activeStatuses = Arrays.asList(
                Complaint.Status.PENDING
        );

        List<Complaint> overdueComplaints = complaintRepository.findByStatusInAndSlaDeadlineBefore(activeStatuses, now);

        for (Complaint complaint : overdueComplaints) {
            Integer currentLevel = complaint.getEscalationLevel();

            if (currentLevel == 0) {
                // Officer failed to resolve within 48h. Escalate to Dept Head.
                complaint.setEscalationLevel(1);
                complaint.setEscalatedAt(now); // Set timestamp
                // Give Dept Head an additional 7 days (168 hours) to resolve
                complaint.setSlaDeadline(now.plusDays(7));
                complaintRepository.save(complaint);
                System.out.println("🚨 Escalated Complaint " + complaint.getComplaintNumber() + " to Department Head (Level 1)");
            } 
            else if (currentLevel == 1) {
                // Dept Head failed to resolve within extra 7 days. Escalate to Admin.
                complaint.setEscalationLevel(2);
                complaint.setEscalatedAt(now); // Set timestamp
                // Admin has no specific SLA deadline, but we could add another 7 days.
                complaint.setSlaDeadline(now.plusDays(7));
                complaintRepository.save(complaint);
                System.out.println("🚨 Escalated Complaint " + complaint.getComplaintNumber() + " to System Admin (Level 2)");
            }
            // If it's already level 2, it stays at admin level.
        }
    }
}
