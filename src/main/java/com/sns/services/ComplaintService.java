package com.sns.services;

import com.sns.models.Complaint;
import com.sns.models.Zone;
import com.sns.models.User;
import com.sns.repositories.ComplaintRepository;
import com.sns.repositories.ZoneRepository;
import com.sns.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.sns.repositories.CategoryRepository categoryRepository;

    @Autowired
    private com.sns.repositories.DepartmentRepository departmentRepository;

    @Autowired
    private com.sns.repositories.AdministratorRepository administratorRepository;

    @Autowired
    private EmailService emailService;

    /* =========================================================
       🔹 MAIN METHOD CALLED BY CONTROLLER
       ========================================================= */
    public Complaint createComplaintFromPayload(
            Map<String, Object> payload,
            String email
    ) {
        Complaint complaint = new Complaint();

        complaint.setTitle((String) payload.get("title"));
        complaint.setDescription((String) payload.get("description"));
        complaint.setAddress((String) payload.get("address"));
        complaint.setPriority(
                Complaint.Priority.valueOf(
                        payload.get("priority").toString()
                )
        );

        complaint.setLatitude(
                Double.parseDouble(payload.get("latitude").toString())
        );
        complaint.setLongitude(
                Double.parseDouble(payload.get("longitude").toString())
        );

        return submitComplaint(complaint, email);
    }

    /* =========================================================
       🔹 CORE SAVE LOGIC
       ========================================================= */
    public Complaint submitComplaint(Complaint complaint, String email) {

        // Attach logged-in user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        complaint.setUser(user);

        // Assign zone
        Zone zone = findZoneByCoordinates(
                complaint.getLatitude(),
                complaint.getLongitude()
        );
        complaint.setZone(zone);

        // 🕒 SET SLA DEADLINE BASED ON PRIORITY
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        switch (complaint.getPriority()) {
            case URGENT:
                complaint.setSlaDeadline(now.plusHours(24));
                break;
            case HIGH:
                complaint.setSlaDeadline(now.plusHours(48));
                break;
            case MEDIUM:
                complaint.setSlaDeadline(now.plusHours(72));
                break;
            case LOW:
                complaint.setSlaDeadline(now.plusDays(7));
                break;
            default: // Default to Medium
                complaint.setSlaDeadline(now.plusHours(72));
        }

        // Link Category (Fix for transient/detached entity error)
        if (complaint.getCategory() != null && complaint.getCategory().getName() != null) {
            String catName = complaint.getCategory().getName();
            com.sns.models.Category existingCategory = categoryRepository.findByName(catName)
                    .orElseGet(() -> {
                        // Auto-seed category if it doesn't exist
                        com.sns.models.Category newCat = new com.sns.models.Category();
                        newCat.setName(catName);
                        newCat.setDescription("Auto-generated category");
                        newCat.setSlaHours(48); // default
                        return categoryRepository.save(newCat);
                    });
            complaint.setCategory(existingCategory);

            // Link Department (Category Name matches Department Name in DataInitializer)
            departmentRepository.findByName(catName).ifPresent(dept -> {
                complaint.setDepartment(dept);
                
                // Auto-Assignment Logic
                List<com.sns.models.Administrator> officers = administratorRepository.findByDepartmentAndRole(dept, User.Role.ROLE_OFFICER);
                if (!officers.isEmpty()) {
                    com.sns.models.Administrator leastLoadedOfficer = null;
                    long minLoad = Long.MAX_VALUE;
                    
                    List<Complaint.Status> activeStatuses = List.of(Complaint.Status.PENDING, Complaint.Status.RESOLVED);
                    
                    for (com.sns.models.Administrator officer : officers) {
                        long load = complaintRepository.countByAssignedToAndStatusIn(officer, activeStatuses);
                        if (load < minLoad) {
                            minLoad = load;
                            leastLoadedOfficer = officer;
                        }
                    }
                    
                    complaint.setAssignedTo(leastLoadedOfficer);
                    System.out.println("✅ Auto-Assigned Complaint to Officer: " + leastLoadedOfficer.getEmail() + " (Load: " + minLoad + ")");
                } else {
                    System.out.println("⚠️ No active Officers found in department: " + dept.getName() + ". Complaint unassigned.");
                }
            });
        } else {
            throw new RuntimeException("Complaint category is required");
        }

        // Generate complaint number
        long count = complaintRepository.count() + 1;
        String complaintNumber = "SNS-2025-" + String.format("%04d", count);
        complaint.setComplaintNumber(complaintNumber);

        // Defaults
        complaint.setStatus(Complaint.Status.PENDING);
        complaint.setSubmittedAt(LocalDateTime.now());
        complaint.setAssignedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);

        // Email confirmation
        emailService.sendStatusUpdateEmail(
                user.getEmail(),
                saved.getComplaintNumber(),
                "PENDING",
                saved.getTitle()
        );

        return saved;
    }

    /* =========================================================
       🔹 ZONE FINDER (MUNICIPAL CORPORATIONS)
       ========================================================= */
    
    // MMR Bounds
    private static final double MMR_LAT_MIN = 18.8500;
    private static final double MMR_LAT_MAX = 19.3500;
    private static final double MMR_LNG_MIN = 72.7500;
    private static final double MMR_LNG_MAX = 73.2500;

    // Hardcoded centers for zones (Simplified Logic - In real app use Polygon containment)
    private static final Map<String, double[]> ZONE_CENTERS = new HashMap<>();
    static {
        // Municipal Corporations
        ZONE_CENTERS.put("Brihanmumbai Municipal Corporation (BMC)", new double[]{19.0760, 72.8777});
        ZONE_CENTERS.put("Thane Municipal Corporation (TMC)", new double[]{19.2183, 72.9781});
        ZONE_CENTERS.put("Navi Mumbai Municipal Corporation (NMMC)", new double[]{19.0330, 73.0297});
        ZONE_CENTERS.put("Kalyan-Dombivli Municipal Corporation (KDMC)", new double[]{19.2403, 73.1305});
        ZONE_CENTERS.put("Mira-Bhayandar Municipal Corporation (MBMC)", new double[]{19.2813, 72.8561});
        ZONE_CENTERS.put("Vasai-Virar City Municipal Corporation (VVCMC)", new double[]{19.3919, 72.8397});
        ZONE_CENTERS.put("Ulhasnagar Municipal Corporation (UMC)", new double[]{19.2215, 73.1645});
        ZONE_CENTERS.put("Bhiwandi-Nizampur City Municipal Corporation (BNCMC)", new double[]{19.2969, 73.0631});
        ZONE_CENTERS.put("Panvel Municipal Corporation (PMC)", new double[]{18.9894, 73.1175});

        // Municipal Councils
        ZONE_CENTERS.put("Palghar Municipal Council", new double[]{19.6936, 72.7655});
        ZONE_CENTERS.put("Ambarnath Municipal Council", new double[]{19.1825, 73.1926});
        ZONE_CENTERS.put("Kulgaon-Badlapur Municipal Council", new double[]{19.1551, 73.2650});
        ZONE_CENTERS.put("Alibaug Municipal Council", new double[]{18.6414, 72.8722});
        ZONE_CENTERS.put("Pen Municipal Council", new double[]{18.7300, 73.0800});
        ZONE_CENTERS.put("Matheran Municipal Council", new double[]{18.9860, 73.2670});
        ZONE_CENTERS.put("Karjat Municipal Council", new double[]{18.9100, 73.3300});
        ZONE_CENTERS.put("Khopoli Municipal Council", new double[]{18.7842, 73.3444});
        ZONE_CENTERS.put("Uran Municipal Council", new double[]{18.8870, 72.9370});
    }

    private void validateLocation(Double lat, Double lng) {
        if (lat < MMR_LAT_MIN || lat > MMR_LAT_MAX || lng < MMR_LNG_MIN || lng > MMR_LNG_MAX) {
            throw new RuntimeException("Complaint location is outside the Mumbai Metropolitan Region (MMR).");
        }
    }

    private Zone findZoneByCoordinates(Double lat, Double lng) {
        validateLocation(lat, lng);

        // Ensure zones exist in DB
        if (zoneRepository.count() == 0) {
            seedZones();
        }

        // Find nearest zone center
        String nearestZone = "Brihanmumbai Municipal Corporation (BMC)";
        double minDistance = Double.MAX_VALUE;

        for (Map.Entry<String, double[]> entry : ZONE_CENTERS.entrySet()) {
            double[] center = entry.getValue();
            double dist = distance(lat, lng, center[0], center[1]);
            if (dist < minDistance) {
                minDistance = dist;
                nearestZone = entry.getKey();
            }
        }

        return zoneRepository.findByName(nearestZone); // Assuming findByName exists or we add it
    }

    private void seedZones() {
        for (String name : ZONE_CENTERS.keySet()) {
            Zone z = new Zone();
            z.setName(name);
            zoneRepository.save(z);
        }
    }

    // Haversine formula for distance
    private double distance(double lat1, double lon1, double lat2, double lon2) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        } else {
            double theta = lon1 - lon2;
            double dist = Math.sin(Math.toRadians(lat1)) * Math.sin(Math.toRadians(lat2)) + 
                          Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.cos(Math.toRadians(theta));
            dist = Math.acos(dist);
            dist = Math.toDegrees(dist);
            dist = dist * 60 * 1.1515;
            return (dist * 1.609344); // Kilometers
        }
    }

    /* =========================================================
       🔹 FETCH METHODS
       ========================================================= */
    public List<Complaint> getAllComplaints(User user) {
        if (user.getRole() == User.Role.ROLE_ADMIN) {
            return complaintRepository.findAll();
        } else if (user.getRole() == User.Role.ROLE_DEPT_HEAD || user.getRole() == User.Role.ROLE_OFFICER) {
            if (user instanceof com.sns.models.Administrator) {
                com.sns.models.Administrator admin = (com.sns.models.Administrator) user;
                
                if (user.getRole() == User.Role.ROLE_OFFICER) {
                    // Officers only see complaints explicitly assigned to them
                    return complaintRepository.findByAssignedTo(admin);
                } else if (admin.getDepartment() != null) {
                    // Dept Heads see all complaints for their department
                    return complaintRepository.findByDepartmentId(admin.getDepartment().getId());
                }
            }
            return List.of();
        }
        return List.of();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Complaint> getAllComplaintsByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return getAllComplaints(user);
    }

    public List<Complaint> getComplaintsByUserEmail(String email) {
        return complaintRepository.findByUserEmail(email);
    }

    public Complaint getComplaintById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
    }

    /* =========================================================
       🔹 DASHBOARD STATS
       ========================================================= */
    public Map<String, Long> getComplaintStats() {
        Map<String, Long> stats = new HashMap<>();
        List<Complaint> complaints = complaintRepository.findAll();

        for (Complaint.Status s : Complaint.Status.values()) {
            stats.put(
                    s.name(),
                    complaints.stream()
                            .filter(c -> c.getStatus() == s)
                            .count()
            );
        }
        return stats;
    }

    /* =========================================================
       🔹 UPDATE STATUS (USED BY CONTROLLER)
       ========================================================= */
    public Complaint updateStatus(Long id, Complaint.Status status, String proof) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus(status);

        if (status == Complaint.Status.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
            if (proof != null) {
                complaint.setResolutionProof(proof); // Store Base64
            }
        } else if (status == Complaint.Status.CLOSED || status == Complaint.Status.REJECTED) {
            complaint.setClosedAt(LocalDateTime.now());
        }

        Complaint saved = complaintRepository.save(complaint);

        // Email notification
        if (saved.getUser() != null) {
            emailService.sendStatusUpdateEmail(
                    saved.getUser().getEmail(),
                    saved.getComplaintNumber(),
                    status.name(),
                    saved.getTitle()
            );
        }

        return saved;
    }

    public Complaint escalateComplaint(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Integer currentLevel = complaint.getEscalationLevel() != null ? complaint.getEscalationLevel() : 0;
        if (currentLevel < 2) {
            complaint.setEscalationLevel(currentLevel + 1);
            complaint.setEscalatedAt(LocalDateTime.now());
            complaint.setSlaDeadline(LocalDateTime.now().plusDays(7));
            complaintRepository.save(complaint);
        }
        return complaint;
    }
}
