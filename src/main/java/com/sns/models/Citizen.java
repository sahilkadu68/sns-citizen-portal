package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "citizens")
@Data
@EqualsAndHashCode(callSuper = true)
public class Citizen extends User {

    private String address;

    // login-related (used later, NOT during registration)
    private Integer failedAttempts = 0;

    private Boolean accountLocked = false;
}
