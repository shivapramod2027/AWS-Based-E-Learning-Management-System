package com.lms.dev.repository;

import com.lms.dev.entity.Assignment;
import com.lms.dev.entity.AssignmentSubmission;
import com.lms.dev.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, UUID> {
    AssignmentSubmission findByAssignmentAndUser(Assignment assignment, User user);
    List<AssignmentSubmission> findByAssignmentOrderBySubmittedAtDesc(Assignment assignment);
    boolean existsByAssignmentAndUser(Assignment assignment, User user);
    void deleteAllByAssignment(Assignment assignment);
}
