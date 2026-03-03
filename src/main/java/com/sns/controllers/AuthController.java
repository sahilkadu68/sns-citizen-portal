package com.sns.controllers;

import com.sns.models.Citizen;
import com.sns.models.User;
import com.sns.repositories.CitizenRepository;
import com.sns.security.JwtUtils;
import com.sns.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.sns.repositories.UserRepository;
import java.util.List;
import java.util.HashMap;
import java.util.stream.Collectors;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CitizenRepository citizenRepository;

    @Autowired
    private com.sns.repositories.UserRepository userRepository;


    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;
    

    
    @GetMapping("/debug/users")
    public ResponseEntity<?> debugUsers() {
        List<Map<String, String>> users = userRepository.findAll().stream().map(u -> {
            Map<String, String> m = new HashMap<>();
            m.put("email", u.getEmail());
            m.put("role", u.getRole() != null ? u.getRole().name() : "NULL");
            m.put("enabled", String.valueOf(u.isEnabled()));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.sns.repositories.AdministratorRepository administratorRepository;

    /* ===================== LOGIN ===================== */

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.get("email"),
                            loginRequest.get("password")
                    )
            );

            String jwt = jwtUtils.generateJwtToken(authentication);
            User user = userRepository.findByEmail(loginRequest.get("email")).orElseThrow();

            // Build detailed response
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("token", jwt);
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("mobileNumber", user.getPhoneNumber()); // Mapped from phoneNumber
            response.put("role", user.getRole().name());

            // Role-specific fields
            if (user.getRole() == User.Role.ROLE_CITIZEN) {
                citizenRepository.findByEmail(user.getEmail()).ifPresent(citizen -> {
                    response.put("address", citizen.getAddress());
                });
            } else if (user.getRole() == User.Role.ROLE_ADMIN || user.getRole() == User.Role.ROLE_DEPT_HEAD) {
                // Fetch Admin specific details
                administratorRepository.findByEmail(user.getEmail()).ifPresent(admin -> {
                    response.put("employeeId", admin.getEmployeeId());
                    if (admin.getDepartment() != null) {
                        response.put("department", Map.of("id", admin.getDepartment().getId(), "name", admin.getDepartment().getName()));
                    }
                });
            }

            return ResponseEntity.ok(response);

        } catch (AuthenticationException e) {
            System.out.println("❌ Authentication failed for email: " + loginRequest.get("email"));
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    /* ===================== PROFILE UPDATE ===================== */

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates) {
        String email = (String) updates.get("email"); // Ideally extract from JWT context, but passing for now
        if (email == null) return ResponseEntity.badRequest().body("Email required");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();

        if (updates.containsKey("fullName")) user.setFullName((String) updates.get("fullName"));
        if (updates.containsKey("mobileNumber")) user.setPhoneNumber((String) updates.get("mobileNumber"));

        // Role specific updates
        if (user.getRole() == User.Role.ROLE_CITIZEN) {
             Optional<Citizen> citizenOpt = citizenRepository.findByEmail(email);
             if (citizenOpt.isPresent()) {
                 Citizen citizen = citizenOpt.get();
                 // Sync base user fields
                 citizen.setFullName(user.getFullName());
                 citizen.setPhoneNumber(user.getPhoneNumber());
                 
                 if (updates.containsKey("address")) citizen.setAddress((String) updates.get("address"));
                 citizenRepository.save(citizen);
                 return ResponseEntity.ok(citizen);
             }
        } 
        
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
    
    /* ===================== REGISTER (SEND OTP) ===================== */

    @PostMapping("/register")
    public ResponseEntity<?> registerCitizen(@RequestBody Map<String, String> request) {

        String email = request.get("email");

        Optional<Citizen> existingUser = citizenRepository.findByEmail(email);
        Citizen citizen;

        // If already verified → block
        if (existingUser.isPresent() && existingUser.get().isEnabled()) {
            return ResponseEntity.badRequest()
                    .body("Email already registered and verified");
        }

        // Reuse existing unverified user OR create new
        citizen = existingUser.orElseGet(Citizen::new);

        citizen.setFullName(request.get("fullName"));
        citizen.setEmail(email);
        citizen.setPhoneNumber(request.get("phoneNumber"));
        citizen.setAddress(request.get("address"));
        citizen.setPasswordHash(encoder.encode(request.get("password")));
        citizen.setRole(User.Role.ROLE_CITIZEN);

        // OTP generation
        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        citizen.setOtp(otp);
        citizen.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        citizen.setEnabled(false);

        citizenRepository.save(citizen);

        emailService.sendOTPEmail(citizen.getEmail(), otp);

        return ResponseEntity.ok("OTP sent to email. Please verify.");
    }

    /* ===================== VERIFY OTP ===================== */

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {

        String email = request.get("email");
        String otp = request.get("otp");

        Optional<Citizen> optionalCitizen = citizenRepository.findByEmail(email);

        if (optionalCitizen.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Citizen citizen = optionalCitizen.get();

        if (citizen.getOtp() == null || !citizen.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body("Invalid OTP");
        }

        if (citizen.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("OTP expired");
        }

        // SUCCESS
        citizen.setEnabled(true);
        citizen.setOtp(null);
        citizen.setOtpExpiry(null);

        citizenRepository.save(citizen);

        return ResponseEntity.ok(Map.of("message", "User verified successfully"));
    }

    // ==========================================
    // 🚨 EMERGENCY FIX ENDPOINT
    // ==========================================
    @GetMapping("/fix-admin")
    public ResponseEntity<?> fixAdminUser() {
        String email = "admin@sns.gov.in";
        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent()) {
            User user = existing.get();
            // Force a known valid hash
            user.setPasswordHash(encoder.encode("admin123")); 
            user.setEnabled(true);
            user.setRole(User.Role.ROLE_ADMIN);
            userRepository.save(user);
            return ResponseEntity.ok("✅ Admin password reset to 'admin123'. Login now!");
        } else {
            return ResponseEntity.badRequest().body("❌ Admin user not found. Run the SQL INSERT first.");
        }
    }
}
