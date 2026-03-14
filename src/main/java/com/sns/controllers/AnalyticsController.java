package com.sns.controllers;

import com.sns.models.Complaint;
import com.sns.repositories.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private com.sns.repositories.UserRepository userRepository;

    @Autowired
    private com.sns.repositories.DepartmentRepository departmentRepository;

    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> stats = new HashMap<>();
        List<Complaint> allComplaints = complaintRepository.findAll();

        long total = allComplaints.size();
        long resolved = allComplaints.stream().filter(c -> c.getStatus() == Complaint.Status.RESOLVED).count();
        long pending = allComplaints.stream().filter(c -> c.getStatus() == Complaint.Status.PENDING).count();

        long overdue = allComplaints.stream()
            .filter(c -> c.getStatus() == Complaint.Status.PENDING)
            .filter(c -> {
                boolean pastDeadline = c.getSlaDeadline() != null && c.getSlaDeadline().isBefore(LocalDateTime.now());
                boolean alreadyEscalated = c.getEscalationLevel() != null && c.getEscalationLevel() > 0;
                return pastDeadline || alreadyEscalated;
            })
            .count();

        // Average citizen rating
        double avgRating = allComplaints.stream()
            .filter(c -> c.getCitizenRating() != null)
            .mapToInt(Complaint::getCitizenRating)
            .average()
            .orElse(0.0);

        stats.put("total", total);
        stats.put("resolved", resolved);
        stats.put("pending", pending);
        stats.put("overdue", overdue);
        stats.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

        return stats;
    }

    // Public stats for landing page (NO AUTH REQUIRED)
    @GetMapping("/public-stats")
    public Map<String, Object> getPublicStats() {
        Map<String, Object> stats = new HashMap<>();
        List<Complaint> allComplaints = complaintRepository.findAll();

        stats.put("totalComplaints", allComplaints.size());
        stats.put("resolvedComplaints", allComplaints.stream()
            .filter(c -> c.getStatus() == Complaint.Status.RESOLVED || c.getStatus() == Complaint.Status.CLOSED)
            .count());
        stats.put("activeCitizens", userRepository.countByRole(com.sns.models.User.Role.ROLE_CITIZEN));
        stats.put("departments", departmentRepository.count());
        
        double avgRating = allComplaints.stream()
            .filter(c -> c.getCitizenRating() != null)
            .mapToInt(Complaint::getCitizenRating)
            .average()
            .orElse(0.0);
        stats.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

        return stats;
    }

    @GetMapping("/zone-performance")
    public List<Map<String, Object>> getZonePerformance() {
        List<Object[]> results = complaintRepository.countComplaintsByZone();
        return results.stream().map(obj -> Map.of(
            "name", obj[0],
            "value", obj[1]
        )).collect(Collectors.toList());
    }

    @GetMapping("/category-distribution")
    public List<Map<String, Object>> getCategoryDistribution() {
        List<Object[]> results = complaintRepository.countComplaintsByCategory();
        return results.stream().map(obj -> Map.of(
            "name", obj[0],
            "value", obj[1]
        )).collect(Collectors.toList());
    }

    @GetMapping("/daily-trend")
    public List<Map<String, Object>> getDailyTrend() {
        List<Object[]> lodgedData = complaintRepository.countComplaintsByDate();
        List<Object[]> resolvedData = complaintRepository.countResolvedByDate();
        
        Map<String, Map<String, Object>> mergedData = new java.util.TreeMap<>();
        
        for (Object[] row : lodgedData) {
            String date = row[0].toString();
            Long count = (Long) row[1];
            mergedData.putIfAbsent(date, new HashMap<>());
            mergedData.get(date).put("date", date);
            mergedData.get(date).put("lodged", count);
            mergedData.get(date).put("resolved", 0L);
        }
        
        for (Object[] row : resolvedData) {
            String date = row[0].toString();
            Long count = (Long) row[1];
            mergedData.putIfAbsent(date, new HashMap<>());
            mergedData.get(date).put("date", date);
            if (!mergedData.get(date).containsKey("lodged")) {
                mergedData.get(date).put("lodged", 0L);
            }
            mergedData.get(date).put("resolved", count);
        }
        
        return new ArrayList<>(mergedData.values()); 
    }
}
