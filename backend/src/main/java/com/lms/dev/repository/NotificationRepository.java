package com.lms.dev.repository;

import com.lms.dev.entity.Assignment;
import com.lms.dev.entity.Notification;
import com.lms.dev.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;
import com.lms.dev.entity.Course;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    List<Notification> findByAssignment(Assignment assignment);
    boolean existsByUserAndAssignmentAndType(User user, Assignment assignment, String type);
    boolean existsByUserAndCourseAndType(User user, Course course, String type);
    boolean existsByUserAndTypeAndCreatedAtBetween(User user, String type, LocalDateTime start, LocalDateTime end);
    long countByUserAndReadFalse(User user);
}
