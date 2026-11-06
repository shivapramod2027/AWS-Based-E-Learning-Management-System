package com.lms.dev.repository;

import com.lms.dev.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CourseModuleRepository extends JpaRepository<CourseModule, UUID> {

    @Query("SELECT cm FROM CourseModule cm WHERE cm.course.course_id = :courseId ORDER BY cm.moduleOrder ASC")
    List<CourseModule> findByCourse_Course_idOrderByModuleOrderAsc(@Param("courseId") UUID courseId);
}