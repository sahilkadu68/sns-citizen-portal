package com.sns.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "rejected_duplicates", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"complaint_id_1", "complaint_id_2"})
})
@Data
@NoArgsConstructor
public class RejectedDuplicate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Use smaller ID first to guarantee uniqueness via symmetric saving
    @Column(name = "complaint_id_1", nullable = false)
    private Long complaintId1;

    @Column(name = "complaint_id_2", nullable = false)
    private Long complaintId2;

    @Column(nullable = false, updatable = false)
    private LocalDateTime rejectedAt = LocalDateTime.now();

    public RejectedDuplicate(Long idA, Long idB) {
        if (idA < idB) {
            this.complaintId1 = idA;
            this.complaintId2 = idB;
        } else {
            this.complaintId1 = idB;
            this.complaintId2 = idA;
        }
    }
}
