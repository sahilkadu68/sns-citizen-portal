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
        Complaint updated = complaintService.updateStatus(id, complaintStatus, proofBase64);

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
        complaintService.updateStatus(id, Complaint.Status.CLOSED, null);
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
}
