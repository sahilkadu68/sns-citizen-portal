package com.sns.config;

import com.sns.models.Zone;
import com.sns.repositories.ZoneRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initZones(ZoneRepository zoneRepository) {
        return args -> {
            if (zoneRepository.count() == 0) {
                // ... (Keep existing zones, or I can just re-paste them) ...
                List<String> corporations = Arrays.asList(
                    "Brihanmumbai Municipal Corporation (BMC)",
                    "Thane Municipal Corporation (TMC)",
                    "Navi Mumbai Municipal Corporation (NMMC)",
                    "Kalyan-Dombivli Municipal Corporation (KDMC)",
                    "Mira-Bhayandar Municipal Corporation (MBMC)",
                    "Vasai-Virar City Municipal Corporation (VVCMC)",
                    "Ulhasnagar Municipal Corporation (UMC)",
                    "Bhiwandi-Nizampur City Municipal Corporation (BNCMC)",
                    "Panvel Municipal Corporation (PMC)",
                    
                    "Palghar Municipal Council",
                    "Ambarnath Municipal Council",
                    "Kulgaon-Badlapur Municipal Council",
                    "Alibaug Municipal Council",
                    "Pen Municipal Council",
                    "Matheran Municipal Council",
                    "Karjat Municipal Council",
                    "Khopoli Municipal Council",
                    "Uran Municipal Council"
                );

                for (String name : corporations) {
                    Zone zone = new Zone();
                    zone.setName(name);
                    zoneRepository.save(zone);
                }
                System.out.println("✅ Seeded " + corporations.size() + " Municipal Corporation Zones.");
            }
        };
    }

    @Bean
    CommandLineRunner initDepartments(com.sns.repositories.DepartmentRepository departmentRepository) {
        return args -> {
            List<String> depts = Arrays.asList(
                "Road Maintenance",
                "Garbage Collection",
                "Water Supply",
                "Electricity Issues",
                "Traffic Violations"
            );

            for (String name : depts) {
                if (departmentRepository.findByName(name).isEmpty()) {
                    com.sns.models.Department dept = new com.sns.models.Department();
                    dept.setName(name);
                    departmentRepository.save(dept);
                }
            }
            System.out.println("✅ Departments Seeded/Verified: " + depts.size());
        };
    }

    @Bean
    CommandLineRunner initDeptHeads(com.sns.repositories.UserRepository userRepository,
                                    com.sns.repositories.AdministratorRepository adminRepository,
                                    com.sns.repositories.DepartmentRepository departmentRepository,
                                    org.springframework.security.crypto.password.PasswordEncoder encoder) {
        return args -> {
            List<String> depts = Arrays.asList(
                "Road Maintenance",
                "Garbage Collection",
                "Water Supply",
                "Electricity Issues",
                "Traffic Violations"
            );

            for (String deptName : depts) {
                String prefix = deptName.toLowerCase().split(" ")[0]; // road, garbage, water, electricity, traffic
                String email = "head_" + prefix + "@sns.gov.in";
                
                if (userRepository.existsByEmail(email)) continue;

                departmentRepository.findByName(deptName).ifPresent(dept -> {
                    // Generate a short ID string
                    String shortCode = deptName.length() >= 3 ? deptName.toUpperCase().substring(0, 3) : "DEP";

                    // 1. Dept Head
                    com.sns.models.Administrator head = new com.sns.models.Administrator();
                    head.setFullName("Head of " + deptName);
                    head.setEmail(email);
                    head.setPasswordHash(encoder.encode("password123"));
                    head.setPhoneNumber("9999999999");
                    head.setRole(com.sns.models.User.Role.ROLE_DEPT_HEAD);
                    head.setEnabled(true);
                    head.setEmployeeId("EMP-HEAD-" + shortCode + "-001");
                    head.setDepartment(dept);
                    adminRepository.save(head);
                    System.out.println("👤 Created Dept Head: " + email);

                    // 2. Officer
                    String officerEmail = "officer_" + prefix + "@sns.gov.in";
                    if (!userRepository.existsByEmail(officerEmail)) {
                        com.sns.models.Administrator officer = new com.sns.models.Administrator();
                        officer.setFullName("Officer of " + deptName);
                        officer.setEmail(officerEmail);
                        officer.setPasswordHash(encoder.encode("password123"));
                        officer.setPhoneNumber("8888888888");
                        officer.setRole(com.sns.models.User.Role.ROLE_OFFICER);
                        officer.setEnabled(true);
                        officer.setEmployeeId("EMP-OFF-" + shortCode + "-001");
                        officer.setDepartment(dept);
                        adminRepository.save(officer);
                        System.out.println("👤 Created Officer: " + officerEmail);
                    }
                });
            }
        };
    }

    @Bean
    CommandLineRunner migrateObsoleteStatuses(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // By default, Hibernate might have auto-generated the column as an ENUM or a restricted type causing Truncation.
                // Step 1: Force column to be a standard string
                jdbcTemplate.execute("ALTER TABLE complaints MODIFY status VARCHAR(50)");
                System.out.println("✅ Status column relaxed to VARCHAR(50).");
                
                jdbcTemplate.execute("ALTER TABLE users MODIFY role VARCHAR(50)");
                System.out.println("✅ Role column relaxed to VARCHAR(50).");

                // Step 2: Migrate obsolete values
                int updated = jdbcTemplate.update(
                        "UPDATE complaints SET status = 'PENDING' WHERE status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED')"
                );
                if (updated > 0) {
                    System.out.println("✅ Migrated " + updated + " obsolete status values to PENDING.");
                }
            } catch (Exception e) {
                System.err.println("⚠️ Could not migrate status values: " + e.getMessage());
            }
        };
    }

    @Bean
    CommandLineRunner backfillComplaints(com.sns.repositories.ComplaintRepository complaintRepository,
                                         com.sns.repositories.DepartmentRepository departmentRepository,
                                         org.springframework.transaction.support.TransactionTemplate transactionTemplate) {
        return args -> {
            transactionTemplate.execute(status -> {
                List<com.sns.models.Complaint> complaints = complaintRepository.findAll();
                for (com.sns.models.Complaint c : complaints) {
                    if (c.getDepartment() == null && c.getCategory() != null) {
                        departmentRepository.findByName(c.getCategory().getName()).ifPresent(dept -> {
                            c.setDepartment(dept);
                            complaintRepository.save(c);
                            System.out.println("🔄 Linked Complaint " + c.getComplaintNumber() + " to Department: " + dept.getName());
                        });
                    }
                }
                return null;
            });
        };
    }
}
