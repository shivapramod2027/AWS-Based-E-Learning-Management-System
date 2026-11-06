package com.lms.dev.repository;

import com.lms.dev.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    @Query("SELECT a FROM Assignment a WHERE a.course.course_id IN :courseIds ORDER BY a.dueAt ASC")
    List<Assignment> findForCourseIds(@Param("courseIds") List<UUID> courseIds);
    List<Assignment> findAllByOrderByDueAtAsc();
    @Query("SELECT a FROM Assignment a JOIN FETCH a.course WHERE a.dueAt BETWEEN :start AND :end")
    List<Assignment> findDueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
