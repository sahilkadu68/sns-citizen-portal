package com.sns.repositories;

import com.sns.models.RejectedDuplicate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RejectedDuplicateRepository extends JpaRepository<RejectedDuplicate, Long> {

    Optional<RejectedDuplicate> findByComplaintId1AndComplaintId2(Long complaintId1, Long complaintId2);

    boolean existsByComplaintId1AndComplaintId2(Long complaintId1, Long complaintId2);
}
