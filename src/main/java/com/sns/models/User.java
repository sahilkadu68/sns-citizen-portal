package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
@EqualsAndHashCode(callSuper = true)
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User extends UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Role role;

    // 🔐 OTP fields
    private String otp;

    private LocalDateTime otpExpiry;

    // 🔒 Verification flag
    private boolean enabled = false;

    public enum Role {
        ROLE_CITIZEN, ROLE_OFFICER, ROLE_ADMIN, ROLE_DEPT_HEAD
    }
}
