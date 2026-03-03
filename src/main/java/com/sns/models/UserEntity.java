package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@MappedSuperclass
@Data
public abstract class UserEntity {

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    private String phoneNumber;

    // 🔐 OTP-based verification
    @Column(length = 6)
    private String otp;

    private LocalDateTime otpExpiry;

    // Account enabled only after OTP verification
    @Column(nullable = false)
    private boolean enabled = false;
}
