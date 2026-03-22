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

    @Autowired
    private com.sns.services.AuditService auditService;

    @Autowired
    private com.sns.repositories.RejectedDuplicateRepository rejectedDuplicateRepository;

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
    public Complaint updateStatus(Long id, Complaint.Status status, String notes, String proof) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        String oldStatus = complaint.getStatus().name();
        complaint.setStatus(status);

        if (status == Complaint.Status.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
            if (notes != null) {
                complaint.setResolutionNotes(notes);
            }
            if (proof != null) {
                complaint.setResolutionProof(proof);
            }
        } else if (status == Complaint.Status.CLOSED || status == Complaint.Status.REJECTED) {
            complaint.setClosedAt(LocalDateTime.now());
        }

        Complaint saved = complaintRepository.save(complaint);

        // Audit log
        auditService.log("STATUS_CHANGE", "system", saved.getComplaintId(), saved.getComplaintNumber(), oldStatus, status.name(), null);

        // Email notification to primary user
        if (saved.getUser() != null) {
            emailService.sendStatusUpdateEmail(
                    saved.getUser().getEmail(),
                    saved.getComplaintNumber(),
                    status.name(),
                    saved.getTitle()
            );
        }

        // F9: Also notify all linked duplicate complaint owners
        List<Complaint> linkedDuplicates = complaintRepository.findByParentComplaintId(saved.getComplaintId());
        for (Complaint dup : linkedDuplicates) {
            if (dup.getUser() != null) {
                dup.setStatus(status);
                if (status == Complaint.Status.RESOLVED) dup.setResolvedAt(LocalDateTime.now());
                if (status == Complaint.Status.CLOSED) dup.setClosedAt(LocalDateTime.now());
                complaintRepository.save(dup);
                emailService.sendStatusUpdateEmail(
                    dup.getUser().getEmail(),
                    dup.getComplaintNumber(),
                    status.name(),
                    saved.getTitle() + " (linked complaint)"
                );
            }
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
            auditService.log("ESCALATION", "system", complaint.getComplaintId(), complaint.getComplaintNumber(), 
                "Level " + currentLevel, "Level " + (currentLevel + 1), null);
        }
        return complaint;
    }

    /* =========================================================
       🔹 F9: SMART DUPLICATE DETECTION
       ========================================================= */

    /**
     * Category-specific search radius (in km).
     * Increased minimums to account for manual map pin placement imprecision.
     */
    private double getRadiusForCategory(String categoryName) {
        if (categoryName == null) return 0.1;
        String lower = categoryName.toLowerCase();
        if (lower.contains("road") || lower.contains("pothole") || lower.contains("footpath") || lower.contains("bridge"))
            return 0.03;   // 30 meters
        if (lower.contains("electric") || lower.contains("street light") || lower.contains("power"))
            return 0.05;  // 50 meters
        if (lower.contains("garbage") || lower.contains("sanitation") || lower.contains("waste") || lower.contains("sewage"))
            return 0.05;   // 50 meters
        if (lower.contains("traffic") || lower.contains("signal") || lower.contains("water") || lower.contains("drainage") || lower.contains("pipe"))
            return 0.1;   // 100 meters
        return 0.1; // 100m default for environment, noise, etc.
    }

    /**
     * Jaccard keyword overlap between two texts.
     * Returns a score between 0.0 and 1.0.
     */
    private double computeTextSimilarity(String text1, String text2) {
        if (text1 == null || text2 == null) return 0.0;
        java.util.Set<String> set1 = extractKeywords(text1);
        java.util.Set<String> set2 = extractKeywords(text2);

        // Fallback: if keyword extraction strips everything, use raw words (min 2 chars)
        if (set1.isEmpty()) set1 = extractRawWords(text1);
        if (set2.isEmpty()) set2 = extractRawWords(text2);
        if (set1.isEmpty() || set2.isEmpty()) return 0.0;

        java.util.Set<String> intersection = new java.util.HashSet<>(set1);
        intersection.retainAll(set2);

        java.util.Set<String> union = new java.util.HashSet<>(set1);
        union.addAll(set2);

        return (double) intersection.size() / union.size();
    }

    /**
     * Extracts meaningful keywords from text (lowercased, stopwords removed, min 3 chars).
     * Only removes true function words — NOT municipal-relevant nouns.
     */
    private java.util.Set<String> extractKeywords(String text) {
        java.util.Set<String> stopWords = java.util.Set.of(
            "the","a","an","is","are","was","were","in","on","at","to","for","of","and","or",
            "it","this","that","my","your","near","from","with","has","have","been","not","but",
            "very","also","there","please","here","some","can","about","need","sir","madam",
            "its","they","their","all","any","just","our","will","get","got","lot","many"
        );
        String[] words = text.toLowerCase().replaceAll("[^a-z0-9\\s]", "").split("\\s+");
        java.util.Set<String> keywords = new java.util.HashSet<>();
        for (String w : words) {
            if (w.length() >= 3 && !stopWords.contains(w)) {
                keywords.add(w);
            }
        }
        return keywords;
    }

    /** Fallback: raw words (min 2 chars, lowercased) when keyword extraction returns empty */
    private java.util.Set<String> extractRawWords(String text) {
        String[] words = text.toLowerCase().replaceAll("[^a-z0-9\\s]", "").split("\\s+");
        java.util.Set<String> result = new java.util.HashSet<>();
        for (String w : words) {
            if (w.length() >= 2) result.add(w);
        }
        return result;
    }

    /**
     * Finds potential duplicate complaints using:
     * 1. Same category
     * 2. Within category-specific distance
     * 3. Title+description keyword overlap >= 25%
     * 4. Submitted in last 30 days (PENDING) or 7 days (RESOLVED) [Unless historical=true]
     */
    public List<Map<String, Object>> findPotentialDuplicates(String categoryName, Double lat, Double lng, String title, String description, boolean historical) {
        com.sns.models.Category category = categoryRepository.findByName(categoryName).orElse(null);
        if (category == null) {
            System.out.println("🔍 DUPLICATE CHECK: Category '" + categoryName + "' NOT FOUND in DB");
            return List.of();
        }

        double radiusKm = getRadiusForCategory(categoryName);
        if (historical) radiusKm *= 2; // Broaden search for admins

        String newText = (title != null ? title : "") + " " + (description != null ? description : "");

        List<Complaint> allCandidates;
        if (historical) {
            allCandidates = complaintRepository.findByCategory(category);
            System.out.println("🔍 HISTORICAL SCAN: Category='" + categoryName + "', Radius=" + (radiusKm*1000) + "m, Total Candidates=" + allCandidates.size());
        } else {
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
            
            List<Complaint> pendingCandidates = complaintRepository.findByCategoryAndStatusAndSubmittedAtAfter(
                category, Complaint.Status.PENDING, thirtyDaysAgo);
            List<Complaint> resolvedCandidates = complaintRepository.findByCategoryAndStatusAndSubmittedAtAfter(
                category, Complaint.Status.RESOLVED, sevenDaysAgo);

            allCandidates = new java.util.ArrayList<>(pendingCandidates);
            allCandidates.addAll(resolvedCandidates);
        }

        List<Map<String, Object>> duplicates = new java.util.ArrayList<>();
        for (Complaint c : allCandidates) {
            double dist = distance(lat, lng, c.getLatitude(), c.getLongitude());
            if (dist > radiusKm) continue;

            String existingText = (c.getTitle() != null ? c.getTitle() : "") + " " + (c.getDescription() != null ? c.getDescription() : "");
            double similarity = computeTextSimilarity(newText, existingText);

            Map<String, Object> match = new java.util.HashMap<>();
            match.put("complaintId", c.getComplaintId());
            match.put("complaintNumber", c.getComplaintNumber());
            match.put("title", c.getTitle());
            match.put("description", c.getDescription());
            match.put("address", c.getAddress());
            match.put("status", c.getStatus().name());
            match.put("submittedAt", c.getSubmittedAt());
            match.put("distanceMeters", (int) Math.round(dist * 1000));
            match.put("similarityPercent", (int) Math.round(similarity * 100));
            match.put("duplicateCount", c.getDuplicateCount());
            match.put("parentComplaintId", c.getParentComplaintId());
            duplicates.add(match);
        }

        // Sort: highest similarity first
        duplicates.sort((a, b) -> ((Integer) b.get("similarityPercent")).compareTo((Integer) a.get("similarityPercent")));
        return duplicates;
    }

    // Backward-compatible overloads
    public List<Map<String, Object>> findPotentialDuplicates(String categoryName, Double lat, Double lng, String title, String description) {
        return findPotentialDuplicates(categoryName, lat, lng, title, description, false);
    }

    public List<Map<String, Object>> findPotentialDuplicates(String categoryName, Double lat, Double lng) {
        return findPotentialDuplicates(categoryName, lat, lng, null, null, false);
    }

    /**
     * F9: OPTIMIZED GLOBAL BATCH SCAN FOR ADMINS
     * Scans all active unlinked complaints, grouping them by category, sorting by latitude,
     * and strictly filtering by tight radius and >20% text similarity.
     * Skips pairs that the admin has previously rejected.
     */
    public List<Map<String, Object>> scanAllPotentialDuplicates() {
        List<Map<String, Object>> allClusters = new java.util.ArrayList<>();
        List<com.sns.models.Category> categories = categoryRepository.findAll();

        List<Complaint.Status> activeStatuses = List.of(Complaint.Status.PENDING, Complaint.Status.RESOLVED);

        for (com.sns.models.Category category : categories) {
            // Find all complaints in this category that are active and NOT already linked as duplicates
            List<Complaint> candidates = complaintRepository.findByCategoryAndStatusInAndParentComplaintIdIsNull(category, activeStatuses);
            
            if (candidates.size() < 2) continue;

            // Sort by latitude for spatial optimization (Sweep-line-like)
            candidates.sort(java.util.Comparator.comparingDouble(Complaint::getLatitude));
            double radiusKm = getRadiusForCategory(category.getName());

            java.util.Set<Long> alreadyGrouped = new java.util.HashSet<>();

            for (int i = 0; i < candidates.size(); i++) {
                Complaint anchor = candidates.get(i);
                if (alreadyGrouped.contains(anchor.getComplaintId())) continue;

                List<Complaint> potentialDuplicates = new java.util.ArrayList<>();
                
                // Only scan forward within the latitudinal radius bound
                for (int j = i + 1; j < candidates.size(); j++) {
                    Complaint target = candidates.get(j);
                    
                    if (alreadyGrouped.contains(target.getComplaintId())) continue;

                    // If latitude difference exceeds radius, break inner loop early (spatial optimization)
                    if (Math.abs(target.getLatitude() - anchor.getLatitude()) * 111.0 > radiusKm) {
                        break; 
                    }

                    // Check exact distance
                    double dist = distance(anchor.getLatitude(), anchor.getLongitude(), target.getLatitude(), target.getLongitude());
                    if (dist > radiusKm) continue;

                    // Check Rejected Table
                    Long id1 = Math.min(anchor.getComplaintId(), target.getComplaintId());
                    Long id2 = Math.max(anchor.getComplaintId(), target.getComplaintId());
                    if (rejectedDuplicateRepository.existsByComplaintId1AndComplaintId2(id1, id2)) {
                        continue;
                    }

                    // Check Strict Text Similarity
                    String text1 = (anchor.getTitle() != null ? anchor.getTitle() : "") + " " + (anchor.getDescription() != null ? anchor.getDescription() : "");
                    String text2 = (target.getTitle() != null ? target.getTitle() : "") + " " + (target.getDescription() != null ? target.getDescription() : "");
                    double similarity = computeTextSimilarity(text1, text2);

                    // Must be >= 20% similar OR identical location (<10m)
                    if (similarity >= 0.20 || dist < 0.01) {
                        potentialDuplicates.add(target);
                        alreadyGrouped.add(target.getComplaintId());
                    }
                }

                if (!potentialDuplicates.isEmpty()) {
                    List<Map<String, Object>> clusterItems = new java.util.ArrayList<>();
                    clusterItems.add(createSummaryMap(anchor));
                    for (Complaint d : potentialDuplicates) {
                        clusterItems.add(createSummaryMap(d));
                    }
                    
                    Map<String, Object> cluster = new java.util.HashMap<>();
                    cluster.put("anchor", createSummaryMap(anchor));
                    cluster.put("duplicates", potentialDuplicates.stream().map(this::createSummaryMap).toList());
                    cluster.put("category", category.getName());
                    allClusters.add(cluster);
                    
                    alreadyGrouped.add(anchor.getComplaintId());
                }
            }
        }
        return allClusters;
    }

    private Map<String, Object> createSummaryMap(Complaint c) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("complaintId", c.getComplaintId());
        map.put("complaintNumber", c.getComplaintNumber());
        map.put("title", c.getTitle());
        map.put("description", c.getDescription());
        map.put("address", c.getAddress());
        map.put("status", c.getStatus().name());
        map.put("submittedAt", c.getSubmittedAt());
        return map;
    }

    @org.springframework.transaction.annotation.Transactional
    public void rejectDuplicatePair(Long id1, Long id2) {
         com.sns.models.RejectedDuplicate rejected = new com.sns.models.RejectedDuplicate(id1, id2);
         if (!rejectedDuplicateRepository.existsByComplaintId1AndComplaintId2(rejected.getComplaintId1(), rejected.getComplaintId2())) {
             rejectedDuplicateRepository.save(rejected);
         }
    }

    @org.springframework.transaction.annotation.Transactional
    public void linkAsDuplicate(Long anchorId, Long duplicateId) {
        if (anchorId.equals(duplicateId)) return;

        Complaint anchor = complaintRepository.findById(anchorId)
            .orElseThrow(() -> new RuntimeException("Anchor report not found"));
        Complaint duplicate = complaintRepository.findById(duplicateId)
            .orElseThrow(() -> new RuntimeException("Duplicate report not found"));

        // Always merge into the "Original" (Anchor) of the cluster
        Long targetAnchorId = anchor.getParentComplaintId() != null ? anchor.getParentComplaintId() : anchorId;
        Complaint targetAnchor = (targetAnchorId.equals(anchorId)) ? anchor : getComplaintById(targetAnchorId);

        // If the report being linked already has its own duplicates, move them all to the ultimate anchor
        List<Complaint> associated = complaintRepository.findByParentComplaintId(duplicateId);
        for (Complaint comp : associated) {
            comp.setParentComplaintId(targetAnchorId);
            comp.setStatus(targetAnchor.getStatus());
            complaintRepository.save(comp);
        }

        // Link the duplicate report itself
        duplicate.setParentComplaintId(targetAnchorId);
        duplicate.setDuplicateCount(0); // Children have a count of 0
        duplicate.setStatus(targetAnchor.getStatus());
        complaintRepository.save(duplicate);

        // Update anchor's total count
        long totalDuplicates = complaintRepository.findByParentComplaintId(targetAnchorId).size();
        targetAnchor.setDuplicateCount((int) totalDuplicates);
        complaintRepository.save(targetAnchor);

        auditService.log("DUPLICATE_LINKED", "SYSTEM", targetAnchorId, targetAnchor.getComplaintNumber(),
            null, duplicate.getComplaintNumber(), "Consolidated reports into cluster");
    }

    /**
     * Returns all child complaints linked to a given parent (for admin panel).
     */
    public List<Map<String, Object>> getDuplicatesForComplaint(Long complaintId) {
        List<Complaint> linked = complaintRepository.findByParentComplaintId(complaintId);
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Complaint c : linked) {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("complaintId", c.getComplaintId());
            item.put("complaintNumber", c.getComplaintNumber());
            item.put("title", c.getTitle());
            item.put("status", c.getStatus().name());
            item.put("submittedAt", c.getSubmittedAt());
            item.put("citizenName", c.getUser() != null ? c.getUser().getFullName() : "Unknown");
            item.put("citizenEmail", c.getUser() != null ? c.getUser().getEmail() : "");
            result.add(item);
        }
        return result;
    }

    public Complaint saveComplaint(Complaint complaint) {
        return complaintRepository.save(complaint);
    }
}
