package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "administrators")
@Data
@EqualsAndHashCode(callSuper = true)
public class Administrator extends User {
    @Column(unique = true)
    private String employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
}