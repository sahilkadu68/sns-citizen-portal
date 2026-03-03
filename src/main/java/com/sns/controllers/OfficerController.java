package com.sns.controllers;

import com.sns.models.Administrator;
import com.sns.models.Department;
import com.sns.models.User;
import com.sns.repositories.AdministratorRepository;
import com.sns.repositories.DepartmentRepository;
import com.sns.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/officers")
public class OfficerController {

    @Autowired
    private AdministratorRepository administratorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder encoder;

    // Get all officers for the logged-in Department Head's department
    @GetMapping("/department")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOfficersForDepartment() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DEPT_HEAD") || a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("message", "403 Forbidden: You must be a Dept Head or Admin."));
        }

        String currentUserEmail = auth.getName();
        Administrator deptHead = administratorRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Depart Head not found"));

        if (deptHead.getDepartment() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Department Head is not assigned to any department."));
        }

        List<Administrator> officers = administratorRepository.findByDepartmentAndRole(deptHead.getDepartment(), User.Role.ROLE_OFFICER);
        
        // Return without password hashes
        List<Map<String, Object>> response = officers.stream().map(o -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", o.getId());
            map.put("fullName", o.getFullName());
            map.put("email", o.getEmail());
            map.put("phoneNumber", o.getPhoneNumber());
            map.put("employeeId", o.getEmployeeId() != null ? o.getEmployeeId() : "");
            map.put("role", o.getRole().name());
            return map;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Add a new Officer to the logged-in Department Head's department
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addOfficer(@RequestBody Map<String, String> payload) {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DEPT_HEAD") || a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("message", "403 Forbidden: You must be a Dept Head or Admin."));
        }

        String currentUserEmail = auth.getName();
        Administrator deptHead = administratorRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Depart Head not found"));

        Department department = deptHead.getDepartment();
        if (department == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Department Head is not assigned to any department."));
        }

        if (userRepository.existsByEmail(payload.get("email"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: Email is already in use!"));
        }

        Administrator officer = new Administrator();
        officer.setFullName(payload.get("fullName"));
        officer.setEmail(payload.get("email"));
        officer.setPhoneNumber(payload.get("phoneNumber"));
        officer.setPasswordHash(encoder.encode(payload.get("password")));
        officer.setRole(User.Role.ROLE_OFFICER);
        officer.setEnabled(true);
        officer.setDepartment(department);
        
        // Optional custom employee ID if provided
        if (payload.containsKey("employeeId") && !payload.get("employeeId").isEmpty()) {
            officer.setEmployeeId(payload.get("employeeId"));
        } else {
            // Generate basic employee ID
            officer.setEmployeeId("OFF-" + System.currentTimeMillis() % 10000);
        }

        administratorRepository.save(officer);

        return ResponseEntity.ok(Map.of("message", "Officer added successfully to " + department.getName()));
    }

    // Delete an Officer
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteOfficer(@PathVariable Long id) {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DEPT_HEAD") || a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("message", "403 Forbidden: You must be a Dept Head or Admin."));
        }

        String currentUserEmail = auth.getName();
        Administrator deptHead = administratorRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Depart Head not found"));

        Administrator officer = administratorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Officer not found"));

        // Ensure the Dept Head is only deleting officers from their own department
        if (officer.getDepartment() == null || deptHead.getDepartment() == null ||
                !officer.getDepartment().getId().equals(deptHead.getDepartment().getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Error: You can only delete officers from your own department."));
        }
        
        if (officer.getRole() != User.Role.ROLE_OFFICER) {
             return ResponseEntity.status(403).body(Map.of("message", "Error: You can only delete Officers."));
        }

        administratorRepository.delete(officer);
        return ResponseEntity.ok(Map.of("message", "Officer deleted successfully"));
    }
}
