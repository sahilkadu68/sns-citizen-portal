package com.sns.controllers;

import com.sns.models.Complaint;
import com.sns.services.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    // ===============================
    // LODGE COMPLAINT (CITIZEN)
    // ===============================
    @PostMapping("/lodge")
    @PreAuthorize("hasAuthority('ROLE_CITIZEN')")
    public ResponseEntity<?> lodgeComplaint(
            @RequestBody Complaint complaint,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        try {
            System.out.println("AUTH USER: " + principal.getUsername());
            String email = principal.getUsername();
            Complaint saved = complaintService.submitComplaint(
                    complaint,
                    email
            );
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error lodging complaint: " + e.getMessage());
        }
    }


    // ===============================
    // RESOLVE COMPLAINT (ADMIN / OFFICER)
    // ===============================
    // ===============================
    // RESOLVE COMPLAINT (ADMIN / OFFICER)
    // ===============================
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD') or hasAuthority('ROLE_OFFICER')")
    public ResponseEntity<?> resolveComplaint(
            @PathVariable Long id,
            @RequestParam("status") String status,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "proof", required = false) org.springframework.web.multipart.MultipartFile proof
    ) {
        String proofBase64 = null;
        if (proof != null && !proof.isEmpty()) {
            try {
                byte[] bytes = proof.getBytes();
                proofBase64 = "data:" + proof.getContentType() + ";base64," + java.util.Base64.getEncoder().encodeToString(bytes);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error uploading proof");
            }
        }

        Complaint.Status complaintStatus = Complaint.Status.valueOf(status);
        Complaint updated = complaintService.updateStatus(id, complaintStatus, notes, proofBase64);

        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/escalate")
    @PreAuthorize("hasAuthority('ROLE_DEPT_HEAD') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> escalateComplaint(@PathVariable Long id) {
        Complaint updated = complaintService.escalateComplaint(id);
        return ResponseEntity.ok(updated);
    }

    // ===============================
    // CONFIRM RESOLUTION (CITIZEN)
    // ===============================
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority('ROLE_CITIZEN')")
    public ResponseEntity<?> confirmResolution(@PathVariable Long id) {
        complaintService.updateStatus(id, Complaint.Status.CLOSED, null, null);
        return ResponseEntity.ok("Complaint successfully closed.");
    }

    // ===============================
    // ADMIN – ALL COMPLAINTS
    // ===============================
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()") // Changed temporarily to isolate 403 source
    public ResponseEntity<?> getAllComplaints(Authentication authentication) {
        
        // Manual authorization check for debugging
        boolean hasAccess = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_DEPT_HEAD") || a.getAuthority().equals("ROLE_OFFICER"));
        
        if (!hasAccess) {
            return ResponseEntity.status(403).body("Manual 403: User lacks ADMIN, DEPT_HEAD, or OFFICER roles");
        }

        String email = authentication.getName();
        return ResponseEntity.ok(complaintService.getAllComplaintsByEmail(email));
    }

    // ===============================
    // GET COMPLAINT BY ID
    // ===============================
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()") // Allow Admins, Dept Heads, and Citizen Owners
    public ResponseEntity<?> getComplaintById(@PathVariable Long id, Authentication authentication) {
        // ideally strict ownership check, but for now allowing authenticated users to view details for simplicity
        // or check service Logic
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    // ===============================
    // CITIZEN – MY COMPLAINTS
    // ===============================
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_CITIZEN')")
    public ResponseEntity<?> getMyComplaints(Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.getComplaintsByUserEmail(authentication.getName())
        );
    }

    // ===============================
    // CITIZEN – RATE & FEEDBACK
    // ===============================
    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasAuthority('ROLE_CITIZEN')")
    public ResponseEntity<?> submitFeedback(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            Complaint complaint = complaintService.getComplaintById(id);
            
            // Verify ownership
            if (!complaint.getUser().getEmail().equals(authentication.getName())) {
                return ResponseEntity.status(403).body("You can only rate your own complaints");
            }
            // Only allow rating on resolved/closed complaints
            if (complaint.getStatus() != Complaint.Status.RESOLVED && complaint.getStatus() != Complaint.Status.CLOSED) {
                return ResponseEntity.badRequest().body("Can only rate resolved/closed complaints");
            }
            
            Integer rating = (Integer) body.get("rating");
            String feedback = (String) body.get("feedback");
            
            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
            }
            
            complaint.setCitizenRating(rating);
            complaint.setCitizenFeedback(feedback);
            complaintService.saveComplaint(complaint);
            
            return ResponseEntity.ok(java.util.Map.of("message", "Feedback submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ===============================
    // F9: DUPLICATE DETECTION
    // ===============================
    @PostMapping("/check-duplicates")
    @PreAuthorize("hasAuthority('ROLE_CITIZEN')")
    public ResponseEntity<?> checkDuplicates(@RequestBody java.util.Map<String, Object> body) {
        String category = (String) body.get("category");
        Double lat = Double.parseDouble(body.get("latitude").toString());
        Double lng = Double.parseDouble(body.get("longitude").toString());
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        
        return ResponseEntity.ok(complaintService.findPotentialDuplicates(category, lat, lng, title, description));
    }

    @GetMapping("/{id}/find-similar")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD') or hasAuthority('ROLE_OFFICER')")
    public ResponseEntity<?> findSimilarComplaints(@PathVariable Long id) {
        try {
            Complaint complaint = complaintService.getComplaintById(id);
            String categoryName = complaint.getCategory() != null ? complaint.getCategory().getName() : null;
            if (categoryName == null) {
                return ResponseEntity.ok(java.util.List.of());
            }
            java.util.List<java.util.Map<String, Object>> similar = complaintService.findPotentialDuplicates(
                categoryName, complaint.getLatitude(), complaint.getLongitude(),
                complaint.getTitle(), complaint.getDescription(), true
            );
            // Exclude the complaint itself from results
            similar.removeIf(m -> m.get("complaintId").equals(complaint.getComplaintId()));
            return ResponseEntity.ok(similar);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/duplicates")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD') or hasAuthority('ROLE_OFFICER')")
    public ResponseEntity<?> getDuplicatesForComplaint(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getDuplicatesForComplaint(id));
    }

    // F9: Batch Validation
    @GetMapping("/admin/scan-duplicates")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD')")
    public ResponseEntity<?> scanAllPotentialDuplicates() {
        try {
            return ResponseEntity.ok(complaintService.scanAllPotentialDuplicates());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/admin/reject-duplicate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD')")
    public ResponseEntity<?> rejectDuplicatePair(@RequestBody java.util.Map<String, Object> body) {
        try {
            Long id1 = Long.parseLong(body.get("complaintId1").toString());
            Long id2 = Long.parseLong(body.get("complaintId2").toString());
            complaintService.rejectDuplicatePair(id1, id2);
            return ResponseEntity.ok(java.util.Map.of("message", "Pair rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/merge-duplicate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DEPT_HEAD')")
    public ResponseEntity<?> mergeDuplicate(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        try {
            Long childId = Long.parseLong(body.get("childComplaintId").toString());
            complaintService.linkAsDuplicate(id, childId);
            return ResponseEntity.ok(java.util.Map.of("message", "Complaints merged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{parentId}/link-duplicate")
    @PreAuthorize("hasAuthority('ROLE_CITIZEN')")
    public ResponseEntity<?> linkDuplicate(
            @PathVariable Long parentId,
            @RequestBody java.util.Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            Complaint child = complaintService.submitComplaint(
                buildComplaintFromBody(body), authentication.getName());
            complaintService.linkAsDuplicate(parentId, child.getComplaintId());
            return ResponseEntity.ok(java.util.Map.of(
                "message", "Your complaint has been linked to an existing report. You'll receive updates when it's resolved.",
                "parentComplaintId", parentId,
                "yourComplaintId", child.getComplaintId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    private Complaint buildComplaintFromBody(java.util.Map<String, Object> body) {
        Complaint c = new Complaint();
        c.setTitle((String) body.get("title"));
        c.setDescription((String) body.get("description"));
        c.setAddress((String) body.get("address"));
        c.setLatitude(Double.parseDouble(body.get("latitude").toString()));
        c.setLongitude(Double.parseDouble(body.get("longitude").toString()));
        c.setPriority(Complaint.Priority.valueOf(body.get("priority").toString()));
        
        com.sns.models.Category cat = new com.sns.models.Category();
        cat.setName((String) body.get("category"));
        c.setCategory(cat);
        
        if (body.get("imageUrl") != null) c.setImageUrl((String) body.get("imageUrl"));
        return c;
    }
}

