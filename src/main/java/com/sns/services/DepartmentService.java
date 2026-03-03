package com.sns.services;

import com.sns.models.Department;
import com.sns.repositories.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    @Autowired
    private com.sns.repositories.AdministratorRepository administratorRepository;

    @Autowired
    private com.sns.repositories.CategoryRepository categoryRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @org.springframework.transaction.annotation.Transactional
    public Department createDepartment(Department department) {
        if (departmentRepository.findByName(department.getName()).isPresent()) {
            throw new IllegalArgumentException("Department with this name already exists");
        }

        if (department.getContactEmail() == null || department.getContactEmail().isEmpty()) {
            throw new IllegalArgumentException("Contact Email is required to create a Department Head user.");
        }

        Department savedDept = departmentRepository.save(department);

        // 1. Create a Department Head user automatically
        com.sns.models.Administrator head = new com.sns.models.Administrator();
        head.setFullName("Head of " + savedDept.getName());
        head.setEmail(savedDept.getContactEmail());
        head.setPasswordHash(passwordEncoder.encode("password123")); // Default password
        head.setPhoneNumber(savedDept.getContactPhone() != null && !savedDept.getContactPhone().isEmpty() ? savedDept.getContactPhone() : "0000000000");
        head.setRole(com.sns.models.User.Role.ROLE_DEPT_HEAD);
        head.setEnabled(true);
        String shortCode = savedDept.getName().length() >= 3 ? savedDept.getName().substring(0, 3).toUpperCase() : "DEP";
        head.setEmployeeId("EMP-HEAD-" + shortCode + "-" + System.currentTimeMillis() % 1000);
        head.setDepartment(savedDept);
        administratorRepository.save(head);

        // 2. Create an Officer automatically
        String officerEmail = "officer." + savedDept.getContactEmail();
        com.sns.models.Administrator officer = new com.sns.models.Administrator();
        officer.setFullName("Officer of " + savedDept.getName());
        officer.setEmail(officerEmail);
        officer.setPasswordHash(passwordEncoder.encode("password123"));
        officer.setPhoneNumber(head.getPhoneNumber());
        officer.setRole(com.sns.models.User.Role.ROLE_OFFICER);
        officer.setEnabled(true);
        officer.setEmployeeId("EMP-OFF-" + shortCode + "-" + System.currentTimeMillis() % 1000);
        officer.setDepartment(savedDept);
        administratorRepository.save(officer);

        // 3. Create a mapped Category for citizen complaints automatically
        if (categoryRepository.findByName(savedDept.getName()).isEmpty()) {
            com.sns.models.Category cat = new com.sns.models.Category();
            cat.setName(savedDept.getName());
            cat.setDescription(savedDept.getDescription() != null ? savedDept.getDescription() : savedDept.getName());
            categoryRepository.save(cat);
        }

        return savedDept;
    }

    public Department updateDepartment(Long id, Department departmentDetails) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with id: " + id));

        // Optional: Check if the new name conflicts with an existing department
        if (!department.getName().equals(departmentDetails.getName()) &&
                departmentRepository.findByName(departmentDetails.getName()).isPresent()) {
            throw new IllegalArgumentException("Another department with this name already exists");
        }

        department.setName(departmentDetails.getName());
        department.setDescription(departmentDetails.getDescription());
        department.setContactEmail(departmentDetails.getContactEmail());
        department.setContactPhone(departmentDetails.getContactPhone());

        return departmentRepository.save(department);
    }

    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with id: " + id));
        
        // TODO: Add check for existing administrators or complaints before deletion if required by business logic.
        // E.g. if (!department.getAdministrators().isEmpty()) throw exception...

        departmentRepository.delete(department);
    }
}
