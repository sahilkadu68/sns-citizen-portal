package com.sns.repositories;

import com.sns.models.Administrator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdministratorRepository extends JpaRepository<Administrator, Long> {
    Optional<Administrator> findByEmail(String email);
    java.util.List<Administrator> findByDepartmentAndRole(com.sns.models.Department department, com.sns.models.User.Role role);
}
