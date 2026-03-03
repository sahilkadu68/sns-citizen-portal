package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categories")
@Data
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    private Integer slaHours = 48;
}